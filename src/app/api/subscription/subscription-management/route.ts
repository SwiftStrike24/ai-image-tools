import { NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";
import { getRedisClient } from "@/lib/redis";
import Stripe from 'stripe';
import { SubscriptionTier } from '@/actions/rateLimit';
import { supabaseAdmin } from '@/lib/supabase';
import { invalidateCache } from '@/lib/subscriptionUtils'; // Updated import
import { pusherServer } from '@/lib/pusher';
import { RedisClientType } from 'redis';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

const STRIPE_CUSTOMER_KEY_PREFIX = "stripe_customer:";
const SUBSCRIPTION_KEY_PREFIX = "user_subscription:";
const NEXT_BILLING_DATE_KEY_PREFIX = "next_billing_date:";
const PENDING_DOWNGRADE_KEY_PREFIX = "pending_downgrade:";
const PENDING_UPGRADE_KEY_PREFIX = "pending_upgrade:";
const CANCELLATION_DATE_KEY_PREFIX = "cancellation_date:";

const MAX_RETRIES = 3;

/**
 * Retry an operation with exponential backoff
 * @param operation Function to retry
 * @returns Result of the operation
 * @throws Last error encountered
 */
async function retryOperation<T>(operation: () => Promise<T>): Promise<T> {
  let lastError;
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      return await operation();
    } catch (error) {
      console.error(`Operation failed (attempt ${i + 1}/${MAX_RETRIES}):`, error);
      lastError = error;
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
  throw lastError;
}

/**
 * Notify user about subscription update via Pusher
 * @param userId User ID
 */
async function notifySubscriptionUpdate(userId: string) {
  await pusherServer.trigger(`private-user-${userId}`, 'subscription-updated', {});
}


export async function POST(req: Request) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { action, planName, newPlanId, subAction } = await req.json();

  if (!action || (action === 'upgrade' && (!newPlanId || !subAction))) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  try {
    const redisClient = await getRedisClient();
    const stripeCustomerId = await redisClient.get(`${STRIPE_CUSTOMER_KEY_PREFIX}${userId}`);

    // If there's no Stripe customer ID, we need to create one
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        metadata: { userId },
      });
      await redisClient.set(`${STRIPE_CUSTOMER_KEY_PREFIX}${userId}`, customer.id);
      
      // For a new customer, we'll redirect to checkout instead of trying to manage a non-existent subscription
      if (action === 'upgrade' || action === 'subscribe') {
        const session = await createCheckoutSession(customer.id, userId, newPlanId);
        return NextResponse.json({ url: session.url });
      }
      
      // For other actions, we can return an error or handle as needed
      return NextResponse.json({ error: 'No active subscription found' }, { status: 400 });
    }

    let result;
    switch (action) {
      case 'cancel':
        result = await retryOperation(() => cancelSubscription(userId, stripeCustomerId, redisClient));
        break;
      case 'cancelDowngrade':
        result = await retryOperation(() => cancelDowngrade(userId, stripeCustomerId, redisClient));
        break;
      case 'cancelUpgrade':
        result = await retryOperation(() => cancelUpgrade(userId, stripeCustomerId, redisClient));
        break;
      case 'downgrade':
        result = await retryOperation(() => downgradeSubscription(userId, stripeCustomerId, redisClient, planName));
        break;
      case 'upgrade':
        // Always use scheduled upgrade for existing paid subscriptions
        result = await retryOperation(() => scheduleUpgradeSubscription(userId, stripeCustomerId, redisClient, newPlanId));
        break;
      case 'renew':
        result = await retryOperation(() => renewSubscription(userId, stripeCustomerId, redisClient));
        break;
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    await invalidateCache(userId);
    await notifySubscriptionUpdate(userId);

    return NextResponse.json(result);
  } catch (error) {
    console.error(`Error in subscription management (${action}):`, error);
    
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }

    return NextResponse.json({ error: "Internal server error", details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

/**
 * Batch update Redis keys
 * @param redisClient Redis client
 * @param operations Array of key-value pairs to update
 */
async function batchUpdateRedis(redisClient: RedisClientType, operations: Array<[string, string]>) {
  const pipeline = redisClient.multi();
  
  for (const [key, value] of operations) {
    pipeline.set(key, value);
  }

  await pipeline.exec();
}

async function cancelSubscription(userId: string, stripeCustomerId: string, redisClient: RedisClientType) {
  const subscriptions = await stripe.subscriptions.list({
    customer: stripeCustomerId,
    status: 'active',
    limit: 1,
  });


  if (subscriptions.data.length === 0) {
    return NextResponse.json({ error: 'No active subscription found' }, { status: 400 });
  }

  const subscription = subscriptions.data[0];
  const updatedSubscription = await stripe.subscriptions.update(subscription.id, {
    cancel_at_period_end: true,
  });

  const cancellationDate = new Date(updatedSubscription.current_period_end * 1000).toISOString();

  await batchUpdateRedis(redisClient, [
    [`${NEXT_BILLING_DATE_KEY_PREFIX}${userId}`, cancellationDate],
    [`${CANCELLATION_DATE_KEY_PREFIX}${userId}`, cancellationDate]
  ]);

  // Update Supabase
  await supabaseAdmin
    .from('subscriptions')
    .update({
      status: 'canceling',
      updated_at: new Date().toISOString(),
    })
    .eq('clerk_id', userId);

  return { cancellationDate };
}


async function cancelDowngrade(userId: string, stripeCustomerId: string, redisClient: RedisClientType) {
  const subscriptions = await stripe.subscriptions.list({
    customer: stripeCustomerId,
    status: 'active',
    limit: 1,
  });

  if (subscriptions.data.length > 0) {
    const subscription = subscriptions.data[0];

    if (subscription.cancel_at_period_end) {
      // If the subscription is set to cancel at period end, remove the cancellation
      await stripe.subscriptions.update(subscription.id, {
        cancel_at_period_end: false,
      });

      console.log(`Cancelled downgrade for subscription ${subscription.id}`);
    }

    // Check for any pending subscription schedule
    const schedules = await stripe.subscriptionSchedules.list({
      customer: stripeCustomerId,
      limit: 1,
    });

    if (schedules.data.length > 0) {
      const currentSchedule = schedules.data[0];

      if (currentSchedule.status === 'active' || currentSchedule.status === 'not_started') {
        await stripe.subscriptionSchedules.release(currentSchedule.id);
        console.log(`Released subscription schedule ${currentSchedule.id}`);
      }
    }

    await updateUserSubscription(userId, subscription, redisClient);

    await redisClient.del(`${PENDING_DOWNGRADE_KEY_PREFIX}${userId}`);
    await redisClient.del(`${CANCELLATION_DATE_KEY_PREFIX}${userId}`);

    await supabaseAdmin
      .from('subscriptions')
      .update({
        pending_downgrade: null,
        updated_at: new Date().toISOString(),
      })
      .eq('clerk_id', userId);

    await invalidateCache(userId);

    return NextResponse.json({ message: 'Downgrade cancelled successfully' });
  } else {
    return NextResponse.json({ message: 'No active subscription found' }, { status: 400 });
  }
}

async function cancelUpgrade(userId: string, stripeCustomerId: string, redisClient: RedisClientType) {
  const schedules = await stripe.subscriptionSchedules.list({
    customer: stripeCustomerId,
    limit: 1,
  });

  if (schedules.data.length > 0) {
    const currentSchedule = schedules.data[0];
    await stripe.subscriptionSchedules.release(currentSchedule.id);

    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: 'active',
      limit: 1,
    });

    if (subscriptions.data.length > 0) {
      const subscription = subscriptions.data[0];
      await updateUserSubscription(userId, subscription, redisClient);
    }

    await redisClient.del(`${PENDING_UPGRADE_KEY_PREFIX}${userId}`);

    await supabaseAdmin
      .from('subscriptions')
      .update({
        pending_upgrade: null,
        updated_at: new Date().toISOString(),
      })
      .eq('clerk_id', userId);

    return NextResponse.json({ message: 'Upgrade cancelled successfully' });
  } else {
    return NextResponse.json({ message: 'No pending upgrade found' });
  }
}

async function downgradeSubscription(userId: string, stripeCustomerId: string, redisClient: RedisClientType, planName: string) {
  const currentSubscription = await redisClient.get(`${SUBSCRIPTION_KEY_PREFIX}${userId}`);

  if (currentSubscription?.toLowerCase() === planName.toLowerCase()) {
    return NextResponse.json({ error: 'Already subscribed to this plan' }, { status: 400 });
  }

  const subscriptions = await stripe.subscriptions.list({
    customer: stripeCustomerId,
    status: 'active',
    limit: 1,
  });

  if (subscriptions.data.length > 0) {
    const subscription = subscriptions.data[0];
    const newPlanId = getPlanIdFromName(planName);
    if (!newPlanId) {
      return NextResponse.json({ error: 'Invalid plan name' }, { status: 400 });
    }

    const schedule = await stripe.subscriptionSchedules.create({
      from_subscription: subscription.id,
    });

    await stripe.subscriptionSchedules.update(schedule.id, {
      end_behavior: 'release',
      phases: [
        {
          start_date: subscription.current_period_start,
          end_date: subscription.current_period_end,
          items: [{ price: subscription.items.data[0].price.id, quantity: 1 }],
        },
        {
          start_date: subscription.current_period_end,
          items: [{ price: newPlanId, quantity: 1 }],
        },
      ],
    });

    await redisClient.set(`${PENDING_DOWNGRADE_KEY_PREFIX}${userId}`, planName);

    const nextBillingDate = new Date(subscription.current_period_end * 1000).toISOString();
    await redisClient.set(`${NEXT_BILLING_DATE_KEY_PREFIX}${userId}`, nextBillingDate);

    return NextResponse.json({ 
      message: `Downgrade to ${planName} scheduled successfully`,
      nextBillingDate,
      pendingDowngrade: planName
    });
  }

  return NextResponse.json({ error: 'No active subscription found' }, { status: 400 });
}


async function scheduleUpgradeSubscription(userId: string, stripeCustomerId: string, redisClient: RedisClientType, newPlanId: string) {
  const subscriptions = await stripe.subscriptions.list({
    customer: stripeCustomerId,
    status: 'active',
    limit: 1,
  });

  if (subscriptions.data.length === 0) {
    return NextResponse.json({ error: 'No active subscription found' }, { status: 400 });
  }

  const subscription = subscriptions.data[0];

  // Schedule upgrade for next billing cycle
  const schedule = await stripe.subscriptionSchedules.create({
    from_subscription: subscription.id,
  });

  await stripe.subscriptionSchedules.update(schedule.id, {
    end_behavior: 'release',
    phases: [
      {
        start_date: subscription.current_period_start,
        end_date: subscription.current_period_end,
        items: [{ price: subscription.items.data[0].price.id, quantity: 1 }],
      },
      {
        start_date: subscription.current_period_end,
        items: [{ price: newPlanId, quantity: 1 }],
      },
    ],
  });

  const newPlan = await stripe.prices.retrieve(newPlanId);
  const newProductId = newPlan.product as string;
  const newProduct = await stripe.products.retrieve(newProductId);
  let subscriptionTier: SubscriptionTier = 'basic';

  switch (newProduct.name.toLowerCase()) {
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

  await redisClient.set(`${PENDING_UPGRADE_KEY_PREFIX}${userId}`, subscriptionTier);
  const nextBillingDate = new Date(subscription.current_period_end * 1000).toISOString();
  await redisClient.set(`${NEXT_BILLING_DATE_KEY_PREFIX}${userId}`, nextBillingDate);

  await supabaseAdmin
    .from('subscriptions')
    .update({
      pending_upgrade: subscriptionTier,
      updated_at: new Date().toISOString(),
    })
    .eq('clerk_id', userId);

  await invalidateCache(userId);
  console.log(`Subscription upgrade scheduled for user ${userId} to ${subscriptionTier}`);

  return { 
    message: 'Subscription upgrade scheduled successfully',
    pendingUpgrade: subscriptionTier,
    nextBillingDate
  };
}

async function renewSubscription(userId: string, stripeCustomerId: string, redisClient: RedisClientType) {
  const subscriptions = await stripe.subscriptions.list({
    customer: stripeCustomerId,
    status: 'active',
    limit: 1,
  });

  if (subscriptions.data.length === 0) {
    return NextResponse.json({ error: 'No active subscription found' }, { status: 400 });
  }

  const subscription = subscriptions.data[0];
  
  const updatedSubscription = await stripe.subscriptions.update(subscription.id, {
    cancel_at_period_end: false,
  });

  const nextBillingDate = new Date(updatedSubscription.current_period_end * 1000).toISOString();

  await redisClient.set(`${NEXT_BILLING_DATE_KEY_PREFIX}${userId}`, nextBillingDate);
  await redisClient.del(`${CANCELLATION_DATE_KEY_PREFIX}${userId}`);

  await invalidateCache(userId);

  return NextResponse.json({ nextBillingDate });
}

async function updateUserSubscription(userId: string, subscription: Stripe.Subscription, redisClient: RedisClientType) {
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
  
  const nextBillingDate = new Date(subscription.current_period_end * 1000).toISOString();
  await redisClient.set(`${NEXT_BILLING_DATE_KEY_PREFIX}${userId}`, nextBillingDate);

  if (subscription.cancel_at_period_end) {
    await redisClient.set(`${CANCELLATION_DATE_KEY_PREFIX}${userId}`, nextBillingDate);
  } else {
    await redisClient.del(`${CANCELLATION_DATE_KEY_PREFIX}${userId}`);
  }

  // Update Supabase
  await supabaseAdmin
    .from('subscriptions')
    .update({
      plan: subscriptionTier,
      status: subscription.cancel_at_period_end ? 'canceling' : 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('clerk_id', userId);

  console.log(`Updated subscription for user ${userId} to ${subscriptionTier}, status: ${subscription.cancel_at_period_end ? 'canceling' : 'active'}`);

  await invalidateCache(userId);
}


function getPlanIdFromName(planName: string): string | null {
  const planMap: { [key: string]: string } = {
    'Pro': 'price_1Q3AztHYPfrMrymk4VqOuNAD',
    'Premium': 'price_1Q3B16HYPfrMrymkgzihBxJR',
    'Ultimate': 'price_1Q3B2gHYPfrMrymkYyJgjmci',
  };
  return planMap[planName] || null;
}

// Add this new function to create a checkout session
async function createCheckoutSession(customerId: string, userId: string, priceId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const successUrl = `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${baseUrl}/pricing`;

  return await stripe.checkout.sessions.create({
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    subscription_data: {
      metadata: { userId },
    },
    metadata: { userId }
  });
}