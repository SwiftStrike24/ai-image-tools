import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getRedisClient } from "@/lib/redis";
import { SubscriptionTier } from '@/actions/rateLimit';
import { headers } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';
import { pusherServer } from '@/lib/pusher';
import { triggerPusherEvent } from '@/lib/pusher';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

const SUBSCRIPTION_KEY_PREFIX = "user_subscription:";
const STRIPE_CUSTOMER_KEY_PREFIX = "stripe_customer:";
const PROCESSED_EVENTS_KEY_PREFIX = "processed_event:";
const NEXT_BILLING_DATE_KEY_PREFIX = "next_billing_date:";
const PENDING_DOWNGRADE_KEY_PREFIX = "pending_downgrade:";
const PENDING_UPGRADE_KEY_PREFIX = "pending_upgrade:";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}

export async function POST(req: Request) {
  console.log('Webhook received');

  const rawBody = await req.text();
  const signature = headers().get('stripe-signature');

  if (!signature || !webhookSecret) {
    console.error('Missing Stripe signature or webhook secret');
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  console.log(`Received signature: ${signature}`);
  console.log(`Webhook secret: ${webhookSecret.substring(0, 5)}...`);
  console.log(`Raw body (first 100 chars): ${rawBody.substring(0, 100)}...`);

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    console.log(`Event constructed: ${event.type}`);

    // Process the event asynchronously
    handleEvent(event).catch(error => {
      console.error('Error processing webhook event:', error);
    });

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }
}

async function handleEvent(event: Stripe.Event) {
  const redisClient = await getRedisClient();

  const eventId = event.id;
  const isProcessed = await redisClient.get(`${PROCESSED_EVENTS_KEY_PREFIX}${eventId}`);
  if (isProcessed) {
    console.log(`Event ${eventId} has already been processed. Skipping.`);
    return;
  }

  console.log(`Processing event: ${event.type}, ID: ${eventId}`);

  try {
    let userId: string | undefined;
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        userId = session.metadata?.userId;
        await handleCheckoutSessionCompleted(session);
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        const subscription = event.data.object as Stripe.Subscription;
        userId = subscription.metadata.userId;
        await handleSubscriptionChange(subscription);
        break;
      case 'invoice.payment_succeeded':
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          userId = subscription.metadata.userId;
          await handleInvoicePaymentSucceeded(invoice);
        }
        break;
      case 'customer.deleted':
        const customer = event.data.object as Stripe.Customer;
        userId = customer.metadata.userId;
        await handleCustomerDeleted(customer);
        break;
      // Add more cases as needed
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    console.log(`Event ${eventId} processed successfully`);
    await redisClient.set(`${PROCESSED_EVENTS_KEY_PREFIX}${eventId}`, 'true', { EX: 60 * 60 * 24 });

    // Trigger a single Pusher event after processing
    if (userId) {
      await triggerPusherEvent(`private-user-${userId}`, 'subscription-updated', {});
    }

  } catch (error) {
    console.error(`Error processing webhook ${eventId}:`, error);
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

    // Check if there was a pending downgrade or upgrade and remove it
    await redisClient.del(`${PENDING_DOWNGRADE_KEY_PREFIX}${userId}`);
    await redisClient.del(`${PENDING_UPGRADE_KEY_PREFIX}${userId}`);

    await updateUserSubscription(userId, subscription);

    // Notify client about subscription update
    await pusherServer.trigger(`private-user-${userId}`, 'subscription-updated', {
      subscriptionType: subscription.items.data[0].price.product,
      status: subscription.status,
    });

    console.log(`Subscription updated for user ${userId}, client notified`);
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
  const userId = customer.metadata.userId;
  if (userId) {
    const redisClient = await getRedisClient();
    await redisClient.del(`${STRIPE_CUSTOMER_KEY_PREFIX}${userId}`);
    await redisClient.del(`${SUBSCRIPTION_KEY_PREFIX}${userId}`);

    // Update Supabase
    await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'inactive',
        plan: 'basic',
        updated_at: new Date().toISOString(),
      })
      .eq('clerk_id', userId);

    console.log(`Customer deleted, updated Redis and Supabase for user ${userId}`);
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

    const nextBillingDate = new Date(subscription.current_period_end * 1000).toISOString();
    await redisClient.set(`${NEXT_BILLING_DATE_KEY_PREFIX}${userId}`, nextBillingDate);

    // Update Supabase
    await supabaseAdmin
      .from('subscriptions')
      .update({
        plan: subscriptionTier,
        status: 'active',
        updated_at: new Date().toISOString(),
        pending_upgrade: null,
        pending_downgrade: null,
      })
      .eq('clerk_id', userId);

    // Notify client about subscription update
    await pusherServer.trigger(`private-user-${userId}`, 'subscription-updated', {});
  } else if (subscription.status === 'canceled') {
    await redisClient.set(`${SUBSCRIPTION_KEY_PREFIX}${userId}`, 'basic');
    console.log(`Reset subscription for user ${userId} to basic due to cancellation`);
    await supabaseAdmin
      .from('subscriptions')
      .update({
        plan: 'basic',
        status: 'canceled',
        updated_at: new Date().toISOString(),
      })
      .eq('clerk_id', userId);
  }
}
