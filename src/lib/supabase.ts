import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'
import { User } from '@clerk/nextjs/server'
import { getRedisClient } from "./redis";

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

export async function saveUserToSupabase(user: User) {
  console.log('Attempting to save user to Supabase:', user.id);
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .upsert({
        id: user.id, // Use Clerk's user ID as the primary key
        clerk_id: user.id,
        email: user.emailAddresses[0]?.emailAddress || '',
        username: user.username || `${user.firstName} ${user.lastName}`.trim() || null,
        // Remove created_at as it's likely managed by Supabase
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'clerk_id',
      })
      .select();

    if (error) {
      console.error('Error saving user to Supabase:', error);
      throw error;
    }

    console.log('User saved successfully:', data);
    return data;
  } catch (error) {
    console.error('Unexpected error saving user to Supabase:', error);
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
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching user subscription:', error);
      return null;
    }

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
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;

    const redisClient = await getRedisClient();
    await redisClient.hSet(`user:${userId}`, {
      email: user.email,
      username: user.username || '',
      created_at: user.created_at || '',
      updated_at: user.updated_at || '',
    });

    console.log('User data synced with Redis:', userId);
  } catch (error) {
    console.error('Error syncing user data with Redis:', error);
  }
}
