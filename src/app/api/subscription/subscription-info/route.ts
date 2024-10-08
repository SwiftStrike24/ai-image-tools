import { NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";
import { getRedisClient } from "@/lib/redis";
import Stripe from 'stripe';
import { RedisClientType } from 'redis';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

const STRIPE_CUSTOMER_KEY_PREFIX = "stripe_customer:";
const SUBSCRIPTION_TYPE_KEY_PREFIX = "subscription_type:";
const NEXT_BILLING_DATE_KEY_PREFIX = "next_billing_date:";
const SUBSCRIPTION_KEY_PREFIX = "user_subscription:";
const PENDING_DOWNGRADE_KEY_PREFIX = "pending_downgrade:";
const PENDING_UPGRADE_KEY_PREFIX = "pending_upgrade:";
const CACHE_KEY_PREFIX = "subscription_cache:";
const BASE_CACHE_TTL = 300; // 5 minutes in seconds

// Helper function to get a random TTL
function getRandomTTL(baseTTL: number, variance: number = 60) {
  return baseTTL + Math.floor(Math.random() * variance);
}

// Helper function to get subscription data
async function getSubscriptionData(userId: string, stripeCustomerId: string): Promise<{
  subscriptionType: string;
  nextBillingDate: string | null;
}> {
  const subscriptions = await stripe.subscriptions.list({
    customer: stripeCustomerId,
    status: 'active',
    limit: 1,
  });

  if (subscriptions.data.length > 0) {
    const subscription = subscriptions.data[0];
    const product = await stripe.products.retrieve(subscription.items.data[0].price.product as string);
    return {
      subscriptionType: product.metadata.type || 'basic',
      nextBillingDate: new Date(subscription.current_period_end * 1000).toISOString(),
    };
  }

  return { subscriptionType: 'basic', nextBillingDate: null };
}

// Helper function to update Redis with subscription data using pipeline
async function updateRedisWithSubscriptionData(redisClient: RedisClientType, userId: string, subscriptionData: any) {
  const { subscriptionType, nextBillingDate } = subscriptionData;
  const pipeline = redisClient.multi();
  
  pipeline.set(`${SUBSCRIPTION_TYPE_KEY_PREFIX}${userId}`, subscriptionType);
  if (nextBillingDate) {
    pipeline.set(`${NEXT_BILLING_DATE_KEY_PREFIX}${userId}`, nextBillingDate);
  }

  await pipeline.exec();
}

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
    
    // Check cache first
    const cachedData = await redisClient.get(`${CACHE_KEY_PREFIX}${userId}`);
    if (cachedData) {
      return NextResponse.json(JSON.parse(cachedData));
    }

    const stripeCustomerId = await redisClient.get(`${STRIPE_CUSTOMER_KEY_PREFIX}${userId}`);

    let subscriptionData: {
      subscriptionType: string;
      nextBillingDate: string | null;
    } = { subscriptionType: 'basic', nextBillingDate: null };

    if (stripeCustomerId) {
      subscriptionData = await getSubscriptionData(userId, stripeCustomerId);
    }

    // Update Redis with the latest subscription information
    await updateRedisWithSubscriptionData(redisClient, userId, subscriptionData);

    // Use pipeline for multiple gets
    const pipeline = redisClient.multi();
    pipeline.get(`${PENDING_DOWNGRADE_KEY_PREFIX}${userId}`);
    pipeline.get(`${PENDING_UPGRADE_KEY_PREFIX}${userId}`);
    pipeline.get(`${SUBSCRIPTION_KEY_PREFIX}${userId}`);

    const [pendingDowngrade, pendingUpgrade, currentSubscription] = await pipeline.exec();

    const responseData = { 
      ...subscriptionData,
      pendingUpgrade,
      pendingDowngrade,
      currentSubscription: currentSubscription || 'basic'
    };

    // Cache the response with a randomized TTL
    const cacheTTL = getRandomTTL(BASE_CACHE_TTL);
    await redisClient.set(
      `${CACHE_KEY_PREFIX}${userId}`,
      JSON.stringify(responseData),
      { EX: cacheTTL }
    );

    // For active users, set up a background refresh
    if (subscriptionData.subscriptionType !== 'basic') {
      setTimeout(async () => {
        const freshData = await getSubscriptionData(userId, stripeCustomerId!);
        await updateRedisWithSubscriptionData(redisClient, userId, freshData);
        await redisClient.set(
          `${CACHE_KEY_PREFIX}${userId}`,
          JSON.stringify({ ...responseData, ...freshData }),
          { EX: getRandomTTL(BASE_CACHE_TTL) }
        );
      }, (cacheTTL - 60) * 1000); // Refresh 1 minute before expiration
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error checking subscription:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Helper function to invalidate cache
export async function invalidateCache(userId: string) {
  const redisClient = await getRedisClient();
  await redisClient.del(`${CACHE_KEY_PREFIX}${userId}`);
}