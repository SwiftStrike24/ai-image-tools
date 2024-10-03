import { NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";
import { getRedisClient } from "@/lib/redis";
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

const STRIPE_CUSTOMER_KEY_PREFIX = "stripe_customer:";
const NEXT_BILLING_DATE_KEY_PREFIX = "next_billing_date:";
const CANCELLATION_DATE_KEY_PREFIX = "cancellation_date:";

export async function POST() {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const redisClient = await getRedisClient();
    const stripeCustomerId = await redisClient.get(`${STRIPE_CUSTOMER_KEY_PREFIX}${userId}`);

    if (!stripeCustomerId) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 400 });
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
    
    // Remove the cancellation schedule
    const updatedSubscription = await stripe.subscriptions.update(subscription.id, {
      cancel_at_period_end: false,
    });

    const nextBillingDate = new Date(updatedSubscription.current_period_end * 1000).toISOString();

    // Update Redis with the new next billing date
    await redisClient.set(`${NEXT_BILLING_DATE_KEY_PREFIX}${userId}`, nextBillingDate);

    // Remove the cancellation date from Redis
    await redisClient.del(`${CANCELLATION_DATE_KEY_PREFIX}${userId}`);

    return NextResponse.json({ nextBillingDate });
  } catch (error) {
    console.error("Error renewing subscription:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}