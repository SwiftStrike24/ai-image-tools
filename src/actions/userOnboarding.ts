"use server";

import { auth } from "@clerk/nextjs/server";
import { kv } from "@vercel/kv";

const SUBSCRIPTION_KEY_PREFIX = "user_subscription:";

export async function ensureUserSubscription() {
  const { userId } = auth();
  
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const subscriptionKey = `${SUBSCRIPTION_KEY_PREFIX}${userId}`;
  const existingSubscription = await kv.get(subscriptionKey);

  if (!existingSubscription) {
    // User doesn't have a subscription, assign the Basic plan
    await kv.set(subscriptionKey, "basic");
    console.log(`Assigned Basic plan to new user: ${userId}`);
  }
}