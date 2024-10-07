import { NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";
import { getRedisClient } from "@/lib/redis";
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

const STRIPE_CUSTOMER_KEY_PREFIX = "stripe_customer:";
const SUBSCRIPTION_TYPE_KEY_PREFIX = "subscription_type:";
const NEXT_BILLING_DATE_KEY_PREFIX = "next_billing_date:";
const SUBSCRIPTION_CHECK_TIMESTAMP_PREFIX = "subscription_check_timestamp:";

export async function GET() {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const redisClient = await getRedisClient();
    const stripeCustomerId = await redisClient.get(`${STRIPE_CUSTOMER_KEY_PREFIX}${userId}`);
    const lastCheckTimestamp = await redisClient.get(`${SUBSCRIPTION_CHECK_TIMESTAMP_PREFIX}${userId}`);
    const currentSubscriptionType = await redisClient.get(`${SUBSCRIPTION_TYPE_KEY_PREFIX}${userId}`);

    // If the user is on the basic plan and we've checked recently, return the cached data
    if (currentSubscriptionType === 'basic' && lastCheckTimestamp) {
      const timeSinceLastCheck = Date.now() - parseInt(lastCheckTimestamp);
      if (timeSinceLastCheck < 3600000) { // Less than 1 hour
        return NextResponse.json({ subscriptionType: 'basic' });
      }
    }

    if (!stripeCustomerId) {
      // No Stripe customer ID, set as basic and update Redis
      await redisClient.set(`${SUBSCRIPTION_TYPE_KEY_PREFIX}${userId}`, 'basic');
      await redisClient.set(`${SUBSCRIPTION_CHECK_TIMESTAMP_PREFIX}${userId}`, Date.now().toString());
      return NextResponse.json({ subscriptionType: 'basic' });
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: 'active',
      limit: 1,
    });

    let subscriptionType = 'basic';
    let nextBillingDate = null;

    if (subscriptions.data.length > 0) {
      const subscription = subscriptions.data[0];
      const product = await stripe.products.retrieve(subscription.items.data[0].price.product as string);
      subscriptionType = product.metadata.type || 'basic';
      nextBillingDate = new Date(subscription.current_period_end * 1000).toISOString();
    }

    // Update Redis with the latest subscription information
    await redisClient.set(`${SUBSCRIPTION_TYPE_KEY_PREFIX}${userId}`, subscriptionType);
    if (nextBillingDate) {
      await redisClient.set(`${NEXT_BILLING_DATE_KEY_PREFIX}${userId}`, nextBillingDate);
    }
    await redisClient.set(`${SUBSCRIPTION_CHECK_TIMESTAMP_PREFIX}${userId}`, Date.now().toString());

    return NextResponse.json({ subscriptionType, nextBillingDate });
  } catch (error) {
    console.error("Error checking subscription:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
