"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { kv } from "@vercel/kv";
import {
  UPSCALER_DAILY_LIMIT,
  GENERATOR_DAILY_LIMIT,
  UPSCALER_KEY_PREFIX,
  GENERATOR_KEY_PREFIX,
  ENHANCE_PROMPT_KEY_PREFIX,
  ENHANCE_PROMPT_DAILY_LIMIT,
  PRO_UPSCALER_MONTHLY_LIMIT,
  PRO_GENERATOR_MONTHLY_LIMIT,
  PRO_ENHANCE_PROMPT_MONTHLY_LIMIT,
  PREMIUM_UPSCALER_MONTHLY_LIMIT,
  PREMIUM_GENERATOR_MONTHLY_LIMIT,
  PREMIUM_ENHANCE_PROMPT_MONTHLY_LIMIT,
  ULTIMATE_UPSCALER_MONTHLY_LIMIT,
  ULTIMATE_GENERATOR_MONTHLY_LIMIT,
  ULTIMATE_ENHANCE_PROMPT_MONTHLY_LIMIT
} from "@/constants/rateLimits";
import { isNewPeriod, getTimeUntilReset } from "@/utils/dateUtils";

export type SubscriptionTier = 'basic' | 'pro' | 'premium' | 'ultimate';

const SUBSCRIPTION_KEY_PREFIX = "user_subscription:";

async function getUserSubscription(userId: string): Promise<SubscriptionTier> {
  const subscriptionKey = `${SUBSCRIPTION_KEY_PREFIX}${userId}`;
  let subscription;
  try {
    subscription = await kv.get(subscriptionKey);
  } catch (kvError) {
    console.error("Error accessing Vercel KV for subscription:", kvError);
    subscription = "basic";
  }
  return subscription as SubscriptionTier || "basic";
}

async function getUserId(): Promise<string | null> {
  try {
    const authResult = auth();
    return authResult.userId;
  } catch (error) {
    console.error("Error getting userId from auth():", error);
    try {
      const user = await currentUser();
      return user?.id || null;
    } catch (fallbackError) {
      console.error("Error getting userId from currentUser():", fallbackError);
      return null;
    }
  }
}

export async function getLimitForTier(tier: SubscriptionTier, type: 'generator' | 'upscaler' | 'enhance_prompt'): Promise<number> {
  switch (type) {
    case 'generator':
      return tier === 'ultimate' ? ULTIMATE_GENERATOR_MONTHLY_LIMIT :
             tier === 'premium' ? PREMIUM_GENERATOR_MONTHLY_LIMIT :
             tier === 'pro' ? PRO_GENERATOR_MONTHLY_LIMIT :
             GENERATOR_DAILY_LIMIT;
    case 'upscaler':
      return tier === 'ultimate' ? ULTIMATE_UPSCALER_MONTHLY_LIMIT :
             tier === 'premium' ? PREMIUM_UPSCALER_MONTHLY_LIMIT :
             tier === 'pro' ? PRO_UPSCALER_MONTHLY_LIMIT :
             UPSCALER_DAILY_LIMIT;
    case 'enhance_prompt':
      return tier === 'ultimate' ? ULTIMATE_ENHANCE_PROMPT_MONTHLY_LIMIT :
             tier === 'premium' ? PREMIUM_ENHANCE_PROMPT_MONTHLY_LIMIT :
             tier === 'pro' ? PRO_ENHANCE_PROMPT_MONTHLY_LIMIT :
             ENHANCE_PROMPT_DAILY_LIMIT;
  }
}

export async function canGenerateImages(imagesToGenerate: number): Promise<{ canProceed: boolean; usageCount: number; resetsIn: string }> {
  const userId = await getUserId();
  
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const subscription = await getUserSubscription(userId);
  const key = `${GENERATOR_KEY_PREFIX}${userId}`;
  let usageCount, lastUsageDate;
  
  try {
    [usageCount, lastUsageDate] = await kv.mget([key, `${key}:date`]);
  } catch (kvError) {
    console.error("Error accessing Vercel KV for usage:", kvError);
    usageCount = 0;
    lastUsageDate = null;
  }
  
  let currentUsage = typeof usageCount === 'number' ? usageCount : 0;
  let limit = await getLimitForTier(subscription, 'generator');

  if (isNewPeriod(lastUsageDate as string | null, subscription !== 'basic')) {
    currentUsage = 0;
  }

  const resetsIn = getTimeUntilReset(subscription !== 'basic');
  
  if (currentUsage + imagesToGenerate > limit) {
    return { canProceed: false, usageCount: currentUsage, resetsIn };
  }

  return { canProceed: true, usageCount: currentUsage, resetsIn };
}

export async function incrementGeneratorUsage(imagesToGenerate: number): Promise<void> {
  const userId = await getUserId();
  
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const subscription = await getUserSubscription(userId);
  const key = `${GENERATOR_KEY_PREFIX}${userId}`;
  const today = new Date().toUTCString();

  let usageCount, lastUsageDate;

  try {
    [usageCount, lastUsageDate] = await kv.mget([key, `${key}:date`]);
  } catch (kvError) {
    console.error("Error accessing Vercel KV for usage:", kvError);
    usageCount = 0;
    lastUsageDate = null;
  }

  let currentUsage = typeof usageCount === 'number' ? usageCount : 0;

  if (isNewPeriod(lastUsageDate as string | null, subscription !== 'basic')) {
    currentUsage = 0;
  }

  currentUsage += imagesToGenerate;

  await kv.mset({
    [key]: currentUsage,
    [`${key}:date`]: today,
    [`${key}:total`]: ((await kv.get(`${key}:total`) as number) || 0) + imagesToGenerate
  });
}

export async function canUpscaleImages(imagesToUpscale: number): Promise<{ canProceed: boolean; usageCount: number; resetsIn: string }> {
  const userId = await getUserId();
  
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const subscription = await getUserSubscription(userId);
  const key = `${UPSCALER_KEY_PREFIX}${userId}`;
  let usageCount, lastUsageDate;
  
  try {
    [usageCount, lastUsageDate] = await kv.mget([key, `${key}:date`]);
  } catch (kvError) {
    console.error("Error accessing Vercel KV for usage:", kvError);
    usageCount = 0;
    lastUsageDate = null;
  }
  
  let currentUsage = typeof usageCount === 'number' ? usageCount : 0;
  let limit = await getLimitForTier(subscription, 'upscaler');

  if (isNewPeriod(lastUsageDate as string | null, subscription !== 'basic')) {
    currentUsage = 0;
  }

  const resetsIn = getTimeUntilReset(subscription !== 'basic');
  
  if (currentUsage + imagesToUpscale > limit) {
    return { canProceed: false, usageCount: currentUsage, resetsIn };
  }

  return { canProceed: true, usageCount: currentUsage, resetsIn };
}

export async function incrementUpscalerUsage(imagesToUpscale: number): Promise<void> {
  const userId = await getUserId();
  
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const subscription = await getUserSubscription(userId);
  const key = `${UPSCALER_KEY_PREFIX}${userId}`;
  const today = new Date().toUTCString();

  let usageCount, lastUsageDate;

  try {
    [usageCount, lastUsageDate] = await kv.mget([key, `${key}:date`]);
  } catch (kvError) {
    console.error("Error accessing Vercel KV for usage:", kvError);
    usageCount = 0;
    lastUsageDate = null;
  }

  let currentUsage = typeof usageCount === 'number' ? usageCount : 0;

  if (isNewPeriod(lastUsageDate as string | null, subscription !== 'basic')) {
    currentUsage = 0;
  }

  currentUsage += imagesToUpscale;

  await kv.mset({
    [key]: currentUsage,
    [`${key}:date`]: today,
    [`${key}:total`]: ((await kv.get(`${key}:total`) as number) || 0) + imagesToUpscale
  });
}

export async function getUpscalerUsage(): Promise<{ usageCount: number; resetsIn: string }> {
  const userId = await getUserId();
  
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const subscription = await getUserSubscription(userId);
  const key = `${UPSCALER_KEY_PREFIX}${userId}`;
  let usageCount, lastUsageDate;

  try {
    [usageCount, lastUsageDate] = await kv.mget([key, `${key}:date`]);
  } catch (kvError) {
    console.error("Error accessing Vercel KV for usage:", kvError);
    usageCount = 0;
    lastUsageDate = null;
  }

  let currentUsage = typeof usageCount === 'number' ? usageCount : 0;

  if (isNewPeriod(lastUsageDate as string | null, subscription !== 'basic')) {
    currentUsage = 0;
  }

  const resetsIn = getTimeUntilReset(subscription !== 'basic');
  return { usageCount: currentUsage, resetsIn };
}

export async function checkRateLimit(): Promise<{ canProceed: boolean; usageCount: number; resetsIn: string }> {
  const userId = await getUserId();
  
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const key = `${UPSCALER_KEY_PREFIX}${userId}`;
  let usageCount, lastUsageDate;

  try {
    [usageCount, lastUsageDate] = await kv.mget([key, `${key}:date`]);
  } catch (kvError) {
    console.error("Error accessing Vercel KV for usage:", kvError);
    // Fallback to default values
    usageCount = 0;
    lastUsageDate = null;
  }

  let currentUsage = typeof usageCount === 'number' ? usageCount : 0;

  if (isNewPeriod(lastUsageDate as string | null, true)) {
    currentUsage = 0;
  }

  const canProceed = currentUsage < UPSCALER_DAILY_LIMIT;
  const resetsIn = getTimeUntilReset(true);

  return { canProceed, usageCount: currentUsage, resetsIn };
}

export async function incrementRateLimit(): Promise<{ usageCount: number; resetsIn: string }> {
  const userId = await getUserId();
  
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const key = `${UPSCALER_KEY_PREFIX}${userId}`;
  let usageCount, lastUsageDate;

  try {
    [usageCount, lastUsageDate] = await kv.mget([key, `${key}:date`]);
  } catch (kvError) {
    console.error("Error accessing Vercel KV for usage:", kvError);
    // Fallback to default values
    usageCount = 0;
    lastUsageDate = null;
  }

  let currentUsage = typeof usageCount === 'number' ? usageCount : 0;

  if (isNewPeriod(lastUsageDate as string | null, true)) {
    currentUsage = 0;
  }

  currentUsage += 1;

  await kv.mset({
    [key]: currentUsage,
    [`${key}:date`]: new Date().toUTCString(),
    [`${key}:total`]: ((await kv.get(`${key}:total`) as number) || 0) + 1
  });

  const resetsIn = getTimeUntilReset(true);
  return { usageCount: currentUsage, resetsIn };
}

export async function getUserUsage(): Promise<{ usageCount: number; resetsIn: string }> {
  const userId = await getUserId();
  
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const subscription = await getUserSubscription(userId);
  const key = `${UPSCALER_KEY_PREFIX}${userId}`;
  let usageCount, lastUsageDate;

  try {
    [usageCount, lastUsageDate] = await kv.mget([key, `${key}:date`]);
  } catch (kvError) {
    console.error("Error accessing Vercel KV for usage:", kvError);
    // Fallback to default values
    usageCount = 0;
    lastUsageDate = null;
  }

  let currentUsage = typeof usageCount === 'number' ? usageCount : 0;

  if (isNewPeriod(lastUsageDate as string | null, subscription !== 'basic')) {
    currentUsage = 0;
    await kv.set(key, 0);
  }

  const resetsIn = getTimeUntilReset(subscription !== 'basic');
  return { usageCount: currentUsage, resetsIn };
}

export async function checkAndUpdateGeneratorLimit(imagesToGenerate: number): Promise<{ canProceed: boolean; usageCount: number; resetsIn: string }> {
  const userId = await getUserId();
  
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const subscription = await getUserSubscription(userId);
  const key = `${GENERATOR_KEY_PREFIX}${userId}`;
  let usageCount, lastUsageDate;
  
  try {
    [usageCount, lastUsageDate] = await kv.mget([key, `${key}:date`]);
  } catch (kvError) {
    console.error("Error accessing Vercel KV for usage:", kvError);
    // Fallback to default values
    usageCount = 0;
    lastUsageDate = null;
  }
  
  let currentUsage = typeof usageCount === 'number' ? usageCount : 0;
  let limit = await getLimitForTier(subscription, 'generator');

  if (isNewPeriod(lastUsageDate as string | null, subscription !== 'basic')) {
    currentUsage = 0;
  }

  if (currentUsage + imagesToGenerate > limit) {
    const resetsIn = getTimeUntilReset(subscription !== 'basic');
    return { canProceed: false, usageCount: currentUsage, resetsIn };
  }

  currentUsage += imagesToGenerate;

  await kv.mset({
    [key]: currentUsage,
    [`${key}:date`]: new Date().toUTCString(),
    [`${key}:total`]: ((await kv.get(`${key}:total`) as number) || 0) + imagesToGenerate
  });

  const resetsIn = getTimeUntilReset(subscription !== 'basic');
  return { canProceed: true, usageCount: currentUsage, resetsIn };
}

export async function getGeneratorUsage(): Promise<{ usageCount: number; resetsIn: string; totalGenerated: number }> {
  const userId = await getUserId();
  
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const subscription = await getUserSubscription(userId);
  const key = `${GENERATOR_KEY_PREFIX}${userId}`;
  let usageCount, lastUsageDate, totalGenerated;

  try {
    [usageCount, lastUsageDate, totalGenerated] = await kv.mget([key, `${key}:date`, `${key}:total`]);
  } catch (kvError) {
    console.error("Error accessing Vercel KV for usage:", kvError);
    // Fallback to default values
    usageCount = 0;
    lastUsageDate = null;
    totalGenerated = 0;
  }

  let currentUsage = typeof usageCount === 'number' ? usageCount : 0;
  let total = typeof totalGenerated === 'number' ? totalGenerated : 0;

  if (isNewPeriod(lastUsageDate as string | null, subscription !== 'basic')) {
    currentUsage = 0;
  }

  const resetsIn = getTimeUntilReset(subscription !== 'basic');
  return { usageCount: currentUsage, resetsIn, totalGenerated: total };
}

// New function to check if prompt enhancement is allowed
export async function canEnhancePrompt(): Promise<{ canProceed: boolean; usageCount: number; resetsIn: string }> {
  const userId = await getUserId();
  
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const subscription = await getUserSubscription(userId);
  const key = `${ENHANCE_PROMPT_KEY_PREFIX}${userId}`;
  let usageCount, lastUsageDate;
  
  try {
    [usageCount, lastUsageDate] = await kv.mget([key, `${key}:date`]);
  } catch (kvError) {
    console.error("Error accessing Vercel KV for usage:", kvError);
    // Fallback to default values
    usageCount = 0;
    lastUsageDate = null;
  }
  
  let currentUsage = typeof usageCount === 'number' ? usageCount : 0;
  let limit = await getLimitForTier(subscription, 'enhance_prompt');

  if (isNewPeriod(lastUsageDate as string | null, subscription !== 'basic')) {
    currentUsage = 0;
  }

  const resetsIn = getTimeUntilReset(subscription !== 'basic');
  
  if (currentUsage >= limit) {
    return { canProceed: false, usageCount: currentUsage, resetsIn };
  }

  return { canProceed: true, usageCount: currentUsage, resetsIn };
}

// New function to increment prompt enhancement usage
export async function incrementEnhancePromptUsage(): Promise<void> {
  const userId = await getUserId();
  
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const subscription = await getUserSubscription(userId);
  const key = `${ENHANCE_PROMPT_KEY_PREFIX}${userId}`;
  const today = new Date().toUTCString();

  let usageCount, lastUsageDate;

  try {
    [usageCount, lastUsageDate] = await kv.mget([key, `${key}:date`]);
  } catch (kvError) {
    console.error("Error accessing Vercel KV for usage:", kvError);
    // Fallback to default values
    usageCount = 0;
    lastUsageDate = null;
  }

  let currentUsage = typeof usageCount === 'number' ? usageCount : 0;

  if (isNewPeriod(lastUsageDate as string | null, subscription !== 'basic')) {
    currentUsage = 0;
  }

  currentUsage += 1;

  await kv.mset({
    [key]: currentUsage,
    [`${key}:date`]: today,
    [`${key}:total`]: ((await kv.get(`${key}:total`) as number) || 0) + 1
  });
}

// New function to get prompt enhancement usage
export async function getEnhancePromptUsage(): Promise<{ usageCount: number; resetsIn: string; totalEnhanced: number }> {
  const userId = await getUserId();
  
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const subscription = await getUserSubscription(userId);
  const key = `${ENHANCE_PROMPT_KEY_PREFIX}${userId}`;
  let usageCount, lastUsageDate, totalEnhanced;

  try {
    [usageCount, lastUsageDate, totalEnhanced] = await kv.mget([key, `${key}:date`, `${key}:total`]);
  } catch (kvError) {
    console.error("Error accessing Vercel KV for usage:", kvError);
    // Fallback to default values
    usageCount = 0;
    lastUsageDate = null;
    totalEnhanced = 0;
  }

  let currentUsage = typeof usageCount === 'number' ? usageCount : 0;
  let total = typeof totalEnhanced === 'number' ? totalEnhanced : 0;

  if (isNewPeriod(lastUsageDate as string | null, subscription !== 'basic')) {
    currentUsage = 0;
  }

  const resetsIn = getTimeUntilReset(subscription !== 'basic');
  return { usageCount: currentUsage, resetsIn, totalEnhanced: total };
}