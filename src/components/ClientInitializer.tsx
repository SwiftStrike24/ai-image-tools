'use client'

import { useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useSubscriptionStore } from '@/stores/subscriptionStore';

export default function ClientInitializer() {
  const { isLoaded, userId } = useAuth();
  const initializeStore = useSubscriptionStore((state) => state.initializeStore);

  useEffect(() => {
    if (isLoaded && userId) {
      initializeStore();
    }
  }, [isLoaded, userId, initializeStore]);

  return null; // This component doesn't render anything
}
