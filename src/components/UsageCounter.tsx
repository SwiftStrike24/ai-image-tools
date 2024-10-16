import React, { useEffect, useState } from 'react';
import { Progress } from "@/components/ui/progress"
import { useSubscriptionStore } from '@/stores/subscriptionStore'
import { getLimitForTier, SubscriptionTier } from "@/actions/rateLimit"

interface UsageCounterProps {
  type: 'generator' | 'upscaler' | 'enhance_prompt';
  isSimulationMode: boolean;
}

const UsageCounter: React.FC<UsageCounterProps> = ({ type, isSimulationMode }) => {
  const { 
    currentSubscription,
    usage,
    syncUsageData,
    isLoading,
  } = useSubscriptionStore()
  const [limit, setLimit] = useState<number | null>(null)

  useEffect(() => {
    const fetchLimit = async () => {
      const fetchedLimit = await getLimitForTier(currentSubscription as SubscriptionTier, type)
      setLimit(fetchedLimit)
    }
    fetchLimit()
  }, [currentSubscription, type])

  if (isSimulationMode) {
    return (
      <div className="bg-purple-900/30 rounded-lg p-4 space-y-2">
        <span className="text-sm font-medium">Simulation Mode</span>
        <p className="text-xs text-purple-300">
          No usage tracking in simulation mode.
        </p>
      </div>
    )
  }

  if (isLoading || limit === null) {
    return <div>Loading...</div>
  }

  return (
    <div className="bg-purple-900/30 rounded-lg p-4 space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">
          {currentSubscription === 'basic' 
            ? 'Daily Usage (Free Plan)' 
            : `Monthly Usage (${currentSubscription.charAt(0).toUpperCase() + currentSubscription.slice(1)} Plan)`}
        </span>
        <span className="text-sm font-medium">
          {usage[type]} / {limit}
        </span>
      </div>
      <Progress 
        value={(usage[type] / limit) * 100} 
        className="h-2" 
      />
      <p className="text-xs text-purple-300">
        {limit - usage[type]} {type === 'generator' ? 'generations' : type === 'upscaler' ? 'upscales' : 'enhancements'} remaining.
      </p>
    </div>
  );
};

export default UsageCounter;
