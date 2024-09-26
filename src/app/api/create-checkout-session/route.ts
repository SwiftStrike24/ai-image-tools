import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth, currentUser } from "@clerk/nextjs/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

const DOMAIN = process.env.NEXT_PUBLIC_BASE_URL!;

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      console.log('Unauthorized access attempt to create-checkout-session');
      return NextResponse.json({ error: 'Unauthorized. Please sign in to continue.' }, { status: 401 });
    }

    const user = await currentUser();
    if (!user || !user.emailAddresses || user.emailAddresses.length === 0) {
      console.log(`User ${userId} attempted to create checkout session without email`);
      return NextResponse.json({ error: 'User email not found. Please update your profile.' }, { status: 400 });
    }

    const { priceId } = await req.json();
    if (!priceId) {
      console.log(`Invalid request: missing priceId for user ${userId}`);
      return NextResponse.json({ error: 'Invalid request: missing price ID.' }, { status: 400 });
    }

    console.log(`Creating checkout session for user ${userId} with priceId ${priceId}`);
    const session = await stripe.checkout.sessions.create({
      billing_address_collection: 'auto',
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${DOMAIN}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${DOMAIN}/pricing`,
      client_reference_id: userId,
      customer_email: user.emailAddresses[0].emailAddress,
    });

    console.log(`Checkout session created successfully for user ${userId}`);
    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (err: any) {
    console.error('Stripe error:', err);
    return NextResponse.json({ error: 'An unexpected error occurred. Please try again.' }, { status: 500 });
  }
}