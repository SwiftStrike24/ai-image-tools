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

// Remove all server-side functions from this file
