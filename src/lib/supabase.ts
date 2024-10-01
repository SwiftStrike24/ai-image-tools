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
    const user = await clerkClient.users.getUser(userId);
    const email = user.emailAddresses[0]?.emailAddress || '';
    const username = user.username || `${user.firstName} ${user.lastName}`.trim() || null;

    // Check if user already exists by email
    const { data: existingUser, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    let userData;
    if (!existingUser) {
      // Insert new user
      const { data, error: insertError } = await supabaseAdmin
        .from('users')
        .insert({
          id: user.id,
          clerk_id: user.id,
          email: email,
          username: username,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select();

      if (insertError) throw insertError;
      userData = data[0];
      console.log('New user saved in Supabase:', userId);
    } else {
      // Update existing user
      const { data, error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          clerk_id: user.id,
          username: username,
          updated_at: new Date().toISOString(),
        })
        .eq('email', email)
        .select();

      if (updateError) throw updateError;
      userData = data[0];
      console.log('Existing user updated in Supabase:', userId);
    }

    // Upsert subscription
    const { data: subscriptionData, error: subscriptionError } = await supabaseAdmin
      .from('subscriptions')
      .upsert({
        clerk_id: user.id,
        username: username,
        plan: 'basic',
        status: 'active',
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'clerk_id',
      })
      .select();

    if (subscriptionError) throw subscriptionError;
    console.log('Subscription created/updated for user:', userId);

    return { user: userData, subscription: subscriptionData[0] };
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
      if (error.code === 'PGRST116') {
        // No subscription found, create a default basic subscription
        console.log(`No subscription found for user ${userId}, creating default basic subscription`);
        return createBasicSubscription(userId);
      }
      console.error('Error fetching user subscription:', error);
      // Instead of throwing, return null or a default subscription
      return { plan: 'basic', status: 'active', username: null };
    }

    return data;
  } catch (error) {
    console.error('Unexpected error fetching user subscription:', error);
    // Instead of throwing, return null or a default subscription
    return { plan: 'basic', status: 'active', username: null };
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

export async function createBasicSubscription(userId: string): Promise<{ plan: string; status: string; username: string | null; } | null> {
  try {
    const user = await clerkClient().users.getUser(userId);
    const username = user.username || `${user.firstName} ${user.lastName}`.trim() || null;
    const email = user.emailAddresses[0]?.emailAddress || '';

    // Check if user already exists
    const { data: existingUser, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    if (!existingUser) {
      // If user doesn't exist, create new user
      await saveUserToSupabase(userId);
    }

    // Upsert subscription
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
      })
      .select();

    if (error) throw error;
    console.log(`Created/updated basic subscription for user ${userId}`);
    return data[0] || null;
  } catch (error) {
    console.error('Error creating/updating basic subscription:', error);
    return null;
  }
}

export async function deleteUserFromSupabase(clerkId: string) {
  try {
    console.log(`Attempting to delete user ${clerkId} from Supabase`);

    // Delete from subscriptions table
    const { error: subError } = await supabaseAdmin.from('subscriptions').delete().eq('clerk_id', clerkId);
    if (subError) {
      console.error('Error deleting from subscriptions:', subError);
    } else {
      console.log(`Deleted user ${clerkId} from subscriptions table`);
    }
    
    // Delete from users table
    const { error: userError } = await supabaseAdmin.from('users').delete().eq('clerk_id', clerkId);
    if (userError) {
      console.error('Error deleting from users:', userError);
    } else {
      console.log(`Deleted user ${clerkId} from users table`);
    }
    
    console.log(`User ${clerkId} and related data deleted from Supabase`);
  } catch (error) {
    console.error('Error deleting user from Supabase:', error);
    throw error;
  }
}
