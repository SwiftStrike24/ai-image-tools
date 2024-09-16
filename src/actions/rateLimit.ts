"use server";

import { auth } from "@clerk/nextjs/server";
import { kv } from "@vercel/kv";
import {
  UPSCALER_DAILY_LIMIT,
  GENERATOR_DAILY_LIMIT,
  UPSCALER_KEY_PREFIX,
  GENERATOR_KEY_PREFIX
} from "@/constants/rateLimits";

export async function checkAndUpdateRateLimit(): Promise<{ canProceed: boolean; usageCount: number }> {
  const { userId } = auth();
  
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const key = `${UPSCALER_KEY_PREFIX}${userId}`;
  const today = new Date().toDateString();

  const [usageCount, lastUsageDate] = await kv.mget([key, `${key}:date`]);

  let currentUsage = typeof usageCount === 'number' ? usageCount : 0;

  if (lastUsageDate !== today) {
    currentUsage = 0;
  }

  if (currentUsage >= UPSCALER_DAILY_LIMIT) {
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

  const key = `${UPSCALER_KEY_PREFIX}${userId}`;
  const usageCount = await kv.get(key);

  return typeof usageCount === 'number' ? usageCount : 0;
}

export async function checkAndUpdateGeneratorLimit(imagesToGenerate: number): Promise<{ canProceed: boolean; usageCount: number }> {
  const { userId } = auth();
  
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const key = `${GENERATOR_KEY_PREFIX}${userId}`;
  const today = new Date().toDateString();

  const [usageCount, lastUsageDate] = await kv.mget([key, `${key}:date`]);

  let currentUsage = typeof usageCount === 'number' ? usageCount : 0;

  if (lastUsageDate !== today) {
    currentUsage = 0;
  }

  if (currentUsage + imagesToGenerate > GENERATOR_DAILY_LIMIT) {
    return { canProceed: false, usageCount: currentUsage };
  }

  currentUsage += imagesToGenerate;

  await kv.mset({
    [key]: currentUsage,
    [`${key}:date`]: today
  });

  return { canProceed: true, usageCount: currentUsage };
}

export async function getGeneratorUsage(): Promise<number> {
  const { userId } = auth();
  
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const key = `${GENERATOR_KEY_PREFIX}${userId}`;
  const usageCount = await kv.get(key);

  return typeof usageCount === 'number' ? usageCount : 0;
}