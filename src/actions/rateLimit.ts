"use server";

import { auth } from "@clerk/nextjs/server";
import { kv } from "@vercel/kv";
import {
  UPSCALER_DAILY_LIMIT,
  GENERATOR_DAILY_LIMIT,
  UPSCALER_KEY_PREFIX,
  GENERATOR_KEY_PREFIX
} from "@/constants/rateLimits";

function isNewDay(lastUsageDate: string | null): boolean {
  if (!lastUsageDate) return true;
  const now = new Date();
  const last = new Date(lastUsageDate);
  return now.getUTCDate() !== last.getUTCDate() || now.getUTCMonth() !== last.getUTCMonth() || now.getUTCFullYear() !== last.getUTCFullYear();
}

// Separate function to check generator limit without incrementing
export async function canGenerateImages(imagesToGenerate: number): Promise<{ canProceed: boolean; usageCount: number; resetsIn: string }> {
  const { userId } = auth();
  
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const key = `${GENERATOR_KEY_PREFIX}${userId}`;
  const [usageCount, lastUsageDate] = await kv.mget([key, `${key}:date`]);
  
  let currentUsage = typeof usageCount === 'number' ? usageCount : 0;

  if (isNewDay(lastUsageDate as string | null)) {
    currentUsage = 0;
  }

  const resetsIn = getTimeUntilMidnight(); // {{ edit }}
  
  if (currentUsage + imagesToGenerate > GENERATOR_DAILY_LIMIT) {
    return { canProceed: false, usageCount: currentUsage, resetsIn };
  }

  return { canProceed: true, usageCount: currentUsage, resetsIn }; // {{ edit }}
}

// Separate function to increment generator usage after successful generation
export async function incrementGeneratorUsage(imagesToGenerate: number): Promise<void> {
  const { userId } = auth();
  
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const key = `${GENERATOR_KEY_PREFIX}${userId}`;
  const today = new Date().toUTCString();

  const [usageCount, _] = await kv.mget([key, `${key}:date`]);

  let currentUsage = typeof usageCount === 'number' ? usageCount : 0;

  if (isNewDay(null)) { // Assuming isNewDay handles null appropriately
    currentUsage = 0;
  }

  currentUsage += imagesToGenerate;

  await kv.mset({
    [key]: currentUsage,
    [`${key}:date`]: today,
    [`${key}:total`]: ((await kv.get(`${key}:total`) as number) || 0) + imagesToGenerate
  });
}

export async function checkAndUpdateRateLimit(): Promise<{ canProceed: boolean; usageCount: number; resetsIn: string }> {
  const { userId } = auth();
  
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const key = `${UPSCALER_KEY_PREFIX}${userId}`;
  const [usageCount, lastUsageDate] = await kv.mget([key, `${key}:date`]);

  let currentUsage = typeof usageCount === 'number' ? usageCount : 0;

  if (isNewDay(lastUsageDate as string | null)) {
    currentUsage = 0;
  }

  if (currentUsage >= UPSCALER_DAILY_LIMIT) {
    const resetsIn = getTimeUntilMidnight();
    return { canProceed: false, usageCount: currentUsage, resetsIn };
  }

  currentUsage += 1;

  await kv.mset({
    [key]: currentUsage,
    [`${key}:date`]: new Date().toUTCString(),
    [`${key}:total`]: ((await kv.get(`${key}:total`) as number) || 0) + 1
  });

  const resetsIn = getTimeUntilMidnight();
  return { canProceed: true, usageCount: currentUsage, resetsIn };
}

export async function getUserUsage(): Promise<{ usageCount: number; resetsIn: string }> {
  const { userId } = auth();
  
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const key = `${UPSCALER_KEY_PREFIX}${userId}`;
  const [usageCount, lastUsageDate] = await kv.mget([key, `${key}:date`]);

  let currentUsage = typeof usageCount === 'number' ? usageCount : 0;

  if (isNewDay(lastUsageDate as string | null)) {
    currentUsage = 0;
    await kv.set(key, 0);
  }

  const resetsIn = getTimeUntilMidnight();
  return { usageCount: currentUsage, resetsIn };
}

export async function checkAndUpdateGeneratorLimit(imagesToGenerate: number): Promise<{ canProceed: boolean; usageCount: number; resetsIn: string }> {
  const { userId } = auth();
  
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const key = `${GENERATOR_KEY_PREFIX}${userId}`;
  const [usageCount, lastUsageDate] = await kv.mget([key, `${key}:date`]);
  
  let currentUsage = typeof usageCount === 'number' ? usageCount : 0;

  if (isNewDay(lastUsageDate as string | null)) {
    currentUsage = 0;
  }

  if (currentUsage + imagesToGenerate > GENERATOR_DAILY_LIMIT) {
    const resetsIn = getTimeUntilMidnight();
    return { canProceed: false, usageCount: currentUsage, resetsIn };
  }

  currentUsage += imagesToGenerate;

  await kv.mset({
    [key]: currentUsage,
    [`${key}:date`]: new Date().toUTCString(),
    [`${key}:total`]: ((await kv.get(`${key}:total`) as number) || 0) + imagesToGenerate // Fix: Handle case when total is null and add type assertion
  });

  const resetsIn = getTimeUntilMidnight();
  return { canProceed: true, usageCount: currentUsage, resetsIn };
}

export async function getGeneratorUsage(): Promise<{ usageCount: number; resetsIn: string; totalGenerated: number }> {
  const { userId } = auth();
  
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const key = `${GENERATOR_KEY_PREFIX}${userId}`;
  const [usageCount, lastUsageDate, totalGenerated] = await kv.mget([key, `${key}:date`, `${key}:total`]);

  let currentUsage = typeof usageCount === 'number' ? usageCount : 0;
  let total = typeof totalGenerated === 'number' ? totalGenerated : 0;

  if (isNewDay(lastUsageDate as string | null)) {
    currentUsage = 0;
  }

  const resetsIn = getTimeUntilMidnight();
  return { usageCount: currentUsage, resetsIn, totalGenerated: total };
}

function getTimeUntilMidnight(): string {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);
  const msUntilMidnight = tomorrow.getTime() - now.getTime();
  const hoursUntilMidnight = Math.floor(msUntilMidnight / (1000 * 60 * 60));
  const minutesUntilMidnight = Math.floor((msUntilMidnight % (1000 * 60 * 60)) / (1000 * 60));
  return `${hoursUntilMidnight}h ${minutesUntilMidnight}m`;
}