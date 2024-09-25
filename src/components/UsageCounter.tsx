import React, { useEffect } from 'react';
import { Progress } from "@/components/ui/progress"
import { useSubscription } from '@/hooks/useSubscription'
import { 
  GENERATOR_DAILY_LIMIT, 
  PRO_GENERATOR_MONTHLY_LIMIT, 
  PREMIUM_GENERATOR_MONTHLY_LIMIT, 
  ULTIMATE_GENERATOR_MONTHLY_LIMIT,
  UPSCALER_DAILY_LIMIT,
  PRO_UPSCALER_MONTHLY_LIMIT,
  PREMIUM_UPSCALER_MONTHLY_LIMIT,
  ULTIMATE_UPSCALER_MONTHLY_LIMIT
} from "@/constants/rateLimits"

interface UsageCounterProps {
  type: 'generator' | 'upscaler';
  isSimulationMode: boolean;
}

const UsageCounter: React.FC<UsageCounterProps> = ({ type, isSimulationMode }) => {
  const { 
    subscriptionType, 
    usage,
    resetsIn, 
    isLoading: isSubscriptionLoading,
    fetchUsage
  } = useSubscription(type);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  const getLimit = () => {
    if (type === 'generator') {
      return subscriptionType === 'ultimate' ? ULTIMATE_GENERATOR_MONTHLY_LIMIT :
             subscriptionType === 'premium' ? PREMIUM_GENERATOR_MONTHLY_LIMIT :
             subscriptionType === 'pro' ? PRO_GENERATOR_MONTHLY_LIMIT :
             GENERATOR_DAILY_LIMIT;
    } else {
      return subscriptionType === 'ultimate' ? ULTIMATE_UPSCALER_MONTHLY_LIMIT :
             subscriptionType === 'premium' ? PREMIUM_UPSCALER_MONTHLY_LIMIT :
             subscriptionType === 'pro' ? PRO_UPSCALER_MONTHLY_LIMIT :
             UPSCALER_DAILY_LIMIT;
    }
  };

  const limit = getLimit();

  if (isSubscriptionLoading) {
    return <div>Loading usage information...</div>;
  }

  return (
    <div className="bg-purple-900/30 rounded-lg p-4 space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">
          {subscriptionType === 'basic' ? 'Daily Usage (Free Plan)' : `Monthly Usage (${subscriptionType.charAt(0).toUpperCase() + subscriptionType.slice(1)} Plan)`}
        </span>
        {isSimulationMode ? (
          <span className="text-sm font-medium">Simulation Mode</span>
        ) : (
          <span className="text-sm font-medium">
            {usage} / {limit}
          </span>
        )}
      </div>
      {!isSimulationMode && (
        <>
          <Progress 
            value={(usage / limit) * 100} 
            className="h-2" 
          />
          <p className="text-xs text-purple-300">
            {limit - usage} {type === 'generator' ? 'generations' : 'upscales'} remaining. 
            Resets in {resetsIn}.
          </p>
        </>
      )}
      {isSimulationMode && (
        <p className="text-xs text-purple-300">
          Simulation mode active. No API calls are being made.
        </p>
      )}
    </div>
  );
};

export default UsageCounter;