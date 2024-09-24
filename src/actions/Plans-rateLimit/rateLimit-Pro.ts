"use server";

import { auth } from "@clerk/nextjs/server";
import { kv } from "@vercel/kv";
import {
  PRO_UPSCALER_MONTHLY_LIMIT,
  PRO_GENERATOR_MONTHLY_LIMIT,
  PRO_ENHANCE_PROMPT_MONTHLY_LIMIT,
  PRO_UPSCALER_KEY_PREFIX,
  PRO_GENERATOR_KEY_PREFIX,
  PRO_ENHANCE_PROMPT_KEY_PREFIX,
} from "@/constants/rateLimits";
import { isNewPeriod, getTimeUntilReset } from "@/utils/dateUtils";

export async function canGenerateImagesPro(imagesToGenerate: number): Promise<{ canProceed: boolean; usageCount: number; resetsIn: string }> {
  const { userId } = auth();
  
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const key = `${PRO_GENERATOR_KEY_PREFIX}${userId}`;
  const [usageCount, lastUsageDate] = await kv.mget([key, `${key}:date`]);
  
  let currentUsage = typeof usageCount === 'number' ? usageCount : 0;

  if (isNewPeriod(lastUsageDate as string | null, true)) {
    currentUsage = 0;
  }

  const resetsIn = getTimeUntilReset(true);
  
  if (currentUsage + imagesToGenerate > PRO_GENERATOR_MONTHLY_LIMIT) {
    return { canProceed: false, usageCount: currentUsage, resetsIn };
  }

  return { canProceed: true, usageCount: currentUsage, resetsIn };
}

export async function incrementGeneratorUsagePro(imagesToGenerate: number): Promise<void> {
  const { userId } = auth();
  
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const key = `${PRO_GENERATOR_KEY_PREFIX}${userId}`;
  const today = new Date().toUTCString();

  const [usageCount, lastUsageDate] = await kv.mget([key, `${key}:date`]);

  let currentUsage = typeof usageCount === 'number' ? usageCount : 0;

  if (isNewPeriod(lastUsageDate as string | null, true)) {
    currentUsage = 0;
  }

  currentUsage += imagesToGenerate;

  await kv.mset({
    [key]: currentUsage,
    [`${key}:date`]: today,
    [`${key}:total`]: ((await kv.get(`${key}:total`) as number) || 0) + imagesToGenerate
  });
}

export async function checkAndUpdateRateLimitPro(): Promise<{ canProceed: boolean; usageCount: number; resetsIn: string }> {
  const { userId } = auth();
  
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const key = `${PRO_UPSCALER_KEY_PREFIX}${userId}`;
  const [usageCount, lastUsageDate] = await kv.mget([key, `${key}:date`]);

  let currentUsage = typeof usageCount === 'number' ? usageCount : 0;

  if (isNewPeriod(lastUsageDate as string | null, true)) {
    currentUsage = 0;
  }
  if (currentUsage >= PRO_UPSCALER_MONTHLY_LIMIT) {
    const resetsIn = getTimeUntilReset(true);
    return { canProceed: false, usageCount: currentUsage, resetsIn };
  }

  currentUsage += 1;

  await kv.mset({
    [key]: currentUsage,
    [`${key}:date`]: new Date().toUTCString(),
    [`${key}:total`]: ((await kv.get(`${key}:total`) as number) || 0) + 1
  });

  const resetsIn = getTimeUntilReset(true);
  return { canProceed: true, usageCount: currentUsage, resetsIn };
}

export async function canEnhancePromptPro(): Promise<{ canProceed: boolean; usageCount: number; resetsIn: string }> {
  // Pro users have unlimited prompt enhancements
  return { canProceed: true, usageCount: 0, resetsIn: "Unlimited" };
}

export async function incrementEnhancePromptUsagePro(): Promise<void> {
  const { userId } = auth();
  
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const key = `${PRO_ENHANCE_PROMPT_KEY_PREFIX}${userId}`;
  const today = new Date().toUTCString();

  await kv.mset({
    [`${key}:date`]: today,
    [`${key}:total`]: ((await kv.get(`${key}:total`) as number) || 0) + 1
  });
}
