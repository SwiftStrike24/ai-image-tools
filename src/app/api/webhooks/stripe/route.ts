import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getRedisClient } from "@/lib/redis";
import { SubscriptionTier } from '@/actions/rateLimit';
import { headers } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

const SUBSCRIPTION_KEY_PREFIX = "user_subscription:";
const STRIPE_CUSTOMER_KEY_PREFIX = "stripe_customer:";
const PROCESSED_EVENTS_KEY_PREFIX = "processed_event:";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export const config = {
  api: {
    bodyParser: false,
  },
};

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
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const redisClient = await getRedisClient();

  // Check if this event has already been processed
  const eventId = event.id;
  const isProcessed = await redisClient.get(`${PROCESSED_EVENTS_KEY_PREFIX}${eventId}`);
  if (isProcessed) {
    console.log(`Event ${eventId} has already been processed. Skipping.`);
    return NextResponse.json({ received: true });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await handleSubscriptionChange(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      case 'customer.deleted':
        await handleCustomerDeleted(event.data.object as Stripe.Customer);
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

  if (userId && subscriptionId && customerId) {
    try {
      const redisClient = await getRedisClient();
      await redisClient.set(`${STRIPE_CUSTOMER_KEY_PREFIX}${userId}`, customerId);

      // Fetch the customer details from Stripe
      const customer = await stripe.customers.retrieve(customerId);
      
      // Get the payment intent
      const paymentIntentId = session.payment_intent as string;
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      // Get the payment method
      const paymentMethodId = paymentIntent.payment_method as string;
      const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

      // Use the cardholder name from the payment method
      const cardholderName = paymentMethod.billing_details.name || 'Name not provided';

      // Update Stripe customer with the cardholder name and add userId to metadata
      await stripe.customers.update(customerId, {
        name: cardholderName,
        metadata: {
          userId: userId,
        },
      });

      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      await updateUserSubscription(userId, subscription);

      // Handle subscription change if this was an upgrade/change
      if (session.metadata?.action === 'subscription_change') {
        const currentSubscriptionId = session.metadata.current_subscription_id;
        if (currentSubscriptionId) {
          // Cancel the old subscription
          await stripe.subscriptions.cancel(currentSubscriptionId);
          console.log(`Canceled old subscription ${currentSubscriptionId} for user ${userId}`);
        }
      }

      console.log(`Updated Stripe customer ${customerId} with name: ${cardholderName}`);
    } catch (error) {
      console.error('Error updating subscription or customer after checkout:', error);
    }
  } else {
    console.error('Missing userId, subscriptionId, or customerId in checkout session');
  }
}

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  console.log(`Handling subscription ${subscription.status} event`);
  const userId = subscription.metadata.userId;
  if (!userId) {
    console.error('Missing userId in subscription metadata');
    return;
  }

  const redisClient = await getRedisClient();
  const pendingDowngrade = await redisClient.get(`${SUBSCRIPTION_KEY_PREFIX}${userId}:pending_downgrade`);

  if (pendingDowngrade) {
    if (subscription.current_period_end <= (Date.now() / 1000)) {
      // The subscription period has ended
      await redisClient.del(`${SUBSCRIPTION_KEY_PREFIX}${userId}:pending_downgrade`);
      await updateUserSubscription(userId, subscription);
      console.log(`Downgrade to ${pendingDowngrade} has taken effect for user ${userId}`);
    }
  } else {
    await updateUserSubscription(userId, subscription);
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
    const redisClient = await getRedisClient();
    await redisClient.del(`${STRIPE_CUSTOMER_KEY_PREFIX}${userId}`);
    // Instead of deleting, set the subscription to 'basic'
    await redisClient.set(`${SUBSCRIPTION_KEY_PREFIX}${userId}`, 'basic');
    console.log(`Removed Stripe customer ID and reset subscription for user ${userId} to basic in Redis`);
  } else {
    console.error('Missing userId in customer metadata');
  }
}

async function updateUserSubscription(userId: string, subscription: Stripe.Subscription) {
  const redisClient = await getRedisClient();
  
  if (subscription.status === 'canceled') {
    await redisClient.set(`${SUBSCRIPTION_KEY_PREFIX}${userId}`, 'basic');
    console.log(`Reset subscription for user ${userId} to basic due to cancellation`);
    return;
  }

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
    default:
      subscriptionTier = 'basic';
  }

  await redisClient.set(`${SUBSCRIPTION_KEY_PREFIX}${userId}`, subscriptionTier);

  console.log(`Updated subscription for user ${userId} to ${subscriptionTier}`);
}

function getPlanIdFromName(planName: string): string | null {
  const planMap: { [key: string]: string } = {
    'Pro': 'price_1Q3AztHYPfrMrymk4VqOuNAD',
    'Premium': 'price_1Q3B16HYPfrMrymkgzihBxJR',
    'Ultimate': 'price_1Q3B2gHYPfrMrymkYyJgjmci',
  };
  return planMap[planName] || null;
}