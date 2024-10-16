"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
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
import { getRedisClient } from "@/lib/redis";

export type SubscriptionTier = 'basic' | 'pro' | 'premium' | 'ultimate';

const SUBSCRIPTION_KEY_PREFIX = "user_subscription:";

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

async function getUserSubscription(userId: string | null): Promise<SubscriptionTier> {
  if (!userId) return "basic";
  
  const subscriptionKey = `${SUBSCRIPTION_KEY_PREFIX}${userId}`;
  let subscription;
  try {
    const redisClient = await getRedisClient();
    subscription = await redisClient.get(subscriptionKey);
  } catch (redisError) {
    console.error("Error accessing Redis for subscription:", redisError);
    subscription = null;
  }
  return (subscription as SubscriptionTier) || "basic";
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
    return { canProceed: false, usageCount: 0, resetsIn: "N/A" };
  }

  const subscription = await getUserSubscription(userId);
  const key = `${GENERATOR_KEY_PREFIX}${userId}`;
  let usageCount, lastUsageDate;
  
  try {
    const redisClient = await getRedisClient();
    usageCount = await redisClient.get(key);
    lastUsageDate = await redisClient.get(`${key}:date`);
  } catch (redisError) {
    console.error("Error accessing Redis for usage:", redisError);
    usageCount = null;
    lastUsageDate = null;
  }
  
  let currentUsage = typeof usageCount === 'string' ? parseInt(usageCount, 10) : 0;
  let limit = await getLimitForTier(subscription, 'generator');

  if (isNewPeriod(lastUsageDate as string | null, subscription !== 'basic')) {
    currentUsage = 0;
  }

  const resetsIn = getTimeUntilReset(subscription !== 'basic');
  
  return { 
    canProceed: currentUsage + imagesToGenerate <= limit, 
    usageCount: currentUsage, 
    resetsIn 
  };
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
    const redisClient = await getRedisClient();
    usageCount = await redisClient.get(key);
    lastUsageDate = await redisClient.get(`${key}:date`);
  } catch (redisError) {
    console.error("Error accessing Redis for usage:", redisError);
    usageCount = null;
    lastUsageDate = null;
  }

  let currentUsage = typeof usageCount === 'string' ? parseInt(usageCount, 10) : 0;

  if (isNewPeriod(lastUsageDate as string | null, subscription !== 'basic')) {
    currentUsage = 0;
  }

  currentUsage += imagesToGenerate;

  const redisClient = await getRedisClient();
  await redisClient.mSet([
    key, currentUsage.toString(),
    `${key}:date`, today,
    `${key}:total`, (parseInt(await redisClient.get(`${key}:total`) || '0', 10) + imagesToGenerate).toString()
  ]);
}

export async function canUpscaleImages(imagesToUpscale: number): Promise<{ canProceed: boolean; usageCount: number; resetsIn: string }> {
  const userId = await getUserId();
  
  if (!userId) {
    return { canProceed: false, usageCount: 0, resetsIn: "N/A" };
  }

  const subscription = await getUserSubscription(userId);
  const key = `${UPSCALER_KEY_PREFIX}${userId}`;
  let usageCount, lastUsageDate;
  
  try {
    const redisClient = await getRedisClient();
    [usageCount, lastUsageDate] = await Promise.all([
      redisClient.get(key),
      redisClient.get(`${key}:date`)
    ]);
  } catch (redisError) {
    console.error("Error accessing Redis for usage:", redisError);
    usageCount = 0;
    lastUsageDate = null;
  }
  
  let currentUsage = typeof usageCount === 'string' ? parseInt(usageCount, 10) : 0;
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
    const redisClient = await getRedisClient();
    [usageCount, lastUsageDate] = await Promise.all([
      redisClient.get(key),
      redisClient.get(`${key}:date`)
    ]);
  } catch (redisError) {
    console.error("Error accessing Redis for usage:", redisError);
    usageCount = 0;
    lastUsageDate = null;
  }

  let currentUsage = typeof usageCount === 'string' ? parseInt(usageCount, 10) : 0;

  if (isNewPeriod(lastUsageDate as string | null, subscription !== 'basic')) {
    currentUsage = 0;
  }

  currentUsage += imagesToUpscale;

  const redisClient = await getRedisClient();
  await redisClient.mSet([
    key, currentUsage.toString(),
    `${key}:date`, today,
    `${key}:total`, (parseInt(await redisClient.get(`${key}:total`) || '0', 10) + imagesToUpscale).toString()
  ]);
}

export async function getUpscalerUsage(): Promise<{ usageCount: number; resetsIn: string }> {
  const userId = await getUserId();
  
  if (!userId) {
    return { usageCount: 0, resetsIn: "N/A" };
  }

  const subscription = await getUserSubscription(userId);
  const key = `${UPSCALER_KEY_PREFIX}${userId}`;
  let usageCount, lastUsageDate;

  try {
    const redisClient = await getRedisClient();
    [usageCount, lastUsageDate] = await Promise.all([
      redisClient.get(key),
      redisClient.get(`${key}:date`)
    ]);
  } catch (redisError) {
    console.error("Error accessing Redis for usage:", redisError);
    usageCount = 0;
    lastUsageDate = null;
  }

  let currentUsage = typeof usageCount === 'string' ? parseInt(usageCount, 10) : 0;

  if (isNewPeriod(lastUsageDate as string | null, subscription !== 'basic')) {
    currentUsage = 0;
  }

  const resetsIn = getTimeUntilReset(subscription !== 'basic');
  return { usageCount: currentUsage, resetsIn };
}

export async function checkRateLimit(): Promise<{ canProceed: boolean; usageCount: number; resetsIn: string }> {
  const userId = await getUserId();
  
  if (!userId) {
    return { canProceed: false, usageCount: 0, resetsIn: "N/A" };
  }

  const key = `${UPSCALER_KEY_PREFIX}${userId}`;
  let usageCount, lastUsageDate;

  try {
    const redisClient = await getRedisClient();
    [usageCount, lastUsageDate] = await Promise.all([
      redisClient.get(key),
      redisClient.get(`${key}:date`)
    ]);
  } catch (redisError) {
    console.error("Error accessing Redis for usage:", redisError);
    // Fallback to default values
    usageCount = 0;
    lastUsageDate = null;
  }

  let currentUsage = typeof usageCount === 'string' ? parseInt(usageCount, 10) : 0;

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
    const redisClient = await getRedisClient();
    [usageCount, lastUsageDate] = await Promise.all([
      redisClient.get(key),
      redisClient.get(`${key}:date`)
    ]);
  } catch (redisError) {
    console.error("Error accessing Redis for usage:", redisError);
    // Fallback to default values
    usageCount = 0;
    lastUsageDate = null;
  }

  let currentUsage = typeof usageCount === 'string' ? parseInt(usageCount, 10) : 0;

  if (isNewPeriod(lastUsageDate as string | null, true)) {
    currentUsage = 0;
  }

  currentUsage += 1;

  const redisClient = await getRedisClient();
  await redisClient.mSet([
    key, currentUsage.toString(),
    `${key}:date`, new Date().toUTCString(),
    `${key}:total`, (parseInt(await redisClient.get(`${key}:total`) || '0', 10) + 1).toString()
  ]);

  const resetsIn = getTimeUntilReset(true);
  return { usageCount: currentUsage, resetsIn };
}

export async function getUserUsage(): Promise<{ usageCount: number; resetsIn: string }> {
  const userId = await getUserId();
  
  if (!userId) {
    return { usageCount: 0, resetsIn: "N/A" };
  }

  const subscription = await getUserSubscription(userId);
  const key = `${UPSCALER_KEY_PREFIX}${userId}`;
  let usageCount, lastUsageDate;

  try {
    const redisClient = await getRedisClient();
    [usageCount, lastUsageDate] = await Promise.all([
      redisClient.get(key),
      redisClient.get(`${key}:date`)
    ]);
  } catch (redisError) {
    console.error("Error accessing Redis for usage:", redisError);
    // Fallback to default values
    usageCount = 0;
    lastUsageDate = null;
  }

  let currentUsage = typeof usageCount === 'string' ? parseInt(usageCount, 10) : 0;

  if (isNewPeriod(lastUsageDate as string | null, subscription !== 'basic')) {
    currentUsage = 0;
    const redisClient = await getRedisClient();
    await redisClient.set(key, '0');
  }

  const resetsIn = getTimeUntilReset(subscription !== 'basic');
  return { usageCount: currentUsage, resetsIn };
}

export async function checkAndUpdateGeneratorLimit(imagesToGenerate: number): Promise<{ canProceed: boolean; usageCount: number; resetsIn: string }> {
  const result = await canGenerateImages(imagesToGenerate);
  
  if (result.canProceed) {
    await incrementGeneratorUsage(imagesToGenerate);
    result.usageCount += imagesToGenerate; // Update the usage count
  }
  
  return result;
}

export async function getGeneratorUsage(): Promise<{ usageCount: number; resetsIn: string; totalGenerated: number }> {
  const userId = await getUserId();
  
  if (!userId) {
    return { usageCount: 0, resetsIn: "N/A", totalGenerated: 0 };
  }

  const subscription = await getUserSubscription(userId);
  const key = `${GENERATOR_KEY_PREFIX}${userId}`;
  let usageCount, lastUsageDate, totalGenerated;

  try {
    const redisClient = await getRedisClient();
    [usageCount, lastUsageDate, totalGenerated] = await Promise.all([
      redisClient.get(key),
      redisClient.get(`${key}:date`),
      redisClient.get(`${key}:total`)
    ]);
  } catch (redisError) {
    console.error("Error accessing Redis for usage:", redisError);
    // Fallback to default values
    usageCount = 0;
    lastUsageDate = null;
    totalGenerated = 0;
  }

  let currentUsage = typeof usageCount === 'string' ? parseInt(usageCount, 10) : 0;
  let total = typeof totalGenerated === 'string' ? parseInt(totalGenerated, 10) : 0;

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
    return { canProceed: false, usageCount: 0, resetsIn: "N/A" };
  }

  const subscription = await getUserSubscription(userId);
  const key = `${ENHANCE_PROMPT_KEY_PREFIX}${userId}`;
  let usageCount, lastUsageDate;
  
  try {
    const redisClient = await getRedisClient();
    [usageCount, lastUsageDate] = await Promise.all([
      redisClient.get(key),
      redisClient.get(`${key}:date`)
    ]);
  } catch (redisError) {
    console.error("Error accessing Redis for usage:", redisError);
    usageCount = 0;
    lastUsageDate = null;
  }
  
  let currentUsage = typeof usageCount === 'string' ? parseInt(usageCount, 10) : 0;
  let limit = await getLimitForTier(subscription, 'enhance_prompt');

  if (isNewPeriod(lastUsageDate as string | null, subscription !== 'basic')) {
    currentUsage = 0;
  }

  const resetsIn = getTimeUntilReset(subscription !== 'basic');
  
  return { 
    canProceed: currentUsage < limit, 
    usageCount: currentUsage, 
    resetsIn 
  };
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
    const redisClient = await getRedisClient();
    [usageCount, lastUsageDate] = await Promise.all([
      redisClient.get(key),
      redisClient.get(`${key}:date`)
    ]);
  } catch (redisError) {
    console.error("Error accessing Redis for usage:", redisError);
    usageCount = 0;
    lastUsageDate = null;
  }

  let currentUsage = typeof usageCount === 'string' ? parseInt(usageCount, 10) : 0;

  if (isNewPeriod(lastUsageDate as string | null, subscription !== 'basic')) {
    currentUsage = 0;
  }

  currentUsage += 1;

  const redisClient = await getRedisClient();
  await redisClient.mSet([
    key, currentUsage.toString(),
    `${key}:date`, today,
    `${key}:total`, (parseInt(await redisClient.get(`${key}:total`) || '0', 10) + 1).toString()
  ]);
}

// New function to get prompt enhancement usage
export async function getEnhancePromptUsage(): Promise<{ usageCount: number; resetsIn: string; totalEnhanced: number }> {
  const userId = await getUserId();
  
  if (!userId) {
    return { usageCount: 0, resetsIn: "N/A", totalEnhanced: 0 };
  }

  const subscription = await getUserSubscription(userId);
  const key = `${ENHANCE_PROMPT_KEY_PREFIX}${userId}`;
  let usageCount, lastUsageDate, totalEnhanced;

  try {
    const redisClient = await getRedisClient();
    [usageCount, lastUsageDate, totalEnhanced] = await Promise.all([
      redisClient.get(key),
      redisClient.get(`${key}:date`),
      redisClient.get(`${key}:total`)
    ]);
  } catch (redisError) {
    console.error("Error accessing Redis for usage:", redisError);
    // Fallback to default values
    usageCount = 0;
    lastUsageDate = null;
    totalEnhanced = 0;
  }

  let currentUsage = typeof usageCount === 'string' ? parseInt(usageCount, 10) : 0;
  let total = typeof totalEnhanced === 'string' ? parseInt(totalEnhanced, 10) : 0;

  if (isNewPeriod(lastUsageDate as string | null, subscription !== 'basic')) {
    currentUsage = 0;
  }

  const resetsIn = getTimeUntilReset(subscription !== 'basic');
  return { usageCount: currentUsage, resetsIn, totalEnhanced: total };
}

export async function checkAndUpdateUpscalerLimit(imagesToUpscale: number, updateUsage: boolean = false): Promise<{ canProceed: boolean; usageCount: number; resetsIn: string }> {
  const userId = await getUserId();
  
  if (!userId) {
    return { canProceed: false, usageCount: 0, resetsIn: "N/A" };
  }

  const subscription = await getUserSubscription(userId);
  const key = `${UPSCALER_KEY_PREFIX}${userId}`;
  let usageCount, lastUsageDate;
  
  try {
    const redisClient = await getRedisClient();
    [usageCount, lastUsageDate] = await Promise.all([
      redisClient.get(key),
      redisClient.get(`${key}:date`)
    ]);
  } catch (redisError) {
    console.error("Error accessing Redis for usage:", redisError);
    usageCount = 0;
    lastUsageDate = null;
  }
  
  let currentUsage = typeof usageCount === 'string' ? parseInt(usageCount, 10) : 0;
  let limit = await getLimitForTier(subscription, 'upscaler');

  if (isNewPeriod(lastUsageDate as string | null, subscription !== 'basic')) {
    currentUsage = 0;
  }

  const canProceed = currentUsage + imagesToUpscale <= limit;
  const resetsIn = getTimeUntilReset(subscription !== 'basic');

  // Remove the usage update from here
  // We'll update the usage only after successful upscaling

  return { canProceed, usageCount: currentUsage, resetsIn };
}

// Add a new function to update usage after successful upscaling
export async function updateUpscalerUsage(imagesToUpscale: number): Promise<void> {
  const userId = await getUserId();
  
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const subscription = await getUserSubscription(userId);
  const key = `${UPSCALER_KEY_PREFIX}${userId}`;
  const today = new Date().toUTCString();

  const redisClient = await getRedisClient();
  await redisClient.mSet([
    key, (await redisClient.get(key) || '0'),
    `${key}:date`, today,
    `${key}:total`, (parseInt(await redisClient.get(`${key}:total`) || '0', 10) + imagesToUpscale).toString()
  ]);
}

export async function checkAndUpdateEnhancePromptLimit(count: number = 1, updateUsage: boolean = false): Promise<{ canProceed: boolean; usageCount: number; resetsIn: string }> {
  const userId = await getUserId();
  
  if (!userId) {
    return { canProceed: false, usageCount: 0, resetsIn: "N/A" };
  }

  const subscription = await getUserSubscription(userId);
  const key = `${ENHANCE_PROMPT_KEY_PREFIX}${userId}`;
  let usageCount, lastUsageDate;
  
  try {
    const redisClient = await getRedisClient();
    [usageCount, lastUsageDate] = await Promise.all([
      redisClient.get(key),
      redisClient.get(`${key}:date`)
    ]);
  } catch (redisError) {
    console.error("Error accessing Redis for usage:", redisError);
    usageCount = 0;
    lastUsageDate = null;
  }
  
  let currentUsage = typeof usageCount === 'string' ? parseInt(usageCount, 10) : 0;
  let limit = await getLimitForTier(subscription, 'enhance_prompt');

  if (isNewPeriod(lastUsageDate as string | null, subscription !== 'basic')) {
    currentUsage = 0;
  }

  const canProceed = currentUsage + count <= limit;
  const resetsIn = getTimeUntilReset(subscription !== 'basic');

  if (canProceed && updateUsage) {
    currentUsage += count;
    const today = new Date().toUTCString();
    const redisClient = await getRedisClient();
    await redisClient.mSet([
      key, currentUsage.toString(),
      `${key}:date`, today,
      `${key}:total`, (parseInt(await redisClient.get(`${key}:total`) || '0', 10) + count).toString()
    ]);
  }

  return { canProceed, usageCount: currentUsage, resetsIn };
}
