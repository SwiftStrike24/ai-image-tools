import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { updateUserUsage, getUserUsage, createUserUsage } from '@/lib/supabaseAdmin';
import { UsageData } from '@/stores/subscriptionStore';
import { getRedisClient } from '@/lib/redis';

export async function POST(req: NextRequest) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const clientUsage = body as UsageData;

    let currentUsage = await getUserUsage(userId);
    let isNewUser = false;

    if (!currentUsage) {
      // This is a new user, so we create a new usage entry with zero values
      currentUsage = await createUserUsage(userId);
      isNewUser = true;
      console.log('New user usage created:', JSON.stringify(currentUsage, null, 2));
    }

    // Initialize Redis usage for new users
    const redisClient = await getRedisClient();
    const redisKey = `user_usage:${userId}`;
    const redisUsage = await redisClient.get(redisKey);

    if (!redisUsage) {
      await redisClient.set(redisKey, JSON.stringify(currentUsage));
      console.log('New user Redis usage initialized:', JSON.stringify(currentUsage, null, 2));
    }

    let updatedUsage: UsageData;

    if (isNewUser) {
      // For new users, use the client usage directly
      updatedUsage = clientUsage;
    } else {
      // For existing users, calculate the difference and update
      const usageDifference: UsageData = {
        generator: Math.max(clientUsage.generator - currentUsage.generator, 0),
        upscaler: Math.max(clientUsage.upscaler - currentUsage.upscaler, 0),
        enhance_prompt: Math.max(clientUsage.enhance_prompt - currentUsage.enhance_prompt, 0),
      };

      updatedUsage = {
        generator: currentUsage.generator + usageDifference.generator,
        upscaler: currentUsage.upscaler + usageDifference.upscaler,
        enhance_prompt: currentUsage.enhance_prompt + usageDifference.enhance_prompt,
      };
    }

    const result = await updateUserUsage(userId, updatedUsage);
    console.log('Usage sync result:', JSON.stringify(result, null, 2));

    // Update Redis usage
    await redisClient.set(redisKey, JSON.stringify(updatedUsage));

    return NextResponse.json({ success: true, updatedUsage: result });
  } catch (error: any) {
    console.error('Error syncing usage data:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: error.message 
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { userId } = auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    let usage = await getUserUsage(userId);
    if (!usage) {
      usage = await createUserUsage(userId);
      console.log('New user usage created:', JSON.stringify(usage, null, 2));
    }
    return NextResponse.json({ success: true, usage });
  } catch (error: any) {
    console.error('Error fetching usage data:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: error.message 
    }, { status: 500 });
  }
}
