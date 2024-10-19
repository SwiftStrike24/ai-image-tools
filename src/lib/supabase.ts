import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';
import { UsageData } from '@/stores/subscriptionStore';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Client for client-side operations
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

let usageChannel: RealtimeChannel | null = null;

export function subscribeToUsageChanges(userId: string, onUpdate: (usage: UsageData) => void) {
  if (usageChannel) {
    usageChannel.unsubscribe();
  }

  usageChannel = supabase
    .channel(`usage_updates_${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'usage_tracking',
        filter: `clerk_id=eq.${userId}`,
      },
      (payload) => {
        const newUsage: UsageData = {
          generator: payload.new.generator,
          upscaler: payload.new.upscaler,
          enhance_prompt: payload.new.enhance_prompt,
        };
        onUpdate(newUsage);
      }
    )
    .subscribe();

  return () => {
    if (usageChannel) {
      usageChannel.unsubscribe();
    }
  };
}

// Add these exported functions
export async function createUserInSupabase(id: string, email: string, username: string) {
  // Implement user creation logic here
  console.log('Creating user in Supabase:', { id, email, username });
}

export async function updateUserInSupabase(id: string, email: string, username: string) {
  // Implement user update logic here
  console.log('Updating user in Supabase:', { id, email, username });
}

export async function deleteUserFromSupabase(id: string) {
  // Implement user deletion logic here
  console.log('Deleting user from Supabase:', id);
}

export async function logSessionCreated(userId: string) {
  // Implement session logging logic here
  console.log('Logging session created for user:', userId);
}

export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase.from('users').select('count').single();
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error testing Supabase connection:', error);
    return false;
  }
}

// Remove all server-side functions from this file
