import { useState, useEffect, useCallback } from 'react';
import { 
  getGeneratorUsage,
  getUpscalerUsage,
  getEnhancePromptUsage,
  SubscriptionTier,
  getLimitForTier,
  checkAndUpdateGeneratorLimit,
  checkAndUpdateUpscalerLimit,
  canEnhancePrompt
} from "@/actions/rateLimit";

const CACHE_DURATION = 60000; // 1 minute in milliseconds

export function useSubscription(type: 'generator' | 'upscaler' | 'enhance_prompt') {
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
        result = await getGeneratorUsage();
      } else if (type === 'upscaler') {
        result = await getUpscalerUsage();
      } else if (type === 'enhance_prompt') {
        result = await getEnhancePromptUsage();
      } else {
        throw new Error(`Invalid type: ${type}`);
      }
      
      if (result) {
        setUsage(result.usageCount);
        setResetsIn(result.resetsIn);
      }
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

  const checkAndUpdateLimit = useCallback(async (count: number = 1) => {
    let result;
    if (type === 'generator') {
      result = await checkAndUpdateGeneratorLimit(count);
    } else if (type === 'upscaler') {
      result = await checkAndUpdateUpscalerLimit(count);
    } else if (type === 'enhance_prompt') {
      result = await canEnhancePrompt();
    } else {
      throw new Error(`Invalid type: ${type}`);
    }
    
    if (result) {
      setUsage(result.usageCount);
      setResetsIn(result.resetsIn);
      return result.canProceed;
    }
    return false;
  }, [type]);

  return {
    subscriptionType,
    usage,
    resetsIn,
    isLoading,
    checkAndUpdateLimit,
    fetchUsage
  };
}