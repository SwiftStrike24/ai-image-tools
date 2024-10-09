import { RedisClientType } from 'redis';
import Stripe from 'stripe';
import { getRedisClient } from "./redis";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

const SUBSCRIPTION_TYPE_KEY_PREFIX = "subscription_type:";
const SUBSCRIPTION_KEY_PREFIX = "user_subscription:";
const NEXT_BILLING_DATE_KEY_PREFIX = "next_billing_date:";
const CACHE_KEY_PREFIX = "subscription_cache:";

export async function getSubscriptionData(userId: string, stripeCustomerId: string): Promise<{
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

export async function updateRedisWithSubscriptionData(redisClient: RedisClientType, userId: string, subscriptionData: any) {
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

export async function invalidateCache(userId: string) {
  const redisClient = await getRedisClient();
  await redisClient.del(`${CACHE_KEY_PREFIX}${userId}`);
}