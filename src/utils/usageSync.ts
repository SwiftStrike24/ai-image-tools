import { useSubscriptionStore } from '@/stores/subscriptionStore'

export const setupUsageSync = () => {
  const syncUsageData = useSubscriptionStore.getState().syncUsageData

  const syncInterval = setInterval(() => {
    syncUsageData()
  }, 300000) // 5 minutes

  return () => clearInterval(syncInterval)
}
