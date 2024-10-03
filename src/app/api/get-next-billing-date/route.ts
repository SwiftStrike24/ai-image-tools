import { NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";
import { getRedisClient } from "@/lib/redis";

const NEXT_BILLING_DATE_KEY_PREFIX = "next_billing_date:";
const CANCELLATION_DATE_KEY_PREFIX = "cancellation_date:";

export async function GET() {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const redisClient = await getRedisClient();
    const nextBillingDate = await redisClient.get(`${NEXT_BILLING_DATE_KEY_PREFIX}${userId}`);
    const cancellationDate = await redisClient.get(`${CANCELLATION_DATE_KEY_PREFIX}${userId}`);

    return NextResponse.json({ nextBillingDate, cancellationDate });
  } catch (error) {
    console.error("Error fetching dates:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}