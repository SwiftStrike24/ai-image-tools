import { useState, useEffect, useCallback } from 'react';
import { 
  canGenerateImages, 
  canUpscaleImages, 
  incrementGeneratorUsage, 
  incrementUpscalerUsage,
  getGeneratorUsage,
  getUpscalerUsage,
  SubscriptionTier,
  getLimitForTier
} from "@/actions/rateLimit";

const CACHE_DURATION = 60000; // 1 minute in milliseconds

export function useSubscription(type: 'generator' | 'upscaler') {
  const [subscriptionType, setSubscriptionType] = useState<SubscriptionTier>('basic');
  const [usage, setUsage] = useState(0);
  const [resetsIn, setResetsIn] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [lastFetchTime, setLastFetchTime] = useState(0);

  const fetchSubscriptionType = useCallback(async () => {
    try {
      const response = await fetch('/api/check-subscription');
      const data = await response.json();
      setSubscriptionType(data.subscriptionType);
    } catch (error) {
      console.error('Error fetching subscription type:', error);
    }
  }, []);

  const fetchUsage = useCallback(async () => {
    const now = Date.now();
    if (now - lastFetchTime < CACHE_DURATION) {
      return; // Use cached data if it's recent enough
    }

    setIsLoading(true);
    try {
      await fetchSubscriptionType(); // Fetch the latest subscription type
      let result;
      if (type === 'generator') {
        result = await canGenerateImages(0);
      } else {
        result = await canUpscaleImages(0);
      }
      setUsage(result.usageCount);
      setResetsIn(result.resetsIn);
      setLastFetchTime(now);
    } catch (error) {
      console.error('Error fetching usage:', error);
    } finally {
      setIsLoading(false);
    }
  }, [type, lastFetchTime, fetchSubscriptionType]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  const checkAndUpdateLimit = useCallback(async (count: number) => {
    await fetchUsage(); // Ensure we have the latest data
    let result;
    if (type === 'generator') {
      result = await canGenerateImages(count);
    } else {
      result = await canUpscaleImages(count);
    }
    setUsage(result.usageCount);
    setResetsIn(result.resetsIn);
    return result.canProceed;
  }, [type, fetchUsage]);

  const incrementUsage = useCallback(async (count: number = 1) => {
    if (type === 'generator') {
      await incrementGeneratorUsage(count);
    } else {
      await incrementUpscalerUsage(count);
    }
    // After incrementing, fetch the latest usage
    await fetchUsage();
  }, [type, fetchUsage]);

  return {
    subscriptionType,
    usage,
    resetsIn,
    isLoading,
    checkAndUpdateLimit,
    fetchUsage,
    incrementUsage
  };
}