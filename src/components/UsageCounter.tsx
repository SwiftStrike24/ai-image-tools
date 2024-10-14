import React, { useEffect, useState, useCallback } from 'react';
import { Progress } from "@/components/ui/progress"
import { useSubscription } from '@/hooks/useSubscription'
import { getLimitForTier, SubscriptionTier } from "@/actions/rateLimit"
import { useSubscriptionStore } from '@/stores/subscriptionStore'
import { getPusherClient } from '@/lib/pusher';
import { useUser } from '@clerk/nextjs';

interface UsageCounterProps {
  type: 'generator' | 'upscaler' | 'enhance_prompt';
  isSimulationMode: boolean;
  onUsageUpdate: (usage: number) => void;
  forceUpdate?: number;
}

const UsageCounter: React.FC<UsageCounterProps> = ({ type, isSimulationMode, onUsageUpdate, forceUpdate }) => {
  const { 
    subscriptionType,
    usage: subscriptionUsage,
    resetsIn,
    isLoading: isSubscriptionLoading,
    refreshSubscriptionData,
    checkAndUpdateLimit,
    fetchUsage
  } = useSubscription(type);
  const [limit, setLimit] = useState<number | null>(null);
  const { currentSubscription, fetchSubscriptionData } = useSubscriptionStore();
  const { user } = useUser();

  const updateSubscriptionAndUsage = useCallback(async () => {
    await fetchSubscriptionData();
    await refreshSubscriptionData();
    await fetchUsage();
    if (currentSubscription) {
      const newLimit = await getLimitForTier(currentSubscription as SubscriptionTier, type);
      setLimit(newLimit);
    }
  }, [fetchSubscriptionData, refreshSubscriptionData, fetchUsage, currentSubscription, type]);

  useEffect(() => {
    updateSubscriptionAndUsage();
  }, [updateSubscriptionAndUsage, forceUpdate]);

  useEffect(() => {
    onUsageUpdate(subscriptionUsage);
  }, [subscriptionUsage, onUsageUpdate]);

  useEffect(() => {
    if (user) {
      const pusherClient = getPusherClient();
      const channel = pusherClient.subscribe(`private-user-${user.id}`);
      
      channel.bind('subscription-updated', updateSubscriptionAndUsage);

      return () => {
        channel.unbind('subscription-updated', updateSubscriptionAndUsage);
        pusherClient.unsubscribe(`private-user-${user.id}`);
      };
    }
  }, [user, updateSubscriptionAndUsage]);

  if (isSubscriptionLoading || limit === null) {
    return <div>Loading usage information...</div>;
  }

  const displaySubscription = currentSubscription || subscriptionType;

  console.log('Rendering UsageCounter with subscription:', displaySubscription);

  return (
    <div className="bg-purple-900/30 rounded-lg p-4 space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">
          {displaySubscription === 'basic' 
            ? 'Daily Usage (Free Plan)' 
            : `Monthly Usage (${displaySubscription.charAt(0).toUpperCase() + displaySubscription.slice(1)} Plan)`}
        </span>
        {isSimulationMode ? (
          <span className="text-sm font-medium">Simulation Mode</span>
        ) : (
          <span className="text-sm font-medium">
            {subscriptionUsage} / {limit ?? 'N/A'}
          </span>
        )}
      </div>
      {!isSimulationMode && (
        <>
          <Progress 
            value={(subscriptionUsage / (limit || 1)) * 100} 
            className="h-2" 
          />
          <p className="text-xs text-purple-300">
            {limit - subscriptionUsage} {type === 'generator' ? 'generations' : type === 'upscaler' ? 'upscales' : 'enhancements'} remaining. 
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
