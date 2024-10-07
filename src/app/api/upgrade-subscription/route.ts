import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@clerk/nextjs/server';
import { getRedisClient } from "@/lib/redis";
import { supabaseAdmin } from '@/lib/supabase';
import { SubscriptionTier } from '@/actions/rateLimit';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

const STRIPE_CUSTOMER_KEY_PREFIX = "stripe_customer:";
const SUBSCRIPTION_KEY_PREFIX = "user_subscription:";
const PENDING_UPGRADE_KEY_PREFIX = "pending_upgrade:";
const NEXT_BILLING_DATE_KEY_PREFIX = "next_billing_date:";

export async function POST(req: Request) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { newPlanId, action } = await req.json();
    if (!newPlanId) {
      return NextResponse.json({ error: 'New plan ID is required' }, { status: 400 });
    }

    const redisClient = await getRedisClient();
    let stripeCustomerId = await redisClient.get(`${STRIPE_CUSTOMER_KEY_PREFIX}${userId}`);

    console.log(`Stripe Customer ID for user ${userId}: ${stripeCustomerId}`);

    if (!stripeCustomerId) {
      return NextResponse.json({ error: 'No Stripe customer found' }, { status: 400 });
    }

    // Check for active subscriptions
    console.log(`Checking for active subscriptions for customer ${stripeCustomerId}`);
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: 'active',
      limit: 1,
    });

    let subscription = subscriptions.data[0];

    if (!subscription) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 400 });
    }

    // Check for existing subscription schedule
    const schedules = await stripe.subscriptionSchedules.list({
      customer: stripeCustomerId,
      limit: 1,
    });

    let existingSchedule = schedules.data[0];

    if (action === 'calculate') {
      // Calculate prorated amount
      console.log(`Calculating prorated amount for potential upgrade to ${newPlanId}`);
      const invoice = await stripe.invoices.retrieveUpcoming({
        customer: stripeCustomerId,
        subscription: subscription.id,
        subscription_items: [{ 
          id: subscription.items.data[0].id, 
          price: newPlanId 
        }],
      });

      const proratedAmount = invoice.amount_due / 100; // Convert cents to dollars

      return NextResponse.json({ 
        proratedAmount,
        currentPlanId: subscription.items.data[0].price.id
      });
    } else if (action === 'confirm') {
      // Update existing subscription
      try {
        subscription = await stripe.subscriptions.update(subscription.id, {
          items: [{ id: subscription.items.data[0].id, price: newPlanId }],
          proration_behavior: 'always_invoice',
        });
      } catch (error) {
        console.error('Error updating subscription:', error);
        return NextResponse.json({ error: 'Failed to update subscription. Please try again.' }, { status: 400 });
      }

      // Update Redis and Supabase
      console.log(`Updating Redis and Supabase for user ${userId}`);
      const newPlan = await stripe.prices.retrieve(newPlanId);
      const newProductId = newPlan.product as string;
      const newProduct = await stripe.products.retrieve(newProductId);
      let subscriptionTier: SubscriptionTier = 'basic';

      switch (newProduct.name.toLowerCase()) {
        case 'pro':
          subscriptionTier = 'pro';
          break;
        case 'premium':
          subscriptionTier = 'premium';
          break;
        case 'ultimate':
          subscriptionTier = 'ultimate';
          break;
      }

      await redisClient.set(`${SUBSCRIPTION_KEY_PREFIX}${userId}`, subscriptionTier);
      await redisClient.del(`${PENDING_UPGRADE_KEY_PREFIX}${userId}`);

      await supabaseAdmin
        .from('subscriptions')
        .upsert({
          clerk_id: userId,
          plan: subscriptionTier,
          status: 'active',
          updated_at: new Date().toISOString(),
          pending_upgrade: null,
        }, {
          onConflict: 'clerk_id'
        });

      console.log(`Subscription upgrade completed for user ${userId}`);
      return NextResponse.json({ 
        message: 'Subscription upgraded successfully',
        newSubscriptionTier: subscriptionTier
      });
    } else if (action === 'schedule') {
      const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
      
      try {
        if (existingSchedule) {
          // If there's an existing schedule in 'released' status, create a new one
          if (existingSchedule.status === 'released') {
            existingSchedule = await stripe.subscriptionSchedules.create({
              from_subscription: subscription.id,
            });
          }

          // Update existing schedule
          existingSchedule = await stripe.subscriptionSchedules.update(existingSchedule.id, {
            end_behavior: 'release',
            phases: [
              {
                start_date: subscription.current_period_start,
                end_date: subscription.current_period_end,
                items: [{ price: subscription.items.data[0].price.id, quantity: 1 }],
              },
              {
                start_date: subscription.current_period_end,
                items: [{ price: newPlanId, quantity: 1 }],
              },
            ],
          });
        } else {
          // Create a new subscription schedule
          existingSchedule = await stripe.subscriptionSchedules.create({
            from_subscription: subscription.id,
          });

          // Update the schedule with the new plan
          existingSchedule = await stripe.subscriptionSchedules.update(existingSchedule.id, {
            end_behavior: 'release',
            phases: [
              {
                start_date: subscription.current_period_start,
                end_date: subscription.current_period_end,
                items: [{ price: subscription.items.data[0].price.id, quantity: 1 }],
              },
              {
                start_date: subscription.current_period_end,
                items: [{ price: newPlanId, quantity: 1 }],
              },
            ],
          });
        }
      } catch (error) {
        console.error('Error updating subscription schedule:', error);
        return NextResponse.json({ error: 'Failed to schedule upgrade. Please try again.' }, { status: 400 });
      }

      // Update Redis and Supabase to reflect the pending upgrade
      const newPlan = await stripe.prices.retrieve(newPlanId);
      const newProductId = newPlan.product as string;
      const newProduct = await stripe.products.retrieve(newProductId);
      let newSubscriptionTier: SubscriptionTier = 'basic';

      switch (newProduct.name.toLowerCase()) {
        case 'pro':
          newSubscriptionTier = 'pro';
          break;
        case 'premium':
          newSubscriptionTier = 'premium';
          break;
        case 'ultimate':
          newSubscriptionTier = 'ultimate';
          break;
      }

      await redisClient.set(`${PENDING_UPGRADE_KEY_PREFIX}${userId}`, newSubscriptionTier);
      await redisClient.set(`${NEXT_BILLING_DATE_KEY_PREFIX}${userId}`, currentPeriodEnd.toISOString());

      await supabaseAdmin
        .from('subscriptions')
        .update({
          pending_upgrade: newSubscriptionTier,
          updated_at: new Date().toISOString(),
        })
        .eq('clerk_id', userId);

      return NextResponse.json({ 
        message: 'Subscription upgrade scheduled successfully',
        nextBillingDate: currentPeriodEnd.toISOString(),
        newSubscriptionTier: newSubscriptionTier
      });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error updating subscription:', error);
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json({ error: `Stripe error: ${error.message}` }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}