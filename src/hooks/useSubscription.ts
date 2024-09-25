import { useState, useEffect, useCallback } from 'react';
import { canGenerateImages, canUpscaleImages, incrementGeneratorUsage, incrementUpscalerUsage } from "@/actions/rateLimit";
import { canGenerateImagesPro, canUpscaleImagesPro, incrementGeneratorUsagePro, incrementUpscalerUsagePro } from "@/actions/Plans-rateLimit/rateLimit-Pro";
import { canGenerateImagesPremium, canUpscaleImagesPremium, incrementGeneratorUsagePremium, incrementUpscalerUsagePremium } from "@/actions/Plans-rateLimit/rateLimit-Premium";
import { canGenerateImagesUltimate, canUpscaleImagesUltimate, incrementGeneratorUsageUltimate, incrementUpscalerUsageUltimate } from "@/actions/Plans-rateLimit/rateLimit-Ultimate";

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
      switch (subscriptionType) {
        case 'pro':
          result = type === 'generator' ? await canGenerateImagesPro(0) : await canUpscaleImagesPro(0);
          break;
        case 'premium':
          result = type === 'generator' ? await canGenerateImagesPremium(0) : await canUpscaleImagesPremium(0);
          break;
        case 'ultimate':
          result = type === 'generator' ? await canGenerateImagesUltimate(0) : await canUpscaleImagesUltimate(0);
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
  }, [type, lastFetchTime, fetchSubscriptionType, subscriptionType]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  const checkAndUpdateLimit = useCallback(async (count: number) => {
    await fetchUsage(); // Ensure we have the latest data
    let result;
    switch (subscriptionType) {
      case 'pro':
        result = type === 'generator' ? await canGenerateImagesPro(count) : await canUpscaleImagesPro(count);
        break;
      case 'premium':
        result = type === 'generator' ? await canGenerateImagesPremium(count) : await canUpscaleImagesPremium(count);
        break;
      case 'ultimate':
        result = type === 'generator' ? await canGenerateImagesUltimate(count) : await canUpscaleImagesUltimate(count);
        break;
      default:
        result = type === 'generator' ? await canGenerateImages(count) : await canUpscaleImages(count);
    }
    setUsage(result.usageCount);
    setResetsIn(result.resetsIn);
    return result.canProceed;
  }, [type, fetchUsage, subscriptionType]);

  const incrementUsage = useCallback(async (count: number = 1) => {
    let result;
    switch (subscriptionType) {
      case 'pro':
        result = await (type === 'generator' ? incrementGeneratorUsagePro(count) : incrementUpscalerUsagePro(count));
        break;
      case 'premium':
        result = await (type === 'generator' ? incrementGeneratorUsagePremium(count) : incrementUpscalerUsagePremium(count));
        break;
      case 'ultimate':
        result = await (type === 'generator' ? incrementGeneratorUsageUltimate(count) : incrementUpscalerUsageUltimate(count));
        break;
      default:
        result = await (type === 'generator' ? incrementGeneratorUsage(count) : incrementUpscalerUsage(count));
    }
    if (result && 'usageCount' in result) {
      setUsage(result.usageCount);
      setResetsIn(result.resetsIn);
    } else {
      // If the result doesn't contain usageCount and resetsIn, fetch the latest usage
      await fetchUsage();
    }
  }, [type, subscriptionType, fetchUsage]);

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