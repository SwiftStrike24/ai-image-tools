import { useState, useEffect, useCallback, useRef } from 'react';
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

export function useSubscription(type: 'generator' | 'upscaler' | 'enhance_prompt') {
  const [subscriptionType, setSubscriptionType] = useState<SubscriptionTier>('basic');
  const [usage, setUsage] = useState(0);
  const [resetsIn, setResetsIn] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const lastFetchTime = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchSubscriptionType = useCallback(async () => {
    try {
      const response = await fetch('/api/subscription/subscription-info');
      const data = await response.json();
      setSubscriptionType(data.subscriptionType || 'basic');
    } catch (error) {
      console.error('Error fetching subscription type:', error);
      setSubscriptionType('basic'); // Fallback to basic if there's an error
    }
  }, []);

  const fetchUsage = useCallback(async () => {
    const now = Date.now();
    if (now - lastFetchTime.current < 5000) {
      return; // Throttle fetches to once every 5 seconds
    }
    lastFetchTime.current = now;

    // Cancel any ongoing fetch
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    try {
      await fetchSubscriptionType();
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
    } catch (error: unknown) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Error fetching usage:', error);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [type, fetchSubscriptionType]);

  const refreshSubscriptionData = useCallback(async () => {
    await fetchSubscriptionType();
    await fetchUsage();
  }, [fetchSubscriptionType, fetchUsage]);

  useEffect(() => {
    refreshSubscriptionData();
    const intervalId = setInterval(refreshSubscriptionData, 30000); // Refresh every 30 seconds
    return () => {
      clearInterval(intervalId);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [refreshSubscriptionData]);

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
    fetchUsage,
    refreshSubscriptionData // Add this new function to the return object
  };
}