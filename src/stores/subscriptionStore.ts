import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface SubscriptionState {
  currentSubscription: string
  pendingUpgrade: string | null
  pendingDowngrade: string | null
  nextBillingDate: string | null
  isLoading: boolean
  setSubscriptionData: (data: Partial<SubscriptionState>) => void
  fetchSubscriptionData: () => Promise<void>
  clearSubscriptionData: () => void
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      currentSubscription: 'basic',
      pendingUpgrade: null,
      pendingDowngrade: null,
      nextBillingDate: null,
      isLoading: false,
      setSubscriptionData: (data) => {
        console.log('Updating subscription data:', data);
        set((state) => {
          const newState = { ...state, ...data };
          console.log('New subscription state:', newState);
          return newState;
        });
      },
      fetchSubscriptionData: async () => {
        set({ isLoading: true })
        try {
          const response = await fetch('/api/subscription/subscription-info')
          const data = await response.json()
          console.log('Fetched subscription data:', data)
          set((state) => ({
            ...state,
            currentSubscription: data.currentSubscription ?? state.currentSubscription,
            pendingUpgrade: data.pendingUpgrade ?? state.pendingUpgrade,
            pendingDowngrade: data.pendingDowngrade ?? state.pendingDowngrade,
            nextBillingDate: data.nextBillingDate ?? state.nextBillingDate,
            isLoading: false,
          }))
        } catch (error) {
          console.error('Error fetching subscription data:', error)
          set({ isLoading: false })
        }
      },
      clearSubscriptionData: () => {
        set({
          currentSubscription: 'basic',
          pendingUpgrade: null,
          pendingDowngrade: null,
          nextBillingDate: null,
        })
      },
    }),
    {
      name: 'subscription-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
