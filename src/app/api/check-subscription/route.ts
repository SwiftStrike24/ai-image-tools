import { NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";
import { kv } from "@vercel/kv";

const SUBSCRIPTION_KEY_PREFIX = "user_subscription:";

export async function GET() {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
  }

  try {
    const subscriptionKey = `${SUBSCRIPTION_KEY_PREFIX}${userId}`;
    const subscription = await kv.get(subscriptionKey);

    const isPro = subscription === "pro";
    const isPremium = subscription === "premium";
    const isUltimate = subscription === "ultimate";

    return NextResponse.json({ isPro, isPremium, isUltimate });
  } catch (error) {
    console.error("Error checking subscription:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}