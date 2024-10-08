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
const SUBSCRIPTION_KEY_PREFIX = "user_subscription:";
const PENDING_DOWNGRADE_KEY_PREFIX = "pending_downgrade:";
const PENDING_UPGRADE_KEY_PREFIX = "pending_upgrade:";

export async function GET(request: Request) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ 
      error: 'Unauthorized',
      subscriptionType: 'basic',
      nextBillingDate: null,
      pendingUpgrade: null,
      pendingDowngrade: null,
      currentSubscription: 'basic'
    }, { status: 401 });
  }

  try {
    const redisClient = await getRedisClient();
    const stripeCustomerId = await redisClient.get(`${STRIPE_CUSTOMER_KEY_PREFIX}${userId}`);

    let subscriptionType = 'basic';
    let nextBillingDate = null;

    if (stripeCustomerId) {
      const subscriptions = await stripe.subscriptions.list({
        customer: stripeCustomerId,
        status: 'active',
        limit: 1,
      });

      if (subscriptions.data.length > 0) {
        const subscription = subscriptions.data[0];
        const product = await stripe.products.retrieve(subscription.items.data[0].price.product as string);
        subscriptionType = product.metadata.type || 'basic';
        nextBillingDate = new Date(subscription.current_period_end * 1000).toISOString();
      }
    }

    // Update Redis with the latest subscription information
    await redisClient.set(`${SUBSCRIPTION_TYPE_KEY_PREFIX}${userId}`, subscriptionType);
    if (nextBillingDate) {
      await redisClient.set(`${NEXT_BILLING_DATE_KEY_PREFIX}${userId}`, nextBillingDate);
    }

    const pendingDowngrade = await redisClient.get(`${PENDING_DOWNGRADE_KEY_PREFIX}${userId}`);
    const pendingUpgrade = await redisClient.get(`${PENDING_UPGRADE_KEY_PREFIX}${userId}`);
    const currentSubscription = await redisClient.get(`${SUBSCRIPTION_KEY_PREFIX}${userId}`) || 'basic';

    return NextResponse.json({ 
      subscriptionType, 
      nextBillingDate,
      pendingUpgrade,
      pendingDowngrade,
      currentSubscription
    });
  } catch (error) {
    console.error("Error checking subscription:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}