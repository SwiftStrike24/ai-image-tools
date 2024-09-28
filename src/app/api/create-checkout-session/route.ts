import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@clerk/nextjs/server';
import { getRedisClient } from "@/lib/redis";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

const STRIPE_CUSTOMER_KEY_PREFIX = "stripe_customer:";
const SUBSCRIPTION_KEY_PREFIX = "user_subscription:";

// Helper function to get the base URL
function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
}

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { priceId } = await req.json();

    const redisClient = await getRedisClient();
    let stripeCustomerId = await redisClient.get(`${STRIPE_CUSTOMER_KEY_PREFIX}${userId}`);

    console.log(`Retrieved stripeCustomerId from Redis: ${stripeCustomerId}`);

    let customer;
    if (stripeCustomerId) {
      try {
        console.log(`Attempting to retrieve customer from Stripe with ID: ${stripeCustomerId}`);
        customer = await stripe.customers.retrieve(stripeCustomerId);
        if ((customer as Stripe.DeletedCustomer).deleted) {
          console.log(`Customer was deleted in Stripe, removing from Redis and creating a new one`);
          await redisClient.del(`${STRIPE_CUSTOMER_KEY_PREFIX}${userId}`);
          await redisClient.del(`${SUBSCRIPTION_KEY_PREFIX}${userId}`);
          stripeCustomerId = null;
          customer = null;
        } else {
          console.log(`Successfully retrieved customer from Stripe: ${customer.id}`);
        }
      } catch (error) {
        if (error instanceof Stripe.errors.StripeError && error.code === 'resource_missing') {
          console.log(`Customer not found in Stripe, removing from Redis and creating a new one`);
          await redisClient.del(`${STRIPE_CUSTOMER_KEY_PREFIX}${userId}`);
          await redisClient.del(`${SUBSCRIPTION_KEY_PREFIX}${userId}`);
          stripeCustomerId = null;
          customer = null;
        } else {
          throw error;
        }
      }
    }

    if (!stripeCustomerId) {
      console.log(`Creating new Stripe customer for userId: ${userId}`);
      customer = await stripe.customers.create({
        metadata: { userId },
      });
      stripeCustomerId = customer.id;
      console.log(`New Stripe customer created with ID: ${stripeCustomerId}`);
      await redisClient.set(`${STRIPE_CUSTOMER_KEY_PREFIX}${userId}`, stripeCustomerId);
      console.log(`Stored new stripeCustomerId in Redis`);
    }

    // Check if the user already has an active subscription
    let subscriptions;
    try {
      subscriptions = await stripe.subscriptions.list({
        customer: stripeCustomerId,
        status: 'active',
        limit: 1,
      });
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError && error.code === 'resource_missing') {
        console.log(`Customer not found in Stripe when listing subscriptions, removing from Redis and creating a new one`);
        await redisClient.del(`${STRIPE_CUSTOMER_KEY_PREFIX}${userId}`);
        await redisClient.del(`${SUBSCRIPTION_KEY_PREFIX}${userId}`);
        stripeCustomerId = null;

        // Create new Stripe customer
        console.log(`Creating new Stripe customer for userId: ${userId}`);
        customer = await stripe.customers.create({
          metadata: { userId },
        });
        stripeCustomerId = customer.id;
        console.log(`New Stripe customer created with ID: ${stripeCustomerId}`);
        await redisClient.set(`${STRIPE_CUSTOMER_KEY_PREFIX}${userId}`, stripeCustomerId);
        console.log(`Stored new stripeCustomerId in Redis`);

        // Since the customer is new, there are no subscriptions
        subscriptions = { data: [] };
      } else {
        throw error;
      }
    }

    // Check the current subscription tier
    const currentTier = await redisClient.get(`${SUBSCRIPTION_KEY_PREFIX}${userId}`);

    const baseUrl = getBaseUrl();
    const successUrl = `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/pricing`;

    let session;

    if (subscriptions.data.length > 0) {
      // User has a subscription, create a session for updating the subscription
      const currentSubscription = subscriptions.data[0];

      session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        payment_method_types: ['card'],
        mode: 'subscription',
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        subscription_data: {
          metadata: { userId },
        },
        success_url: successUrl,
        cancel_url: cancelUrl,
        // Instead of passing the subscription directly, use metadata
        metadata: {
          subscription_id: currentSubscription.id,
          action: 'update_subscription'
        }
      });
    } else {
      // User doesn't have an active subscription, create a new one
      session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        line_items: [{ price: priceId, quantity: 1 }],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        subscription_data: {
          metadata: { userId },
        },
      });
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error in create-checkout-session:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
