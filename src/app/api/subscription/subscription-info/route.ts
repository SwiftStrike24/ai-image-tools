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
    const redisClient = await getRedisClient();
    const cacheKey = `${CACHE_KEY_PREFIX}${userId}`;

    // Try to get subscription data from cache
    const cachedData = await redisClient.get(cacheKey);

    if (cachedData) {
      const responseData = JSON.parse(cachedData);
      return NextResponse.json(responseData);
    }

    // If not cached, proceed to fetch data
    const stripeCustomerId = await redisClient.get(`${STRIPE_CUSTOMER_KEY_PREFIX}${userId}`);

    let subscriptionData: {
      subscriptionType: string;
      nextBillingDate: string | null;
      status: string;
    } = { subscriptionType: 'basic', nextBillingDate: null, status: 'inactive' };

    if (stripeCustomerId) {
      subscriptionData = await getStripeSubscriptionData(userId, stripeCustomerId);
    } else {
      // If there's no Stripe customer ID, check Supabase for the user's subscription
      const supabaseSubscription = await getUserSubscription(userId);
      if (supabaseSubscription) {
        subscriptionData = {
          subscriptionType: supabaseSubscription.plan,
          nextBillingDate: null, // Supabase doesn't store this information
          status: supabaseSubscription.status,
        };
      } else {
        // If no subscription found in Supabase, save the user and create a basic subscription
        await saveUserToSupabase(userId);
        subscriptionData = {
          subscriptionType: 'basic',
          nextBillingDate: null,
          status: 'active',
        };
      }
    }

    await updateRedisData(redisClient, userId, subscriptionData);

    // Fetch pendingUpgrade, pendingDowngrade, currentSubscription
    const pipeline = redisClient.multi();
    pipeline.get(`${PENDING_DOWNGRADE_KEY_PREFIX}${userId}`);
    pipeline.get(`${PENDING_UPGRADE_KEY_PREFIX}${userId}`);
    pipeline.get(`${SUBSCRIPTION_KEY_PREFIX}${userId}`);
    const results = await pipeline.exec();
    const [pendingDowngradeResult, pendingUpgradeResult, currentSubscriptionResult] = results as [string | null, string | null, string | null];

    const pendingDowngrade = pendingDowngradeResult;
    const pendingUpgrade = pendingUpgradeResult;
    const currentSubscription = currentSubscriptionResult;

    const responseData = { 
      ...subscriptionData,
      pendingUpgrade,
      pendingDowngrade,
      currentSubscription: currentSubscription || subscriptionData.subscriptionType
    };

    // Cache the response data
    await redisClient.set(
      cacheKey,
      JSON.stringify(responseData),
      { EX: getRandomTTL(BASE_CACHE_TTL) }
    );

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error checking subscription:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
