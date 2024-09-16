"use server";

import { auth } from "@clerk/nextjs/server";
import { kv } from "@vercel/kv";

const DAILY_LIMIT = 20;
const STORAGE_KEY_PREFIX = 'upscaler_daily_usage:';

export async function checkAndUpdateRateLimit(): Promise<{ canProceed: boolean; usageCount: number }> {
  const { userId } = auth();
  
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const key = `${STORAGE_KEY_PREFIX}${userId}`;
  const today = new Date().toDateString();

  const [usageCount, lastUsageDate] = await kv.mget([key, `${key}:date`]);

  let currentUsage = typeof usageCount === 'number' ? usageCount : 0;

  if (lastUsageDate !== today) {
    currentUsage = 0;
  }

  if (currentUsage >= DAILY_LIMIT) {
    return { canProceed: false, usageCount: currentUsage };
  }

  currentUsage += 1;

  await kv.mset({
    [key]: currentUsage,
    [`${key}:date`]: today
  });

  return { canProceed: true, usageCount: currentUsage };
}

export async function getUserUsage(): Promise<number> {
  const { userId } = auth();
  
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const key = `${STORAGE_KEY_PREFIX}${userId}`;
  const usageCount = await kv.get(key);

  return typeof usageCount === 'number' ? usageCount : 0;
}