"use server";

import { auth } from "@clerk/nextjs/server";
import { kv } from "@vercel/kv";
import {
  ULTIMATE_UPSCALER_MONTHLY_LIMIT,
  ULTIMATE_GENERATOR_MONTHLY_LIMIT,
  ULTIMATE_ENHANCE_PROMPT_MONTHLY_LIMIT,
  ULTIMATE_UPSCALER_KEY_PREFIX,
  ULTIMATE_GENERATOR_KEY_PREFIX,
  ULTIMATE_ENHANCE_PROMPT_KEY_PREFIX,
} from "@/constants/rateLimits";

function isNewMonth(lastUsageDate: string | null): boolean {
  if (!lastUsageDate) return true;
  const now = new Date();
  const last = new Date(lastUsageDate);
  return now.getUTCMonth() !== last.getUTCMonth() || now.getUTCFullYear() !== last.getUTCFullYear();
}

export async function canGenerateImagesUltimate(imagesToGenerate: number): Promise<{ canProceed: boolean; usageCount: number; resetsIn: string }> {
  const { userId } = auth();
  
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const key = `${ULTIMATE_GENERATOR_KEY_PREFIX}${userId}`;
  const [usageCount, lastUsageDate] = await kv.mget([key, `${key}:date`]);
  
  let currentUsage = typeof usageCount === 'number' ? usageCount : 0;

  if (isNewMonth(lastUsageDate as string | null)) {
    currentUsage = 0;
  }

  const resetsIn = getTimeUntilNextMonth();
  
  if (currentUsage + imagesToGenerate > ULTIMATE_GENERATOR_MONTHLY_LIMIT) {
    return { canProceed: false, usageCount: currentUsage, resetsIn };
  }

  return { canProceed: true, usageCount: currentUsage, resetsIn };
}

export async function incrementGeneratorUsageUltimate(imagesToGenerate: number): Promise<void> {
  const { userId } = auth();
  
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const key = `${ULTIMATE_GENERATOR_KEY_PREFIX}${userId}`;
  const today = new Date().toUTCString();

  const [usageCount, lastUsageDate] = await kv.mget([key, `${key}:date`]);

  let currentUsage = typeof usageCount === 'number' ? usageCount : 0;

  if (isNewMonth(lastUsageDate as string | null)) {
    currentUsage = 0;
  }

  currentUsage += imagesToGenerate;

  await kv.mset({
    [key]: currentUsage,
    [`${key}:date`]: today,
    [`${key}:total`]: ((await kv.get(`${key}:total`) as number) || 0) + imagesToGenerate
  });
}

export async function checkAndUpdateRateLimitUltimate(): Promise<{ canProceed: boolean; usageCount: number; resetsIn: string }> {
  const { userId } = auth();
  
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const key = `${ULTIMATE_UPSCALER_KEY_PREFIX}${userId}`;
  const [usageCount, lastUsageDate] = await kv.mget([key, `${key}:date`]);

  let currentUsage = typeof usageCount === 'number' ? usageCount : 0;

  if (isNewMonth(lastUsageDate as string | null)) {
    currentUsage = 0;
  }

  if (currentUsage >= ULTIMATE_UPSCALER_MONTHLY_LIMIT) {
    const resetsIn = getTimeUntilNextMonth();
    return { canProceed: false, usageCount: currentUsage, resetsIn };
  }

  currentUsage += 1;

  await kv.mset({
    [key]: currentUsage,
    [`${key}:date`]: new Date().toUTCString(),
    [`${key}:total`]: ((await kv.get(`${key}:total`) as number) || 0) + 1
  });

  const resetsIn = getTimeUntilNextMonth();
  return { canProceed: true, usageCount: currentUsage, resetsIn };
}

export async function canEnhancePromptUltimate(): Promise<{ canProceed: boolean; usageCount: number; resetsIn: string }> {
  // Ultimate users have unlimited prompt enhancements
  return { canProceed: true, usageCount: 0, resetsIn: "Unlimited" };
}

export async function incrementEnhancePromptUsageUltimate(): Promise<void> {
  const { userId } = auth();
  
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const key = `${ULTIMATE_ENHANCE_PROMPT_KEY_PREFIX}${userId}`;
  const today = new Date().toUTCString();

  await kv.mset({
    [`${key}:date`]: today,
    [`${key}:total`]: ((await kv.get(`${key}:total`) as number) || 0) + 1
  });
}

function getTimeUntilNextMonth(): string {
  const now = new Date();
  const nextMonth = new Date(now.getUTCFullYear(), now.getUTCMonth() + 1, 1);
  const msUntilNextMonth = nextMonth.getTime() - now.getTime();
  const daysUntilNextMonth = Math.ceil(msUntilNextMonth / (1000 * 60 * 60 * 24));
  return `${daysUntilNextMonth} days`;
}
