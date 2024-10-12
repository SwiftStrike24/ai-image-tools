import { useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useSubscriptionStore } from '@/stores/subscriptionStore';

export function useSubscription() {
  const { userId } = useAuth();
  const { currentSubscription, fetchSubscriptionData } = useSubscriptionStore();

  const refreshSubscriptionData = useCallback(async () => {
    if (userId) {
      await fetchSubscriptionData();
    }
  }, [userId, fetchSubscriptionData]);

  return {
    subscription: currentSubscription,
    refreshSubscriptionData,
  };
}
