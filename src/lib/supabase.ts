import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';
import { getRedisClient } from '@/lib/redis';
import { clerkClient } from '@clerk/nextjs/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase environment variables');
}

// Client for client-side operations
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Client for server-side operations with elevated permissions
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Creates or updates a user in Supabase.
 * @param id - The Clerk user ID.
 * @param email - The user's email address.
 * @param username - The user's username.
 */
export async function createUserInSupabase(id: string, email: string, username: string) {
  try {
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .upsert(
        {
          clerk_id: id,
          email: email,
          username: username || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'clerk_id',
        }
      )
      .select();

    if (userError) {
      console.error('Error upserting user:', userError);
      throw userError;
    }

    console.log('User upserted in Supabase:', userData);

    const { data: subscriptionData, error: subscriptionError } = await supabaseAdmin
      .from('subscriptions')
      .upsert(
        {
          clerk_id: id,
          username: username || null,
          plan: 'basic',
          status: 'active',
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'clerk_id',
        }
      )
      .select();

    if (subscriptionError) {
      console.error('Error upserting subscription:', subscriptionError);
      throw subscriptionError;
    }

    console.log('Subscription upserted in Supabase:', subscriptionData);

    await syncUserDataWithRedis(id);
  } catch (error) {
    console.error('Error in createUserInSupabase:', error);
    throw error;
  }
}

/**
 * Updates a user in Supabase.
 * @param id - The Clerk user ID.
 * @param email - The user's email address.
 * @param username - The user's username.
 */
export async function updateUserInSupabase(id: string, email: string, username: string) {
  try {
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .update({
        email: email,
        username: username || null,
        updated_at: new Date().toISOString(),
      })
      .eq('clerk_id', id)
      .select();

    if (userError) {
      console.error('Error updating user:', userError);
      throw userError;
    }

    console.log('User updated in Supabase:', userData);

    const { data: subscriptionData, error: subscriptionError } = await supabaseAdmin
      .from('subscriptions')
      .update({
        username: username || null,
        updated_at: new Date().toISOString(),
      })
      .eq('clerk_id', id)
      .select();

    if (subscriptionError) {
      console.error('Error updating subscription:', subscriptionError);
      throw subscriptionError;
    }

    console.log('Subscription updated in Supabase:', subscriptionData);

    await syncUserDataWithRedis(id);
  } catch (error) {
    console.error('Error in updateUserInSupabase:', error);
    throw error;
  }
}

/**
 * Deletes a user and related data from Supabase and Redis.
 * @param clerkId - The Clerk user ID.
 */
export async function deleteUserFromSupabase(clerkId: string) {
  try {
    console.log(`Attempting to delete user ${clerkId} from Supabase`);

    // Delete from subscriptions table
    const { data: deletedSubscription, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .delete()
      .eq('clerk_id', clerkId)
      .select();

    if (subError) {
      console.error('Error deleting from subscriptions:', subError);
    } else {
      console.log(`Deleted subscription for user ${clerkId}:`, deletedSubscription);
    }

    // Delete from users table
    const { data: deletedUser, error: userError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('clerk_id', clerkId)
      .select();

    if (userError) {
      console.error('Error deleting from users:', userError);
    } else {
      console.log(`Deleted user ${clerkId}:`, deletedUser);
    }

    // Delete from Redis
    try {
      const redisClient = await getRedisClient();
      await redisClient.del(`user_subscription:${clerkId}`);
      await redisClient.del(`stripe_customer:${clerkId}`);
      console.log(`User ${clerkId} data deleted from Redis`);
    } catch (redisError) {
      console.error('Error deleting user data from Redis:', redisError);
    }

    console.log(`User ${clerkId} and related data deletion process completed`);
  } catch (error) {
    console.error('Error in deleteUserFromSupabase:', error);
    throw error;
  }
}

/**
 * Logs when a session is created.
 * @param userId - The Clerk user ID.
 */
export async function logSessionCreated(userId: string) {
  console.log(`Session created for user ${userId}`);
  // Placeholder for future session tracking functionality
}

/**
 * Tests the Supabase connection.
 * @returns True if the connection is successful; otherwise, false.
 */
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

/**
 * Retrieves the user's subscription from Supabase.
 * @param userId - The Clerk user ID.
 * @returns The subscription data or null.
 */
export async function getUserSubscription(userId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('clerk_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No subscription found
        console.log(`No subscription found for user ${userId}`);
        return null;
      }
      console.error('Error fetching user subscription:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error fetching user subscription:', error);
    return null;
  }
}

/**
 * Retrieves the user's usage from Supabase.
 * @param userId - The Clerk user ID.
 * @returns The usage data or null.
 */
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

/**
 * Syncs user data with Redis.
 * @param userId - The Clerk user ID.
 */
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

/**
 * Creates a basic subscription for a user.
 * @param userId - The Clerk user ID.
 * @returns The subscription data or null.
 */
export async function createBasicSubscription(
  userId: string
): Promise<{ plan: string; status: string; username: string | null } | null> {
  try {
    const user = await clerkClient.users.getUser(userId);
    const username = user.username || `${user.firstName || ''} ${user.lastName || ''}`.trim() || null;

    // Check if user already exists
    const { data: existingUser, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('clerk_id', userId)
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
      .upsert(
        {
          clerk_id: userId,
          username: username,
          plan: 'basic',
          status: 'active',
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'clerk_id',
        }
      )
      .select();

    if (error) throw error;
    console.log(`Created/updated basic subscription for user ${userId}`);
    return data[0] || null;
  } catch (error) {
    console.error('Error creating/updating basic subscription:', error);
    return null;
  }
}

/**
 * Saves or updates a user in Supabase.
 * @param userId - The Clerk user ID.
 * @returns The user and subscription data.
 */
export async function saveUserToSupabase(userId: string) {
  try {
    const user = await clerkClient.users.getUser(userId);
    const email = user.emailAddresses[0]?.emailAddress || '';
    const username = user.username || `${user.firstName || ''} ${user.lastName || ''}`.trim() || null;

    // Check if user already exists by clerk_id
    const { data: existingUser, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('clerk_id', userId)
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
          clerk_id: userId,
          email: email,
          username: username,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select();

      if (insertError) throw insertError;
      userData = data[0];
      console.log('New user saved in Supabase:', userData);
    } else {
      // Update existing user
      const { data, error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          email: email,
          username: username,
          updated_at: new Date().toISOString(),
        })
        .eq('clerk_id', userId)
        .select();

      if (updateError) throw updateError;
      userData = data[0];
      console.log('Existing user updated in Supabase:', userData);
    }

    // Upsert subscription
    const { data: subscriptionData, error: subscriptionError } = await supabaseAdmin
      .from('subscriptions')
      .upsert(
        {
          clerk_id: userId,
          username: username,
          plan: 'basic',
          status: 'active',
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'clerk_id',
        }
      )
      .select();

    if (subscriptionError) throw subscriptionError;
    console.log('Subscription created/updated for user:', subscriptionData[0]);

    await syncUserDataWithRedis(userId);

    return { user: userData, subscription: subscriptionData[0] };
  } catch (error) {
    console.error('Error saving user to Supabase:', error);
    throw error;
  }
}

/**
 * Updates the usage data for a user in Supabase.
 * @param clerkId - The Clerk user ID.
 * @param usage - The usage data to update.
 */
export async function updateUserUsage(clerkId: string, usage: { generator: number; upscaler: number; enhance_prompt: number }) {
  try {
    const { data, error } = await supabaseAdmin
      .from('usage_tracking')
      .upsert(
        {
          clerk_id: clerkId,
          generator: usage.generator,
          upscaler: usage.upscaler,
          enhance_prompt: usage.enhance_prompt,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'clerk_id',
        }
      )
      .select();

    if (error) {
      console.error('Error updating user usage:', error);
      throw error;
    }

    console.log('User usage updated in Supabase:', data);
    return data;
  } catch (error) {
    console.error('Unexpected error updating user usage:', error);
    throw error;
  }
}
