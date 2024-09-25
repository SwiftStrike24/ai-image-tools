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
import { isNewMonth, getTimeUntilEndOfMonth } from "@/utils/dateUtils";

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

  const resetsIn = getTimeUntilEndOfMonth();
  
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

export async function checkRateLimitUltimate(): Promise<{ canProceed: boolean; usageCount: number; resetsIn: string }> {
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

  const resetsIn = getTimeUntilEndOfMonth();
  
  if (currentUsage >= ULTIMATE_UPSCALER_MONTHLY_LIMIT) {
    return { canProceed: false, usageCount: currentUsage, resetsIn };
  }

  return { canProceed: true, usageCount: currentUsage, resetsIn };
}

export async function incrementUpscalerUsageUltimate(imagesToUpscale: number = 1): Promise<{ usageCount: number; resetsIn: string }> {
  const { userId } = auth();
  
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const key = `${ULTIMATE_UPSCALER_KEY_PREFIX}${userId}`;
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

export async function getUserUsageUltimate(): Promise<{ usageCount: number; resetsIn: string }> {
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

  const resetsIn = getTimeUntilEndOfMonth();
  return { usageCount: currentUsage, resetsIn };
}

export async function canUpscaleImagesUltimate(imagesToUpscale: number): Promise<{ canProceed: boolean; usageCount: number; resetsIn: string }> {
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

  const resetsIn = getTimeUntilEndOfMonth();
  
  if (currentUsage + imagesToUpscale > ULTIMATE_UPSCALER_MONTHLY_LIMIT) {
    return { canProceed: false, usageCount: currentUsage, resetsIn };
  }

  return { canProceed: true, usageCount: currentUsage, resetsIn };
}
