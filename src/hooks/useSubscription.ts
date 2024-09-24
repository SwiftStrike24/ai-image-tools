import { useState, useEffect } from 'react';
import { checkRateLimit, incrementRateLimit, getUserUsage } from "@/actions/rateLimit";
import { checkAndUpdateRateLimitPro } from "@/actions/Plans-rateLimit/rateLimit-Pro";
import { checkAndUpdateRateLimitPremium } from "@/actions/Plans-rateLimit/rateLimit-Premium";
import { checkAndUpdateRateLimitUltimate, getUserUsageUltimate } from "@/actions/Plans-rateLimit/rateLimit-Ultimate";
import { getTimeUntilReset } from '@/utils/dateUtils';

type SubscriptionType = 'basic' | 'pro' | 'premium' | 'ultimate';

export function useSubscription() {
  const [subscriptionType, setSubscriptionType] = useState<SubscriptionType>('basic');
  const [usage, setUsage] = useState(0);
  const [resetsIn, setResetsIn] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Add this new state
  const [resetPeriod, setResetPeriod] = useState<'daily' | 'monthly'>('daily');

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/check-subscription');
        const { isPro, isPremium, isUltimate } = await response.json();
        
        if (isUltimate) {
          setSubscriptionType('ultimate');
          setResetPeriod('monthly');
        } else if (isPremium) {
          setSubscriptionType('premium');
          setResetPeriod('monthly');
        } else if (isPro) {
          setSubscriptionType('pro');
          setResetPeriod('monthly');
        } else {
          setSubscriptionType('basic');
          setResetPeriod('daily');
        }

        await fetchUsage();
      } catch (error) {
        console.error('Error checking subscription:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSubscription();
  }, []);

  const fetchUsage = async () => {
    try {
      let usageData;
      switch (subscriptionType) {
        case 'ultimate':
          usageData = await getUserUsageUltimate();
          break;
        case 'premium':
          usageData = await checkAndUpdateRateLimitPremium();
          break;
        case 'pro':
          usageData = await checkAndUpdateRateLimitPro();
          break;
        default:
          usageData = await getUserUsage();
      }
      
      setUsage(usageData.usageCount);
      setResetsIn(usageData.resetsIn);
    } catch (error) {
      console.error('Error fetching usage:', error);
    }
  };

  const checkAndUpdateLimit = async () => {
    try {
      let result;
      switch (subscriptionType) {
        case 'ultimate':
          result = await checkAndUpdateRateLimitUltimate();
          break;
        case 'premium':
          result = await checkAndUpdateRateLimitPremium();
          break;
        case 'pro':
          result = await checkAndUpdateRateLimitPro();
          break;
        default:
          result = await checkRateLimit();
          if (result.canProceed) {
            await incrementRateLimit();
          }
      }
      
      setUsage(result.usageCount);
      setResetsIn(getTimeUntilReset(subscriptionType !== 'basic'));
      return result.canProceed;
    } catch (error) {
      console.error('Error checking and updating limit:', error);
      return false;
    }
  };

  return {
    subscriptionType,
    usage,
    resetsIn,
    isLoading,
    checkAndUpdateLimit,
    fetchUsage,
    resetPeriod // Add this to the returned object
  };
}