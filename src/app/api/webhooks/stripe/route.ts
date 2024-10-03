import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getRedisClient } from "@/lib/redis";
import { SubscriptionTier } from '@/actions/rateLimit';
import { headers } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase'; // Add this import
import { clerkClient } from "@clerk/nextjs/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

const SUBSCRIPTION_KEY_PREFIX = "user_subscription:";
const STRIPE_CUSTOMER_KEY_PREFIX = "stripe_customer:";
const PROCESSED_EVENTS_KEY_PREFIX = "processed_event:";
const NEXT_BILLING_DATE_KEY_PREFIX = "next_billing_date:";
const PENDING_DOWNGRADE_KEY_PREFIX = "pending_downgrade:";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Remove the config export as it's not needed in Next.js 13+ API routes
// export const config = {
//   api: {
//     bodyParser: false,
//   },
// };

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = headers().get('stripe-signature');

  if (!signature || !webhookSecret) {
    console.error('Missing Stripe signature or webhook secret');
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    // Return a 200 response immediately
    const response = NextResponse.json({ received: true }, { status: 200 });

    // Process the event asynchronously
    handleEvent(event).catch(console.error);

    return response;
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }
}

async function handleEvent(event: Stripe.Event) {
  const redisClient = await getRedisClient();

  // Check if this event has already been processed
  const eventId = event.id;
  const isProcessed = await redisClient.get(`${PROCESSED_EVENTS_KEY_PREFIX}${eventId}`);
  if (isProcessed) {
    console.log(`Event ${eventId} has already been processed. Skipping.`);
    return;
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionChange(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      case 'customer.deleted':
        await handleCustomerDeleted(event.data.object as Stripe.Customer);
        break;
      case 'subscription_schedule.canceled':
        await handleSubscriptionScheduleCanceled(event.data.object as Stripe.SubscriptionSchedule);
        break;
      default:
        console.log(`Received ${event.type} event, no action needed`);
    }

    // Mark this event as processed
    await redisClient.set(`${PROCESSED_EVENTS_KEY_PREFIX}${eventId}`, 'true', { EX: 60 * 60 * 24 }); // Expire after 24 hours

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('Handling checkout.session.completed');
  const userId = session.metadata?.userId;
  const subscriptionId = session.subscription as string;
  const customerId = session.customer as string;

  if (!userId || !subscriptionId || !customerId) {
    console.error('Missing userId, subscriptionId, or customerId in checkout session', { userId, subscriptionId, customerId });
    return;
  }

  try {
    const redisClient = await getRedisClient();
    await redisClient.set(`${STRIPE_CUSTOMER_KEY_PREFIX}${userId}`, customerId);

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    await updateUserSubscription(userId, subscription);

    console.log(`Updated subscription for user ${userId} after checkout`);
  } catch (error) {
    console.error('Error updating subscription after checkout:', error);
  }
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  console.log(`Handling subscription ${subscription.status} event`);
  const userId = subscription.metadata.userId;
  if (!userId) {
    console.error('Missing userId in subscription metadata');
    return;
  }

  try {
    const redisClient = await getRedisClient();

    // Check if there was a pending downgrade and remove it
    const pendingDowngrade = await redisClient.get(`${PENDING_DOWNGRADE_KEY_PREFIX}${userId}`);
    if (pendingDowngrade) {
      await redisClient.del(`${PENDING_DOWNGRADE_KEY_PREFIX}${userId}`);
    }

    await updateUserSubscription(userId, subscription);
  } catch (error) {
    console.error('Error handling subscription change:', error);
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Handling invoice.payment_succeeded event');
  const subscriptionId = invoice.subscription as string;
  if (subscriptionId) {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const userId = subscription.metadata.userId;
    if (userId) {
      await updateUserSubscription(userId, subscription);
      
      // If this is a prorated payment for an upgrade, update the subscription immediately
      if (invoice.billing_reason === 'subscription_update') {
        const redisClient = await getRedisClient();
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
        console.log(`Immediately updated subscription for user ${userId} to ${subscriptionTier} after proration payment`);
      }
    } else {
      console.error('Missing userId in subscription metadata');
    }
  } else {
    console.error('Missing subscriptionId in invoice');
  }
}

async function handleCustomerDeleted(customer: Stripe.Customer) {
  console.log('Handling customer.deleted event');
  const userId = customer.metadata.userId;
  if (userId) {
    try {
      const redisClient = await getRedisClient();
      
      // Remove the Stripe customer ID from Redis
      await redisClient.del(`${STRIPE_CUSTOMER_KEY_PREFIX}${userId}`);
      
      // Set the subscription to 'basic'
      await redisClient.set(`${SUBSCRIPTION_KEY_PREFIX}${userId}`, 'basic');
      
      console.log(`Removed Stripe customer ID and reset subscription for user ${userId} to basic in Redis`);
      
      // Optionally, you can add more cleanup or notification logic here
      // For example, you might want to notify the user that their subscription has been canceled
      
    } catch (error) {
      console.error(`Error handling customer deletion for user ${userId}:`, error);
    }
  } else {
    console.error('Missing userId in customer metadata');
  }
}

async function handleSubscriptionScheduleCanceled(schedule: Stripe.SubscriptionSchedule) {
  console.log('Handling subscription_schedule.canceled event');
  const userId = schedule.metadata?.userId;
  if (!userId) {
    console.error('Missing userId in subscription schedule metadata');
    return;
  }

  try {
    const redisClient = await getRedisClient();
    
    // Remove the pending downgrade from Redis
    await redisClient.del(`${SUBSCRIPTION_KEY_PREFIX}${userId}:pending_downgrade`);

    // Fetch the current active subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: schedule.customer as string,
      status: 'active',
      limit: 1,
    });

    if (subscriptions.data.length > 0) {
      const subscription = subscriptions.data[0];
      // Update the subscription in Redis and Supabase to reflect the current active plan
      await updateUserSubscription(userId, subscription);
    } else {
      console.error('No active subscription found after canceling schedule');
    }

    console.log(`Cancelled downgrade for user ${userId}`);
  } catch (error) {
    console.error('Error handling subscription schedule cancellation:', error);
  }
}

async function updateUserSubscription(userId: string, subscription: Stripe.Subscription) {
  const redisClient = await getRedisClient();
  
  if (subscription.status === 'active') {
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
    console.log(`Updated subscription for user ${userId} to ${subscriptionTier}`);

    // Update next billing date
    const nextBillingDate = new Date(subscription.current_period_end * 1000).toISOString();
    await redisClient.set(`${NEXT_BILLING_DATE_KEY_PREFIX}${userId}`, nextBillingDate);

    // Clear any pending downgrades
    await redisClient.del(`${SUBSCRIPTION_KEY_PREFIX}${userId}:pending_downgrade`);

    // Update Supabase
    await updateSupabaseSubscription(userId, userId, subscriptionTier, null);
  } else if (subscription.status === 'canceled') {
    await redisClient.set(`${SUBSCRIPTION_KEY_PREFIX}${userId}`, 'basic');
    console.log(`Reset subscription for user ${userId} to basic due to cancellation`);
    await updateSupabaseSubscription(userId, userId, 'basic', null);
  }
}

async function updateSupabaseSubscription(userId: string, clerkId: string, subscriptionTier: SubscriptionTier, pendingDowngrade: string | null) {
  try {
    // Fetch the user's information from Clerk
    const user = await clerkClient().users.getUser(clerkId);
    const username = user.username || `${user.firstName} ${user.lastName}`.trim() || null;

    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .upsert({
        clerk_id: clerkId,
        username: username,
        plan: subscriptionTier,
        status: 'active',
        pending_downgrade: pendingDowngrade,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'clerk_id'
      })
      .select();

    if (error) throw error;
    console.log(`Updated Supabase subscription for user ${clerkId} to ${subscriptionTier}${pendingDowngrade ? ` with pending downgrade to ${pendingDowngrade}` : ''}`);
  } catch (error) {
    console.error('Error updating Supabase subscription:', error);
    throw error;
  }
}

function getPlanIdFromName(planName: string): string | null {
  const planMap: { [key: string]: string } = {
    'Pro': 'price_1Q3AztHYPfrMrymk4VqOuNAD',
    'Premium': 'price_1Q3B16HYPfrMrymkgzihBxJR',
    'Ultimate': 'price_1Q3B2gHYPfrMrymkYyJgjmci',
  };
  return planMap[planName] || null;
}