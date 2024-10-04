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

    // Check if the customer exists in Stripe
    let customer;
    if (stripeCustomerId) {
      try {
        customer = await stripe.customers.retrieve(stripeCustomerId);
        if ((customer as Stripe.DeletedCustomer).deleted) {
          console.log(`Customer ${stripeCustomerId} was deleted in Stripe`);
          customer = null;
          stripeCustomerId = null;
          await redisClient.del(`${STRIPE_CUSTOMER_KEY_PREFIX}${userId}`);
        }
      } catch (error) {
        if (error instanceof Stripe.errors.StripeError && error.code === 'resource_missing') {
          console.log(`Customer ${stripeCustomerId} not found in Stripe`);
          customer = null;
          stripeCustomerId = null;
          await redisClient.del(`${STRIPE_CUSTOMER_KEY_PREFIX}${userId}`);
        } else {
          throw error;
        }
      }
    }

    // If customer doesn't exist, create a new one
    if (!customer) {
      console.log(`Creating new Stripe customer for user ${userId}`);
      customer = await stripe.customers.create({
        metadata: { userId },
      });
      stripeCustomerId = customer.id;
      await redisClient.set(`${STRIPE_CUSTOMER_KEY_PREFIX}${userId}`, stripeCustomerId);
    }

    // Check for active subscriptions
    console.log(`Checking for active subscriptions for customer ${stripeCustomerId}`);
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId as string,
      status: 'active',
      limit: 1,
    });

    let subscription = subscriptions.data[0];

    if (action === 'calculate') {
      // Calculate prorated amount
      console.log(`Calculating prorated amount for potential upgrade to ${newPlanId}`);
      const invoice = await stripe.invoices.retrieveUpcoming({
        customer: stripeCustomerId as string,
        subscription: subscription?.id,
        subscription_items: [{ 
          id: subscription?.items.data[0]?.id, 
          price: newPlanId 
        }],
      });

      const proratedAmount = invoice.amount_due / 100; // Convert cents to dollars

      return NextResponse.json({ 
        proratedAmount,
        currentPlanId: subscription?.items.data[0]?.price.id
      });
    } else if (action === 'confirm') {
      if (!subscription) {
        // If no active subscription, create a new one
        if (stripeCustomerId) {
          subscription = await stripe.subscriptions.create({
            customer: stripeCustomerId,
            items: [{ price: newPlanId }],
            metadata: { userId },
          });
        } else {
          throw new Error('Stripe customer ID is null');
        }
      } else {
        // Update existing subscription
        subscription = await stripe.subscriptions.update(subscription.id, {
          items: [{ id: subscription.items.data[0].id, price: newPlanId }],
          proration_behavior: 'always_invoice',
        });
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

      await supabaseAdmin
        .from('subscriptions')
        .upsert({
          clerk_id: userId,
          plan: subscriptionTier,
          status: 'active',
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'clerk_id'
        });

      console.log(`Subscription upgrade completed for user ${userId}`);
      return NextResponse.json({ 
        message: 'Subscription upgraded successfully',
        newSubscriptionTier: subscriptionTier
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