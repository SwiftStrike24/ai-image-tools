import { useState, useEffect, useCallback } from 'react';
import { canGenerateImages, getGeneratorUsage } from "@/actions/rateLimit";
import { canGenerateImagesPro } from "@/actions/Plans-rateLimit/rateLimit-Pro";
import { canGenerateImagesPremium } from "@/actions/Plans-rateLimit/rateLimit-Premium";
import { canGenerateImagesUltimate } from "@/actions/Plans-rateLimit/rateLimit-Ultimate";

const CACHE_DURATION = 60000; // 1 minute in milliseconds

export function useSubscription() {
  const [subscriptionType, setSubscriptionType] = useState('basic');
  const [usage, setUsage] = useState(0);
  const [resetsIn, setResetsIn] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [lastFetchTime, setLastFetchTime] = useState(0);

  const fetchSubscriptionType = useCallback(async () => {
    try {
      const response = await fetch('/api/check-subscription');
      const data = await response.json();
      if (data.isPro) {
        setSubscriptionType('pro');
      } else if (data.isPremium) {
        setSubscriptionType('premium');
      } else if (data.isUltimate) {
        setSubscriptionType('ultimate');
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
          result = await canGenerateImagesUltimate(0);
          break;
        case 'premium':
          result = await canGenerateImagesPremium(0);
          break;
        case 'pro':
          result = await canGenerateImagesPro(0);
          break;
        default:
          result = await canGenerateImages(0);
      }
      setUsage(result.usageCount);
      setResetsIn(result.resetsIn);
      setLastFetchTime(now);
    } catch (error) {
      console.error('Error fetching usage:', error);
    } finally {
      setIsLoading(false);
    }
  }, [subscriptionType, lastFetchTime, fetchSubscriptionType]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  const checkAndUpdateLimit = useCallback(async (imagesToGenerate: number) => {
    await fetchUsage(); // Ensure we have the latest data
    let result;
    switch (subscriptionType) {
      case 'ultimate':
        result = await canGenerateImagesUltimate(imagesToGenerate);
        break;
      case 'premium':
        result = await canGenerateImagesPremium(imagesToGenerate);
        break;
      case 'pro':
        result = await canGenerateImagesPro(imagesToGenerate);
        break;
      default:
        result = await canGenerateImages(imagesToGenerate);
    }
    setUsage(result.usageCount);
    setResetsIn(result.resetsIn);
    return result.canProceed;
  }, [subscriptionType, fetchUsage]);

  return {
    subscriptionType,
    usage,
    resetsIn,
    isLoading,
    checkAndUpdateLimit,
    fetchUsage
  };
}