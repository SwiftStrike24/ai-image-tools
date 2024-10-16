import { useAuth } from '@clerk/nextjs';
import { useEffect } from 'react';
import { useSubscriptionStore } from '@/stores/subscriptionStore';

export function useUsageSync() {
  const { userId } = useAuth();
  const { usage, syncUsageData } = useSubscriptionStore();

  useEffect(() => {
    const syncUsage = async () => {
      if (userId) {
        console.log('Syncing usage for user:', userId);
        await syncUsageData();
      } else {
        console.log('No user logged in, skipping usage sync');
      }
    };

    // Sync on initial setup
    syncUsage();

    // Set up interval for periodic sync (e.g., every 5 minutes)
    const intervalId = setInterval(syncUsage, 5 * 60 * 1000);

    // Cleanup function
    return () => clearInterval(intervalId);
  }, [userId, syncUsageData]);
}
