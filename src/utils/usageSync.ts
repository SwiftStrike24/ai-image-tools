import { useEffect, useRef } from 'react';
import { useSubscriptionStore } from '@/stores/subscriptionStore';

export function useUsageSync(userId: string | null) {
  const { syncUsageData } = useSubscriptionStore();
  const lastSyncTime = useRef(0);

  useEffect(() => {
    const syncUsage = async () => {
      if (userId) {
        const now = Date.now();
        if (now - lastSyncTime.current > 5 * 60 * 1000) { // 5 minutes
          console.log('Syncing usage for user:', userId);
          await syncUsageData();
          lastSyncTime.current = now;
        } else {
          console.log('Skipping usage sync, last sync was less than 5 minutes ago');
        }
      } else {
        console.log('No user logged in, skipping usage sync');
      }
    };

    // Sync on initial setup
    syncUsage();

    // Set up interval for periodic sync (every 5 minutes)
    const intervalId = setInterval(syncUsage, 5 * 60 * 1000);

    // Cleanup function
    return () => clearInterval(intervalId);
  }, [userId, syncUsageData]);
}
