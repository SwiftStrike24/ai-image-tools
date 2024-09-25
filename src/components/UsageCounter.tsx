import React, { useEffect, useState } from 'react';
import { Progress } from "@/components/ui/progress"
import { useSubscription } from '@/hooks/useSubscription'
import { getLimitForTier, SubscriptionTier } from "@/actions/rateLimit"

interface UsageCounterProps {
  type: 'generator' | 'upscaler' | 'enhance_prompt';
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

  const [limit, setLimit] = useState<number | null>(null);

  useEffect(() => {
    fetchUsage();
    if (subscriptionType) {
      getLimitForTier(subscriptionType as SubscriptionTier, type).then(setLimit);
    }
  }, [fetchUsage, subscriptionType, type]);

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'generator': return 'generations';
      case 'upscaler': return 'upscales';
      case 'enhance_prompt': return 'prompt enhancements';
      default: return type;
    }
  };

  if (isSubscriptionLoading || limit === null) {
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
            {limit - usage} {getTypeLabel(type)} remaining. 
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