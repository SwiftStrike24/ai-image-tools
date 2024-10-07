import { create } from 'zustand'

interface SubscriptionState {
  currentSubscription: string
  pendingUpgrade: string | null
  pendingDowngrade: string | null
  nextBillingDate: string | null
  isLoading: boolean
  setSubscriptionData: (data: Partial<SubscriptionState>) => void
  fetchSubscriptionData: () => Promise<void>
}

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  currentSubscription: 'basic',
  pendingUpgrade: null,
  pendingDowngrade: null,
  nextBillingDate: null,
  isLoading: false,
  setSubscriptionData: (data) => set(data),
  fetchSubscriptionData: async () => {
    set({ isLoading: true })
    try {
      const response = await fetch('/api/get-next-billing-date')
      const data = await response.json()
      set({
        currentSubscription: data.currentSubscription,
        pendingUpgrade: data.pendingUpgrade,
        pendingDowngrade: data.pendingDowngrade,
        nextBillingDate: data.nextBillingDate,
        isLoading: false,
      })
    } catch (error) {
      console.error('Error fetching subscription data:', error)
      set({ isLoading: false })
    }
  },
}))