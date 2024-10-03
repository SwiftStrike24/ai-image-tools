import { NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";
import { getRedisClient } from "@/lib/redis";

const NEXT_BILLING_DATE_KEY_PREFIX = "next_billing_date:";

export async function GET() {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const redisClient = await getRedisClient();
    const nextBillingDate = await redisClient.get(`${NEXT_BILLING_DATE_KEY_PREFIX}${userId}`);

    return NextResponse.json({ nextBillingDate });
  } catch (error) {
    console.error("Error fetching next billing date:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}