"use client"

import React, { useEffect, useState } from 'react';
import { motion } from "framer-motion"
import { Sparkles, Zap } from "lucide-react"
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

  const IconComponent = type === 'generator' ? Sparkles : Zap
  const currentUsage = usage[type]

  if (isSimulationMode) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative bg-purple-900/10 backdrop-blur-md rounded-xl p-6 shadow-lg overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 z-0"></div>
        <div className="relative z-10 space-y-2">
          <span className="text-lg font-semibold text-purple-100">Simulation Mode</span>
          <p className="text-sm text-purple-300">
            No usage tracking in simulation mode.
          </p>
        </div>
        <IconComponent className="absolute bottom-2 right-2 text-purple-400/50 w-6 h-6" />
      </motion.div>
    )
  }

  if (isLoading || limit === null) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="relative bg-purple-900/10 backdrop-blur-md rounded-xl p-6 shadow-lg flex items-center justify-center"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 z-0"></div>
        <div className="relative z-10">
          <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </motion.div>
    )
  }

  const usagePercentage = (currentUsage / limit) * 100
  const remainingUsage = limit - currentUsage

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative bg-purple-900/10 backdrop-blur-md rounded-xl p-6 shadow-lg overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 z-0"></div>
      <div className="relative z-10 space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-purple-100">
            {currentSubscription === 'basic' 
              ? `Daily ${type.charAt(0).toUpperCase() + type.slice(1)} Usage (Free Plan)` 
              : `Monthly ${type.charAt(0).toUpperCase() + type.slice(1)} Usage (${currentSubscription.charAt(0).toUpperCase() + currentSubscription.slice(1)} Plan)`}
          </span>
          <span className="text-sm font-medium text-purple-200">
            {currentUsage} / {limit}
          </span>
        </div>
        <div className="relative pt-1">
          <div className="overflow-hidden h-2 text-xs flex rounded bg-purple-200">
            <motion.div 
              style={{ width: `${usagePercentage}%` }}
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-purple-500 to-blue-500"
              initial={{ width: 0 }}
              animate={{ width: `${usagePercentage}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
        </div>
        <p className="text-sm text-purple-300">
          {remainingUsage} {type === 'generator' ? 'generations' : type === 'upscaler' ? 'upscales' : 'enhancements'} remaining.
        </p>
      </div>
      <IconComponent className="absolute bottom-2 right-2 text-purple-400/50 w-6 h-6" />
    </motion.div>
  );
};

export default UsageCounter;
