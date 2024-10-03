import { NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";
import { getRedisClient } from "@/lib/redis";

const NEXT_BILLING_DATE_KEY_PREFIX = "next_billing_date:";
const SUBSCRIPTION_KEY_PREFIX = "user_subscription:";
const PENDING_DOWNGRADE_KEY_PREFIX = "pending_downgrade:";

export async function GET() {
  const { userId } = auth();

  // If there's no userId, return a default response
  if (!userId) {
    return NextResponse.json({ 
      nextBillingDate: null, 
      pendingDowngrade: null,
      currentSubscription: 'basic'
    });
  }

  try {
    const redisClient = await getRedisClient();
    const nextBillingDate = await redisClient.get(`${NEXT_BILLING_DATE_KEY_PREFIX}${userId}`);
    const pendingDowngrade = await redisClient.get(`${PENDING_DOWNGRADE_KEY_PREFIX}${userId}`);
    const currentSubscription = await redisClient.get(`${SUBSCRIPTION_KEY_PREFIX}${userId}`) || 'basic';

    return NextResponse.json({ 
      nextBillingDate, 
      pendingDowngrade,
      currentSubscription
    });
  } catch (error) {
    console.error("Error fetching next billing date:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}