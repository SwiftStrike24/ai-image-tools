import { useEffect, useRef } from 'react';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { useUser } from '@clerk/nextjs';

export function useUsageSync() {
  const { user } = useUser();
  const { syncUsageData, setUsage, usage } = useSubscriptionStore();
  const lastSyncTime = useRef(0);

  useEffect(() => {
    if (!user?.id) {
      console.log('No user logged in, skipping usage sync');
      return;
    }

    // Initial sync
    syncUsageData();

    // Set up real-time listener (if needed)
    // This part depends on your Supabase setup and might need adjustment
  }, [user?.id, syncUsageData]);

  const syncUsageDataWithDebounce = async () => {
    const now = Date.now();
    if (now - lastSyncTime.current > 5000) { // 5 seconds cooldown
      await syncUsageData();
      lastSyncTime.current = now;
    }
  };

  const incrementUsageAndSync = async (type: keyof typeof usage, count: number) => {
    if (!user?.id) {
      console.error('No user logged in, skipping usage increment and sync');
      return;
    }

    const newUsage = { ...usage, [type]: usage[type] + count };
    
    try {
      const response = await fetch('/api/usage/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUsage),
      });

      if (!response.ok) {
        throw new Error('Failed to sync usage');
      }

      const result = await response.json();
      
      // Update local state
      setUsage(result.updatedUsage);
      
      // Sync with Redis (this will also update the store state)
      await syncUsageData();
    } catch (error) {
      console.error('Error incrementing and syncing usage:', error);
    }
  };

  return {
    syncUsageData: syncUsageDataWithDebounce,
    incrementUsageAndSync,
  };
}
