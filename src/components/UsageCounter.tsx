import React, { useEffect, useState } from 'react';
import { Progress } from "@/components/ui/progress"
import { useSubscription } from '@/hooks/useSubscription'
import { getLimitForTier, SubscriptionTier } from "@/actions/rateLimit"

interface UsageCounterProps {
  type: 'generator' | 'upscaler' | 'enhance_prompt';
  isSimulationMode: boolean;
  onUsageUpdate: (usage: number) => void;
  forceUpdate?: number; // Add this prop
}

const UsageCounter: React.FC<UsageCounterProps> = ({ type, isSimulationMode, onUsageUpdate, forceUpdate }) => {
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
  }, [fetchUsage, subscriptionType, type, forceUpdate]); // Add forceUpdate to the dependency array

  useEffect(() => {
    onUsageUpdate(usage);
  }, [usage, onUsageUpdate]);

  if (isSubscriptionLoading || limit === null) {
    return <div>Loading usage information...</div>;
  }

  return (
    <div className="bg-purple-900/30 rounded-lg p-4 space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">
          {!subscriptionType || subscriptionType === 'basic' 
            ? 'Daily Usage (Free Plan)' 
            : `Monthly Usage (${subscriptionType.charAt(0).toUpperCase() + subscriptionType.slice(1)} Plan)`}
        </span>
        {isSimulationMode ? (
          <span className="text-sm font-medium">Simulation Mode</span>
        ) : (
          <span className="text-sm font-medium">
            {usage} / {limit ?? 'N/A'}
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
            {limit - usage} {type === 'generator' ? 'generations' : type === 'upscaler' ? 'upscales' : 'enhancements'} remaining. 
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