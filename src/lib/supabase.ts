import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'
import { getRedisClient } from "@/lib/redis";
import { clerkClient } from "@clerk/nextjs/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase environment variables')
}

// Client for client-side operations
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Client for server-side operations with elevated permissions
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export async function saveUserToSupabase(userId: string) {
  try {
    const user = await clerkClient().users.getUser(userId);
    const { data, error } = await supabaseAdmin
      .from('users')
      .upsert({
        id: user.id,
        clerk_id: user.id,
        email: user.emailAddresses[0]?.emailAddress || '',
        username: user.username || `${user.firstName} ${user.lastName}`.trim() || null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'clerk_id',
      })
      .select();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving user to Supabase:', error);
    throw error;
  }
}

export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase.from('users').select('*').limit(1);
    if (error) throw error;
    console.log('Supabase connection successful:', data);
    return true;
  } catch (error) {
    console.error('Supabase connection failed:', error);
    return false;
  }
}

export async function getUserSubscription(userId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('clerk_id', userId)
      .single();

    if (error) {
      console.error('Error fetching user subscription:', error);
      return null;
    }

    // If no subscription is found, return a default "basic" plan
    if (!data) {
      // Fetch the user's information from Clerk
      const user = await clerkClient().users.getUser(userId);
      const username = user.username || `${user.firstName} ${user.lastName}`.trim() || null;

      return { 
        plan: 'basic', 
        status: 'active',
        username: username
      };
    }

    // Sync with Redis
    const redisClient = await getRedisClient();
    await redisClient.set(`user_subscription:${userId}`, data.plan, { EX: 300 }); // Cache for 5 minutes

    return data;
  } catch (error) {
    console.error('Unexpected error fetching user subscription:', error);
    return null;
  }
}

export async function getUserUsage(userId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('usage_tracking')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching user usage:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error fetching user usage:', error);
    return null;
  }
}

export async function syncUserDataWithRedis(userId: string) {
  try {
    const subscription = await getUserSubscription(userId);
    if (subscription) {
      const redisClient = await getRedisClient();
      await redisClient.set(`user_subscription:${userId}`, subscription.plan, { EX: 300 }); // Cache for 5 minutes
      console.log(`User data synced with Redis: ${userId}`);
    }
  } catch (error) {
    console.error('Error syncing user data with Redis:', error);
  }
}

export async function createBasicSubscription(userId: string) {
  try {
    const user = await clerkClient().users.getUser(userId);
    const username = user.username || `${user.firstName} ${user.lastName}`.trim() || null;

    // First, ensure the user exists in the users table
    await saveUserToSupabase(userId);

    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .upsert({
        clerk_id: userId,
        username: username,
        plan: 'basic',
        status: 'active',
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'clerk_id',
      });

    if (error) throw error;
    console.log(`Created basic subscription for user ${userId}`);
    return data;
  } catch (error) {
    console.error('Error creating basic subscription:', error);
    // Don't throw the error here, just log it
  }
}
