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
  PRO_ENHANCE_PROMPT_MONTHLY_LIMIT
} from "@/constants/rateLimits";

const SUBSCRIPTION_KEY_PREFIX = "user_subscription:";

async function getUserSubscription(userId: string): Promise<string> {
  const subscriptionKey = `${SUBSCRIPTION_KEY_PREFIX}${userId}`;
  let subscription;
  try {
    subscription = await kv.get(subscriptionKey);
  } catch (kvError) {
    console.error("Error accessing Vercel KV for subscription:", kvError);
    subscription = "basic";
  }
  return subscription as string || "basic";
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

// Modify the existing functions to check subscription
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
    // Fallback to default values
    usageCount = 0;
    lastUsageDate = null;
  }
  
  let currentUsage = typeof usageCount === 'number' ? usageCount : 0;
  let limit = subscription === "pro" ? PRO_GENERATOR_MONTHLY_LIMIT : GENERATOR_DAILY_LIMIT;

  if (isNewPeriod(lastUsageDate as string | null, subscription)) {
    currentUsage = 0;
  }

  const resetsIn = getTimeUntilReset(subscription);
  
  if (currentUsage + imagesToGenerate > limit) {
    return { canProceed: false, usageCount: currentUsage, resetsIn };
  }

  return { canProceed: true, usageCount: currentUsage, resetsIn };
}

// Separate function to increment generator usage after successful generation
export async function incrementGeneratorUsage(imagesToGenerate: number): Promise<void> {
  const userId = await getUserId();
  
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const key = `${GENERATOR_KEY_PREFIX}${userId}`;
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

  if (isNewDay(lastUsageDate as string | null)) {
    currentUsage = 0;
  }

  currentUsage += imagesToGenerate;

  await kv.mset({
    [key]: currentUsage,
    [`${key}:date`]: today,
    [`${key}:total`]: ((await kv.get(`${key}:total`) as number) || 0) + imagesToGenerate
  });
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

  if (isNewDay(lastUsageDate as string | null)) {
    currentUsage = 0;
  }

  const canProceed = currentUsage < UPSCALER_DAILY_LIMIT;
  const resetsIn = getTimeUntilReset('basic');

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

  if (isNewDay(lastUsageDate as string | null)) {
    currentUsage = 0;
  }

  currentUsage += 1;

  await kv.mset({
    [key]: currentUsage,
    [`${key}:date`]: new Date().toUTCString(),
    [`${key}:total`]: ((await kv.get(`${key}:total`) as number) || 0) + 1
  });

  const resetsIn = getTimeUntilReset('basic');
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

  if (isNewPeriod(lastUsageDate as string | null, subscription)) {
    currentUsage = 0;
    await kv.set(key, 0);
  }

  const resetsIn = getTimeUntilReset(subscription);
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
  let limit = subscription === "pro" ? PRO_GENERATOR_MONTHLY_LIMIT : GENERATOR_DAILY_LIMIT;

  if (isNewPeriod(lastUsageDate as string | null, subscription)) {
    currentUsage = 0;
  }

  if (currentUsage + imagesToGenerate > limit) {
    const resetsIn = getTimeUntilReset(subscription);
    return { canProceed: false, usageCount: currentUsage, resetsIn };
  }

  currentUsage += imagesToGenerate;

  await kv.mset({
    [key]: currentUsage,
    [`${key}:date`]: new Date().toUTCString(),
    [`${key}:total`]: ((await kv.get(`${key}:total`) as number) || 0) + imagesToGenerate
  });

  const resetsIn = getTimeUntilReset(subscription);
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

  if (isNewPeriod(lastUsageDate as string | null, subscription)) {
    currentUsage = 0;
  }

  const resetsIn = getTimeUntilReset(subscription);
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
  let limit = subscription === "pro" ? PRO_ENHANCE_PROMPT_MONTHLY_LIMIT : ENHANCE_PROMPT_DAILY_LIMIT;

  if (isNewPeriod(lastUsageDate as string | null, subscription)) {
    currentUsage = 0;
  }

  const resetsIn = getTimeUntilReset(subscription);
  
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

  if (isNewDay(lastUsageDate as string | null)) {
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

  if (isNewPeriod(lastUsageDate as string | null, subscription)) {
    currentUsage = 0;
  }

  const resetsIn = getTimeUntilReset(subscription);
  return { usageCount: currentUsage, resetsIn, totalEnhanced: total };
}

// Helper functions
function isNewPeriod(lastUsageDate: string | null, subscription: string): boolean {
  if (!lastUsageDate) return true;
  const now = new Date();
  const last = new Date(lastUsageDate);
  if (subscription === "pro") {
    return now.getUTCMonth() !== last.getUTCMonth() || now.getUTCFullYear() !== last.getUTCFullYear();
  } else {
    return now.getUTCDate() !== last.getUTCDate() || now.getUTCMonth() !== last.getUTCMonth() || now.getUTCFullYear() !== last.getUTCFullYear();
  }
}

function getTimeUntilReset(subscription: string): string {
  const now = new Date();
  if (subscription === "pro") {
    const nextMonth = new Date(now.getUTCFullYear(), now.getUTCMonth() + 1, 1);
    const msUntilNextMonth = nextMonth.getTime() - now.getTime();
    const daysUntilNextMonth = Math.ceil(msUntilNextMonth / (1000 * 60 * 60 * 24));
    return `${daysUntilNextMonth} days`;
  } else {
    const tomorrow = new Date(now);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    const hoursUntilMidnight = Math.floor(msUntilMidnight / (1000 * 60 * 60));
    const minutesUntilMidnight = Math.floor((msUntilMidnight % (1000 * 60 * 60)) / (1000 * 60));
    return `${hoursUntilMidnight}h ${minutesUntilMidnight}m`;
  }
}

function isNewDay(lastUsageDate: string | null): boolean {
  if (!lastUsageDate) return true;
  const now = new Date();
  const last = new Date(lastUsageDate);
  return now.getUTCDate() !== last.getUTCDate() || now.getUTCMonth() !== last.getUTCMonth() || now.getUTCFullYear() !== last.getUTCFullYear();
}