import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getRedisClient } from "@/lib/redis";
import { auth } from '@clerk/nextjs/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

const SUBSCRIPTION_KEY_PREFIX = "user_subscription:";
const STRIPE_CUSTOMER_KEY_PREFIX = "stripe_customer:";
const NEXT_BILLING_DATE_KEY_PREFIX = "next_billing_date:";

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { planName } = await req.json();

    const redisClient = await getRedisClient();
    const currentSubscription = await redisClient.get(`${SUBSCRIPTION_KEY_PREFIX}${userId}`);

    if (currentSubscription?.toLowerCase() === planName.toLowerCase()) {
      return NextResponse.json({ error: 'Already subscribed to this plan' }, { status: 400 });
    }

    const stripeCustomerId = await redisClient.get(`${STRIPE_CUSTOMER_KEY_PREFIX}${userId}`);

    if (stripeCustomerId) {
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

        // Create a subscription schedule
        const schedule = await stripe.subscriptionSchedules.create({
          from_subscription: subscription.id,
        });

        // Update the schedule with the new plan
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

        // Store the pending downgrade in Redis
        await redisClient.set(`${SUBSCRIPTION_KEY_PREFIX}${userId}:pending_downgrade`, planName);

        // Get the next billing date
        const nextBillingDate = new Date(subscription.current_period_end * 1000).toISOString();
        await redisClient.set(`${NEXT_BILLING_DATE_KEY_PREFIX}${userId}`, nextBillingDate);

        return NextResponse.json({ 
          message: `Downgrade to ${planName} scheduled successfully`,
          nextBillingDate
        });
      }
    }

    return NextResponse.json({ error: 'No active subscription found' }, { status: 400 });
  } catch (error) {
    console.error('Error in downgrade-subscription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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