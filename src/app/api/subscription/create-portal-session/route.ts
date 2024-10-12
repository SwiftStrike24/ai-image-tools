import { NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";
import { getRedisClient } from "@/lib/redis";
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

const STRIPE_CUSTOMER_KEY_PREFIX = "stripe_customer:";
const SUBSCRIPTION_KEY_PREFIX = "user_subscription:";

export async function POST() {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const redisClient = await getRedisClient();
    const stripeCustomerId = await redisClient.get(`${STRIPE_CUSTOMER_KEY_PREFIX}${userId}`);
    const subscriptionType = await redisClient.get(`${SUBSCRIPTION_KEY_PREFIX}${userId}`);

    if (!stripeCustomerId || subscriptionType === 'basic') {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const returnUrl = `${baseUrl}/pricing`;

    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: returnUrl,
      });

      return NextResponse.json({ url: session.url });
    } catch (stripeError) {
      if (stripeError instanceof Stripe.errors.StripeError &&
          stripeError.type === 'StripeInvalidRequestError' &&
          stripeError.message.includes('save your customer portal settings')) {
        console.error('Stripe customer portal not configured:', stripeError);
        return NextResponse.json({
          error: 'Stripe customer portal is not configured',
          userMessage: 'We apologize, but the subscription management feature is currently unavailable. Please contact support for assistance.',
          developerMessage: 'Configure the Stripe customer portal in test mode at https://dashboard.stripe.com/test/settings/billing/portal'
        }, { status: 503 });
      }
      throw stripeError; // Re-throw if it's a different type of Stripe error
    }
  } catch (error) {
    console.error('Error creating portal session:', error);
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
