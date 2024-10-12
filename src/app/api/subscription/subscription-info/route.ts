import { NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";
import { getRedisClient } from "@/lib/redis";
import Stripe from 'stripe';
import { RedisClientType } from 'redis';
import { getSubscriptionData as getStripeSubscriptionData, updateRedisWithSubscriptionData as updateRedisData } from '@/lib/subscriptionUtils';
import { saveUserToSupabase, getUserSubscription } from '@/lib/supabase';

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

/**
 * Get a random TTL based on the base TTL and a variance
 * @param baseTTL Base TTL in seconds
 * @param variance Variance in seconds
 * @returns Random TTL in seconds
 */
function getRandomTTL(baseTTL: number, variance: number = 60) {
  return baseTTL + Math.floor(Math.random() * variance);
}

/**
 * Get subscription data from Stripe
 * @param userId User ID
 * @param stripeCustomerId Stripe customer ID
 * @returns Subscription data
 */
async function getSubscriptionData(userId: string, stripeCustomerId: string): Promise<{
  subscriptionType: string;
  nextBillingDate: string | null;
  status: string;
}> {
  const subscriptions = await stripe.subscriptions.list({
    customer: stripeCustomerId,
    limit: 1,
  });

  if (subscriptions.data.length > 0) {
    const subscription = subscriptions.data[0];
    const product = await stripe.products.retrieve(subscription.items.data[0].price.product as string);
    return {
      subscriptionType: product.name.toLowerCase(),
      nextBillingDate: new Date(subscription.current_period_end * 1000).toISOString(),
      status: subscription.cancel_at_period_end ? 'canceling' : subscription.status,
    };
  }

  return { subscriptionType: 'basic', nextBillingDate: null, status: 'inactive' };
}

/**
 * Update Redis with subscription data
 * @param redisClient Redis client
 * @param userId User ID
 * @param subscriptionData Subscription data
 */
async function updateRedisWithSubscriptionData(redisClient: RedisClientType, userId: string, subscriptionData: any) {
  const { subscriptionType, nextBillingDate, status } = subscriptionData;
  const pipeline = redisClient.multi();
  
  pipeline.set(`${SUBSCRIPTION_TYPE_KEY_PREFIX}${userId}`, subscriptionType);
  pipeline.set(`${SUBSCRIPTION_KEY_PREFIX}${userId}`, subscriptionType);
  pipeline.set(`${SUBSCRIPTION_KEY_PREFIX}${userId}:status`, status);
  if (nextBillingDate) {
    pipeline.set(`${NEXT_BILLING_DATE_KEY_PREFIX}${userId}`, nextBillingDate);
  }

  await pipeline.exec();
}

export async function GET(request: Request) {
  const { userId } = auth();

  if (!userId) {
    console.log('User not authenticated');
    return NextResponse.json({ 
      error: 'Unauthorized',
      subscriptionType: 'basic',
      nextBillingDate: null,
      pendingUpgrade: null,
      pendingDowngrade: null,
      currentSubscription: 'basic',
      status: 'inactive'
    }, { status: 401 });
  }

  try {
    console.log(`Fetching subscription info for user ${userId}`);
    const redisClient = await getRedisClient();
    const cacheKey = `${CACHE_KEY_PREFIX}${userId}`;

    // Keep the cache check, but add logging
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      const responseData = JSON.parse(cachedData);
      console.log(`Cached subscription data for user ${userId}:`, JSON.stringify(responseData, null, 2));
      return NextResponse.json(responseData);
    }

    const stripeCustomerId = await redisClient.get(`${STRIPE_CUSTOMER_KEY_PREFIX}${userId}`);
    console.log(`Stripe customer ID for user ${userId}:`, stripeCustomerId);

    let subscriptionData: {
      subscriptionType: string;
      nextBillingDate: string | null;
      status: string;
    };

    if (stripeCustomerId) {
      subscriptionData = await getStripeSubscriptionData(userId, stripeCustomerId);
      console.log(`Stripe subscription data for user ${userId}:`, JSON.stringify(subscriptionData, null, 2));
    } else {
      const supabaseSubscription = await getUserSubscription(userId);
      if (supabaseSubscription) {
        subscriptionData = {
          subscriptionType: supabaseSubscription.plan,
          nextBillingDate: null,
          status: supabaseSubscription.status,
        };
        console.log(`Supabase subscription data for user ${userId}:`, JSON.stringify(subscriptionData, null, 2));
      } else {
        await saveUserToSupabase(userId);
        subscriptionData = {
          subscriptionType: 'basic',
          nextBillingDate: null,
          status: 'active',
        };
        console.log(`New basic subscription created for user ${userId}`);
      }
    }

    await updateRedisData(redisClient, userId, subscriptionData);

    const [pendingDowngrade, pendingUpgrade, currentSubscription] = await Promise.all([
      redisClient.get(`${PENDING_DOWNGRADE_KEY_PREFIX}${userId}`),
      redisClient.get(`${PENDING_UPGRADE_KEY_PREFIX}${userId}`),
      redisClient.get(`${SUBSCRIPTION_KEY_PREFIX}${userId}`)
    ]);

    const responseData = { 
      ...subscriptionData,
      pendingUpgrade: null,
      pendingDowngrade: null,
      currentSubscription: subscriptionData.subscriptionType
    };

    // Keep caching, but add logging
    await redisClient.set(
      cacheKey,
      JSON.stringify(responseData),
      { EX: getRandomTTL(BASE_CACHE_TTL) }
    );
    console.log(`Updated cache for user ${userId}`);

    console.log(`Returning subscription info for user ${userId}:`, JSON.stringify(responseData, null, 2));
    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error checking subscription:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
