import { useAuth } from '@clerk/nextjs';
import { useEffect } from 'react';

export function useUsageSync() {
  const { userId } = useAuth();

  useEffect(() => {
    const syncUsage = async () => {
      try {
        if (userId) {
          console.log('Syncing usage for user:', userId);
          const response = await fetch('/api/usage/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({}),  // Send an empty object to just trigger the sync
          });
          const data = await response.json();
          console.log('Usage sync result:', data);
        } else {
          console.log('No user logged in, skipping usage sync');
        }
      } catch (error) {
        console.error('Error syncing usage:', error);
      }
    };

    // Sync on initial setup
    syncUsage();

    // Set up interval for periodic sync (e.g., every 5 minutes)
    const intervalId = setInterval(syncUsage, 5 * 60 * 1000);

    // Cleanup function
    return () => clearInterval(intervalId);
  }, [userId]);  // Re-run effect if userId changes
}
