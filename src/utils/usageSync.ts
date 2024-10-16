import { useEffect, useRef } from 'react';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { createClient } from '@supabase/supabase-js';
import { useUser } from '@clerk/nextjs';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export function useUsageSync() {
  const { user } = useUser();
  const { syncUsageData, setUsage, usage, incrementMultipleUsage } = useSubscriptionStore();
  const lastSyncTime = useRef(0);

  useEffect(() => {
    if (!user?.id) {
      console.log('No user logged in, skipping usage sync');
      return;
    }

    const channel = supabase
      .channel('user_usage_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_usage',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Usage updated:', payload);
          const { generator, upscaler, enhance_prompt } = payload.new;
          setUsage({ generator, upscaler, enhance_prompt });
        }
      )
      .subscribe();

    // Initial sync
    syncUsageData();

    // Cleanup function
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, syncUsageData, setUsage]);

  const syncUsageDataWithDebounce = async () => {
    const now = Date.now();
    if (now - lastSyncTime.current > 5000) { // 5 seconds cooldown
      await syncUsageData();
      lastSyncTime.current = now;
    }
  };

  const incrementUsageAndSync = async (type: keyof typeof usage, count: number) => {
    incrementMultipleUsage({ [type]: count });
    await syncUsageDataWithDebounce();
  };

  return {
    syncUsageData: syncUsageDataWithDebounce,
    incrementUsageAndSync,
  };
}
