import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';
import { UsageData } from '@/stores/subscriptionStore';
import { getRedisClient } from '@/lib/redis';
import { clerkClient } from '@clerk/nextjs/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase environment variables');
}

// Client for server-side operations with elevated permissions
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export async function updateUserUsage(userId: string, usage: UsageData) {
  const { data, error } = await supabaseAdmin
    .from('usage_tracking')
    .upsert(
      {
        clerk_id: userId,
        generator: usage.generator,
        upscaler: usage.upscaler,
        enhance_prompt: usage.enhance_prompt,
        updated_at: new Date().toISOString(),
      },
      { 
        onConflict: 'clerk_id',
        ignoreDuplicates: false,
      }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getUserUsage(userId: string): Promise<UsageData | null> {
  const { data, error } = await supabaseAdmin
    .from('usage_tracking')
    .select('generator, upscaler, enhance_prompt')
    .eq('clerk_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }

  return {
    generator: Number(data.generator) || 0,
    upscaler: Number(data.upscaler) || 0,
    enhance_prompt: Number(data.enhance_prompt) || 0,
  };
}

export async function createUserUsage(userId: string): Promise<UsageData> {
  const initialUsage: UsageData = { generator: 0, upscaler: 0, enhance_prompt: 0 };
  const result = await updateUserUsage(userId, initialUsage);
  return {
    generator: result.generator ?? 0,
    upscaler: result.upscaler ?? 0,
    enhance_prompt: result.enhance_prompt ?? 0
  };
}

export async function saveUserToSupabase(userId: string) {
  try {
    // Fetch user data from Clerk
    const user = await clerkClient.users.getUser(userId);

    // Prepare the user data
    const userData = {
      clerk_id: userId,
      email: user.emailAddresses[0]?.emailAddress || '',
      username: user.username || `${user.firstName || ''} ${user.lastName || ''}`.trim() || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Upsert the user data
    const { data, error } = await supabaseAdmin
      .from('users')
      .upsert(userData, { onConflict: 'clerk_id' })
      .select()
      .single();

    if (error) throw error;
    console.log('User saved/updated in Supabase:', data);
    return data;
  } catch (error) {
    console.error('Error saving user to Supabase:', error);
    throw error;
  }
}

export async function getUserSubscription(userId: string) {
  // Implement the logic to get user subscription from Supabase
  // This is a placeholder implementation
  const { data, error } = await supabaseAdmin
    .from('subscriptions')
    .select('*')
    .eq('clerk_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data;
}

export async function syncUserDataWithRedis(userId: string) {
  // Implement the logic to sync user data with Redis
  // This is a placeholder implementation
  const redisClient = await getRedisClient();
  const subscription = await getUserSubscription(userId);
  if (subscription) {
    await redisClient.set(`user_subscription:${userId}`, JSON.stringify(subscription));
  }
}
