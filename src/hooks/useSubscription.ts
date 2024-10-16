import { useCallback } from 'react';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { getLimitForTier, SubscriptionTier } from "@/actions/rateLimit";

export function useSubscription(type: 'generator' | 'upscaler' | 'enhance_prompt') {
  const { 
    currentSubscription, 
    usage, 
    isLoading, 
    fetchSubscriptionData, 
    incrementUsage, 
    syncUsageData 
  } = useSubscriptionStore();

  const checkAndUpdateLimit = useCallback(async (count: number = 1, updateUsage: boolean = true) => {
    const limit = await getLimitForTier(currentSubscription as SubscriptionTier, type);
    if (usage[type] + count > limit) {
      return { canProceed: false, usageCount: usage[type] };
    }
    if (updateUsage) {
      incrementUsage(type, count);
    }
    return { canProceed: true, usageCount: updateUsage ? usage[type] + count : usage[type] };
  }, [currentSubscription, usage, type, incrementUsage]);

  return {
    subscriptionType: currentSubscription,
    usage: usage[type],
    isLoading,
    refreshSubscriptionData: fetchSubscriptionData,
    checkAndUpdateLimit,
  };
}
