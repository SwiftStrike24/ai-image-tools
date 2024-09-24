import { useState, useEffect, useCallback } from 'react';
import { canGenerateImages, canUpscaleImages, getGeneratorUsage, getUpscalerUsage } from "@/actions/rateLimit";
import { canGenerateImagesPro, checkRateLimitPro, incrementUpscalerUsagePro } from "@/actions/Plans-rateLimit/rateLimit-Pro";
import { canGenerateImagesPremium, checkRateLimitPremium, incrementUpscalerUsagePremium } from "@/actions/Plans-rateLimit/rateLimit-Premium";
import { canGenerateImagesUltimate, checkRateLimitUltimate, incrementUpscalerUsageUltimate } from "@/actions/Plans-rateLimit/rateLimit-Ultimate";

const CACHE_DURATION = 60000; // 1 minute in milliseconds

export function useSubscription(type: 'generator' | 'upscaler') {
  const [subscriptionType, setSubscriptionType] = useState('basic');
  const [usage, setUsage] = useState(0);
  const [resetsIn, setResetsIn] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [lastFetchTime, setLastFetchTime] = useState(0);

  const fetchSubscriptionType = useCallback(async () => {
    try {
      const response = await fetch('/api/check-subscription');
      const data = await response.json();
      if (data.isUltimate) {
        setSubscriptionType('ultimate');
      } else if (data.isPremium) {
        setSubscriptionType('premium');
      } else if (data.isPro) {
        setSubscriptionType('pro');
      } else {
        setSubscriptionType('basic');
      }
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
      switch (subscriptionType) {
        case 'ultimate':
          result = type === 'generator' ? await canGenerateImagesUltimate(0) : await checkRateLimitUltimate();
          break;
        case 'premium':
          result = type === 'generator' ? await canGenerateImagesPremium(0) : await checkRateLimitPremium();
          break;
        case 'pro':
          result = type === 'generator' ? await canGenerateImagesPro(0) : await checkRateLimitPro();
          break;
        default:
          result = type === 'generator' ? await canGenerateImages(0) : await canUpscaleImages(0);
      }
      setUsage(result.usageCount);
      setResetsIn(result.resetsIn);
      setLastFetchTime(now);
    } catch (error) {
      console.error('Error fetching usage:', error);
    } finally {
      setIsLoading(false);
    }
  }, [subscriptionType, lastFetchTime, fetchSubscriptionType, type]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  const checkAndUpdateLimit = useCallback(async (count: number) => {
    await fetchUsage(); // Ensure we have the latest data
    let result;
    switch (subscriptionType) {
      case 'ultimate':
        result = type === 'generator' ? await canGenerateImagesUltimate(count) : await checkRateLimitUltimate();
        break;
      case 'premium':
        result = type === 'generator' ? await canGenerateImagesPremium(count) : await checkRateLimitPremium();
        break;
      case 'pro':
        result = type === 'generator' ? await canGenerateImagesPro(count) : await checkRateLimitPro();
        break;
      default:
        result = type === 'generator' ? await canGenerateImages(count) : await canUpscaleImages(count);
    }
    setUsage(result.usageCount);
    setResetsIn(result.resetsIn);
    return result.canProceed;
  }, [subscriptionType, fetchUsage, type]);

  const incrementUsage = useCallback(async (count: number = 1) => {
    let result;
    switch (subscriptionType) {
      case 'ultimate':
        result = await incrementUpscalerUsageUltimate(count);
        break;
      case 'premium':
        result = await incrementUpscalerUsagePremium(count);
        break;
      case 'pro':
        result = await incrementUpscalerUsagePro(count);
        break;
      default:
        // For basic plan, we don't increment here as it's handled differently
        return;
    }
    setUsage(result.usageCount);
    setResetsIn(result.resetsIn);
  }, [subscriptionType]);

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