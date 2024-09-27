import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getRedisClient } from "@/lib/redis";
import { auth } from '@clerk/nextjs/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

const SUBSCRIPTION_KEY_PREFIX = "user_subscription:";
const STRIPE_CUSTOMER_KEY_PREFIX = "stripe_customer:";

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { planName } = await req.json();

    const redisClient = await getRedisClient();
    const currentSubscription = await redisClient.get(`${SUBSCRIPTION_KEY_PREFIX}${userId}`);

    if (!currentSubscription || currentSubscription === 'basic') {
      return NextResponse.json({ error: 'No active subscription to downgrade' }, { status: 400 });
    }

    // Get the customer's Stripe ID
    const stripeCustomerId = await redisClient.get(`${STRIPE_CUSTOMER_KEY_PREFIX}${userId}`);
    if (!stripeCustomerId) {
      console.error(`No Stripe customer found for user ${userId}`);
      return NextResponse.json({ error: 'No Stripe customer found' }, { status: 400 });
    }

    // Get the customer's active subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: 'active',
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return NextResponse.json({ error: 'No active Stripe subscription found' }, { status: 400 });
    }

    const subscription = subscriptions.data[0];

    // Schedule the downgrade at the end of the current period
    await stripe.subscriptions.update(subscription.id, {
      cancel_at_period_end: true,
      metadata: { downgradeTo: planName },
    });

    // Store the pending downgrade in Redis
    await redisClient.set(`${SUBSCRIPTION_KEY_PREFIX}${userId}:pending_downgrade`, planName);

    return NextResponse.json({ message: 'Downgrade scheduled successfully' });
  } catch (error) {
    console.error('Error in downgrade-subscription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}