import { NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";
import { getRedisClient } from "@/lib/redis";

const NEXT_BILLING_DATE_KEY_PREFIX = "next_billing_date:";
const SUBSCRIPTION_KEY_PREFIX = "user_subscription:";
const PENDING_DOWNGRADE_KEY_PREFIX = "pending_downgrade:";
const PENDING_UPGRADE_KEY_PREFIX = "pending_upgrade:";  // Added this line

export async function GET() {
  const { userId } = auth();

  // If there's no userId, return a default response
  if (!userId) {
    return NextResponse.json({ 
      nextBillingDate: null, 
      pendingUpgrade: null,
      pendingDowngrade: null,
      currentSubscription: 'basic'
    });
  }

  try {
    const redisClient = await getRedisClient();
    const nextBillingDate = await redisClient.get(`${NEXT_BILLING_DATE_KEY_PREFIX}${userId}`);
    const pendingDowngrade = await redisClient.get(`${PENDING_DOWNGRADE_KEY_PREFIX}${userId}`);
    const pendingUpgrade = await redisClient.get(`${PENDING_UPGRADE_KEY_PREFIX}${userId}`); // Added this line
    const currentSubscription = await redisClient.get(`${SUBSCRIPTION_KEY_PREFIX}${userId}`) || 'basic';

    return NextResponse.json({ 
      nextBillingDate, 
      pendingUpgrade,    // Added this line
      pendingDowngrade,
      currentSubscription
    });
  } catch (error) {
    console.error("Error fetching subscription data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
