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
  return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'; // Use NEXT_PUBLIC_BASE_URL or fallback for local development
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

    if (!stripeCustomerId) {
      // Create a new Stripe customer if one doesn't exist
      const customer = await stripe.customers.create({
        metadata: { userId },
      });
      stripeCustomerId = customer.id;
      await redisClient.set(`${STRIPE_CUSTOMER_KEY_PREFIX}${userId}`, stripeCustomerId);
    }

    // Check if the user already has an active subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: 'active',
      limit: 1,
    });

    // Check the current subscription tier
    const currentTier = await redisClient.get(`${SUBSCRIPTION_KEY_PREFIX}${userId}`);

    const baseUrl = getBaseUrl();
    const successUrl = `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/pricing`;

    let session;

    if (subscriptions.data.length > 0) {
      // User has an active subscription, handle upgrade
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
          metadata: { userId, previousTier: currentTier },
        },
        success_url: successUrl,
        cancel_url: cancelUrl,
      });

      // Schedule the current subscription for cancellation
      await stripe.subscriptions.update(currentSubscription.id, {
        cancel_at_period_end: true,
      });

      // Store the pending upgrade in Redis
      await redisClient.set(`${SUBSCRIPTION_KEY_PREFIX}${userId}:pending_upgrade`, priceId);
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}