import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Progress } from "@/components/ui/progress"
import { useSubscription } from '@/hooks/useSubscription'
import { getLimitForTier, SubscriptionTier } from "@/actions/rateLimit"
import { useSubscriptionStore } from '@/stores/subscriptionStore'
import { getPusherClient, disconnectPusherClient } from '@/lib/pusher';
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
    usage,
    resetsIn, 
    isLoading: isSubscriptionLoading,
    fetchUsage
  } = useSubscription(type);

  const [limit, setLimit] = useState<number | null>(null);
  const { currentSubscription, fetchSubscriptionData } = useSubscriptionStore();
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pusherChannelRef = useRef<any>(null);
  const pusherClientRef = useRef<any>(null);

  const { user } = useUser();

  const updateSubscriptionAndUsage = useCallback(async () => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(async () => {
      await fetchSubscriptionData();
      await fetchUsage();
      if (currentSubscription) {
        const newLimit = await getLimitForTier(currentSubscription as SubscriptionTier, type);
        setLimit(newLimit);
      }
      updateTimeoutRef.current = null;
    }, 500); // Debounce for 500ms
  }, [fetchSubscriptionData, fetchUsage, currentSubscription, type]);

  useEffect(() => {
    updateSubscriptionAndUsage();
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [updateSubscriptionAndUsage, forceUpdate]);

  useEffect(() => {
    onUsageUpdate(usage);
  }, [usage, onUsageUpdate]);

  useEffect(() => {
    if (user) {
      pusherClientRef.current = getPusherClient();
      const channelName = `private-user-${user.id}`;
      
      pusherChannelRef.current = pusherClientRef.current.subscribe(channelName);
      pusherChannelRef.current.bind('subscription-updated', updateSubscriptionAndUsage);

      return () => {
        if (pusherChannelRef.current) {
          pusherChannelRef.current.unbind('subscription-updated', updateSubscriptionAndUsage);
          pusherClientRef.current.unsubscribe(channelName);
        }
        disconnectPusherClient();
      };
    }
  }, [user, updateSubscriptionAndUsage]);

  if (isSubscriptionLoading || limit === null) {
    return <div>Loading usage information...</div>;
  }

  const displaySubscription = currentSubscription || subscriptionType;

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
            {usage} / {limit ?? 'N/A'}
          </span>
        )}
      </div>
      {!isSimulationMode && (
        <>
          <Progress 
            value={(usage / (limit || 1)) * 100} 
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