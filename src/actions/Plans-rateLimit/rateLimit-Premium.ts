"use server";

import { auth } from "@clerk/nextjs/server";
import { kv } from "@vercel/kv";
import {
  PREMIUM_UPSCALER_MONTHLY_LIMIT,
  PREMIUM_GENERATOR_MONTHLY_LIMIT,
  PREMIUM_ENHANCE_PROMPT_MONTHLY_LIMIT,
  PREMIUM_UPSCALER_KEY_PREFIX,
  PREMIUM_GENERATOR_KEY_PREFIX,
  PREMIUM_ENHANCE_PROMPT_KEY_PREFIX,
} from "@/constants/rateLimits";
import { isNewMonth, getTimeUntilEndOfMonth } from "@/utils/dateUtils";

export async function canGenerateImagesPremium(imagesToGenerate: number): Promise<{ canProceed: boolean; usageCount: number; resetsIn: string }> {
  const { userId } = auth();
  
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const key = `${PREMIUM_GENERATOR_KEY_PREFIX}${userId}`;
  const [usageCount, lastUsageDate] = await kv.mget([key, `${key}:date`]);
  
  let currentUsage = typeof usageCount === 'number' ? usageCount : 0;

  if (isNewMonth(lastUsageDate as string | null)) {
    currentUsage = 0;
  }

  const resetsIn = getTimeUntilEndOfMonth();
  
  if (currentUsage + imagesToGenerate > PREMIUM_GENERATOR_MONTHLY_LIMIT) {
    return { canProceed: false, usageCount: currentUsage, resetsIn };
  }

  return { canProceed: true, usageCount: currentUsage, resetsIn };
}

export async function incrementGeneratorUsagePremium(imagesToGenerate: number): Promise<void> {
  const { userId } = auth();
  
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const key = `${PREMIUM_GENERATOR_KEY_PREFIX}${userId}`;
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

export async function checkRateLimitPremium(): Promise<{ canProceed: boolean; usageCount: number; resetsIn: string }> {
  const { userId } = auth();
  
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const key = `${PREMIUM_UPSCALER_KEY_PREFIX}${userId}`;
  const [usageCount, lastUsageDate] = await kv.mget([key, `${key}:date`]);

  let currentUsage = typeof usageCount === 'number' ? usageCount : 0;

  if (isNewMonth(lastUsageDate as string | null)) {
    currentUsage = 0;
  }

  const resetsIn = getTimeUntilEndOfMonth();
  
  if (currentUsage >= PREMIUM_UPSCALER_MONTHLY_LIMIT) {
    return { canProceed: false, usageCount: currentUsage, resetsIn };
  }

  return { canProceed: true, usageCount: currentUsage, resetsIn };
}

export async function incrementUpscalerUsagePremium(imagesToUpscale: number = 1): Promise<{ usageCount: number; resetsIn: string }> {
  const { userId } = auth();
  
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const key = `${PREMIUM_UPSCALER_KEY_PREFIX}${userId}`;
  const today = new Date().toUTCString();

  const [usageCount, lastUsageDate] = await kv.mget([key, `${key}:date`]);

  let currentUsage = typeof usageCount === 'number' ? usageCount : 0;

  if (isNewMonth(lastUsageDate as string | null)) {
    currentUsage = 0;
  }

  currentUsage += imagesToUpscale;

  await kv.mset({
    [key]: currentUsage,
    [`${key}:date`]: today,
    [`${key}:total`]: ((await kv.get(`${key}:total`) as number) || 0) + imagesToUpscale
  });

  const resetsIn = getTimeUntilEndOfMonth();
  return { usageCount: currentUsage, resetsIn };
}

export async function canUpscaleImagesPremium(imagesToUpscale: number): Promise<{ canProceed: boolean; usageCount: number; resetsIn: string }> {
  const { userId } = auth();
  
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const key = `${PREMIUM_UPSCALER_KEY_PREFIX}${userId}`;
  const [usageCount, lastUsageDate] = await kv.mget([key, `${key}:date`]);
  
  let currentUsage = typeof usageCount === 'number' ? usageCount : 0;

  if (isNewMonth(lastUsageDate as string | null)) {
    currentUsage = 0;
  }

  const resetsIn = getTimeUntilEndOfMonth();
  
  if (currentUsage + imagesToUpscale > PREMIUM_UPSCALER_MONTHLY_LIMIT) {
    return { canProceed: false, usageCount: currentUsage, resetsIn };
  }

  return { canProceed: true, usageCount: currentUsage, resetsIn };
}

export async function canEnhancePromptPremium(): Promise<{ canProceed: boolean; usageCount: number; resetsIn: string }> {
  // Premium users have unlimited prompt enhancements
  return { canProceed: true, usageCount: 0, resetsIn: "Unlimited" };
}

export async function incrementEnhancePromptUsagePremium(): Promise<void> {
  const { userId } = auth();
  
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const key = `${PREMIUM_ENHANCE_PROMPT_KEY_PREFIX}${userId}`;
  const today = new Date().toUTCString();

  await kv.mset({
    [`${key}:date`]: today,
    [`${key}:total`]: ((await kv.get(`${key}:total`) as number) || 0) + 1
  });
}