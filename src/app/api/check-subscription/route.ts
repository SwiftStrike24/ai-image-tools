import { NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";
import { getRedisClient } from "@/lib/redis";
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

const STRIPE_CUSTOMER_KEY_PREFIX = "stripe_customer:";
const CANCELLATION_DATE_KEY_PREFIX = "cancellation_date:";
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

    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: 'active',
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 400 });
    }

    const subscription = subscriptions.data[0];

    // Check if a subscription schedule exists
    const schedules = await stripe.subscriptionSchedules.list({
      customer: stripeCustomerId,
      limit: 1,
    });

    const schedule = schedules.data.find(s => s.subscription === subscription.id);
    if (schedule) {
      const currentSchedule = schedules.data[0];

      // Check the status before attempting to update
      if (currentSchedule.status === 'active' || currentSchedule.status === 'not_started') {
        // Update the schedule to cancel at the end of the current period
        await stripe.subscriptionSchedules.update(currentSchedule.id, {
          end_behavior: 'cancel',
        });

        const cancellationDate = new Date(subscription.current_period_end * 1000).toISOString();

        // Update Redis with cancellation date
        await redisClient.set(`${NEXT_BILLING_DATE_KEY_PREFIX}${userId}`, cancellationDate);
        await redisClient.set(`${CANCELLATION_DATE_KEY_PREFIX}${userId}`, cancellationDate);
        await redisClient.set(`${PENDING_DOWNGRADE_KEY_PREFIX}${userId}`, 'basic');

        return NextResponse.json({ cancellationDate });
      } else {
        console.log(`Subscription schedule is in ${currentSchedule.status} status; cannot update.`);
        return NextResponse.json({ error: "Cannot cancel subscription schedule in its current status." }, { status: 400 });
      }
    } else {
      // No subscription schedule exists, so we can update the subscription directly
      const updatedSubscription = await stripe.subscriptions.update(subscription.id, {
        cancel_at_period_end: true,
      });

      const cancellationDate = new Date(updatedSubscription.current_period_end * 1000).toISOString();

      // Update Redis with cancellation date
      await redisClient.set(`${NEXT_BILLING_DATE_KEY_PREFIX}${userId}`, cancellationDate);
      await redisClient.set(`${CANCELLATION_DATE_KEY_PREFIX}${userId}`, cancellationDate);
      await redisClient.set(`${PENDING_DOWNGRADE_KEY_PREFIX}${userId}`, 'basic');

      return NextResponse.json({ cancellationDate });
    }
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
