import { NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";
import { getRedisClient } from "@/lib/redis";
import Stripe from 'stripe';
import { SubscriptionTier } from '@/actions/rateLimit';
import { supabaseAdmin } from '@/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

const STRIPE_CUSTOMER_KEY_PREFIX = "stripe_customer:";
const SUBSCRIPTION_KEY_PREFIX = "user_subscription:";
const NEXT_BILLING_DATE_KEY_PREFIX = "next_billing_date:";
const PENDING_DOWNGRADE_KEY_PREFIX = "pending_downgrade:";

export async function POST() {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const redisClient = await getRedisClient();
    const stripeCustomerId = await redisClient.get(`${STRIPE_CUSTOMER_KEY_PREFIX}${userId}`);

    if (!stripeCustomerId) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 400 });
    }

    // Retrieve the current subscription schedule
    const schedules = await stripe.subscriptionSchedules.list({
      customer: stripeCustomerId,
      limit: 1,
    });

    if (schedules.data.length > 0) {
      const currentSchedule = schedules.data[0];

      // Check the status before attempting to release
      if (currentSchedule.status === 'active' || currentSchedule.status === 'not_started') {
        // Release the schedule
        await stripe.subscriptionSchedules.release(currentSchedule.id);
      } else {
        console.log(`Subscription schedule is in ${currentSchedule.status} status; cannot release.`);
      }

      // Retrieve the current subscription
      const subscriptions = await stripe.subscriptions.list({
        customer: stripeCustomerId,
        status: 'active',
        limit: 1,
      });

      if (subscriptions.data.length > 0) {
        const subscription = subscriptions.data[0];

        // Update Redis and Supabase
        await updateUserSubscription(userId, subscription);
      }

      // Remove the pending downgrade from Redis
      await redisClient.del(`${PENDING_DOWNGRADE_KEY_PREFIX}${userId}`);

      return NextResponse.json({ message: 'Downgrade cancelled successfully' });
    } else {
      // If there's no schedule, check if the subscription is set to cancel
      const subscriptions = await stripe.subscriptions.list({
        customer: stripeCustomerId,
        status: 'active',
        limit: 1,
      });

      if (subscriptions.data.length > 0) {
        const subscription = subscriptions.data[0];
        if (subscription.cancel_at_period_end) {
          // Remove the cancellation
          await stripe.subscriptions.update(subscription.id, {
            cancel_at_period_end: false,
          });

          // Update Redis and Supabase
          await updateUserSubscription(userId, subscription);

          return NextResponse.json({ message: 'Cancellation removed successfully' });
        }
      }

      return NextResponse.json({ message: 'No pending downgrade or cancellation found' });
    }
  } catch (error) {
    console.error("Error cancelling downgrade:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function updateUserSubscription(userId: string, subscription: Stripe.Subscription) {
  const redisClient = await getRedisClient();

  const productId = subscription.items.data[0].price.product as string;
  const product = await stripe.products.retrieve(productId);
  let subscriptionTier: SubscriptionTier = 'basic';

  switch (product.name.toLowerCase()) {
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

  // Update next billing date
  const nextBillingDate = new Date(subscription.current_period_end * 1000).toISOString();
  await redisClient.set(`${NEXT_BILLING_DATE_KEY_PREFIX}${userId}`, nextBillingDate);

  console.log(`Updated subscription for user ${userId} to ${subscriptionTier}`);
}
