'use client'

import { useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { useUsageSync } from '@/utils/usageSync';

export default function ClientInitializer() {
  const { isLoaded, userId } = useAuth();
  const initializeStore = useSubscriptionStore((state) => state.initializeStore);

  useUsageSync(userId || null);

  useEffect(() => {
    if (isLoaded && userId) {
      initializeStore(userId);
    }
  }, [isLoaded, userId, initializeStore]);

  return null; // This component doesn't render anything
}
