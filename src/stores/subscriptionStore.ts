import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface UsageData {
  generator: number;
  upscaler: number;
  enhance_prompt: number;
}

interface SubscriptionState {
  currentSubscription: string
  pendingUpgrade: string | null
  pendingDowngrade: string | null
  nextBillingDate: string | null
  isLoading: boolean
  usage: UsageData
  lastSyncTime: number
  setSubscriptionData: (data: Partial<SubscriptionState>) => void
  fetchSubscriptionData: () => Promise<void>
  clearSubscriptionData: () => void
  initializeStore: () => Promise<void>
  incrementUsage: (type: keyof UsageData, count: number) => void
  syncUsageData: () => Promise<void>
}

const storage = {
  getItem: (name: string): string | null => {
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem(name)
    }
    return null
  },
  setItem: (name: string, value: string): void => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(name, value)
    }
  },
  removeItem: (name: string): void => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(name)
    }
  },
}

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      currentSubscription: 'basic',
      pendingUpgrade: null,
      pendingDowngrade: null,
      nextBillingDate: null,
      isLoading: false,
      usage: {
        generator: 0,
        upscaler: 0,
        enhance_prompt: 0,
      },
      lastSyncTime: 0,
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
          const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
          const response = await fetch(`${baseUrl}/api/subscription/subscription-info`)
          const data = await response.json()
          console.log('Fetched subscription data:', data)
          set((state) => ({
            ...state,
            currentSubscription: data.subscriptionType ?? state.currentSubscription,
            pendingUpgrade: data.pendingUpgrade ?? state.pendingUpgrade,
            pendingDowngrade: data.pendingDowngrade ?? state.pendingDowngrade,
            nextBillingDate: data.nextBillingDate ?? state.nextBillingDate,
            usage: data.usage ?? state.usage,
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
          usage: {
            generator: 0,
            upscaler: 0,
            enhance_prompt: 0,
          },
        })
      },
      initializeStore: async () => {
        const state = get()
        await state.fetchSubscriptionData()
      },
      incrementUsage: (type, count) => {
        set((state) => ({
          usage: {
            ...state.usage,
            [type]: state.usage[type] + count,
          },
        }))
      },
      syncUsageData: async () => {
        const state = get()
        const currentTime = Date.now()
        if (currentTime - state.lastSyncTime < 300000) { // 5 minutes
          return
        }
        try {
          const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
          await fetch(`${baseUrl}/api/usage/sync`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(state.usage),
          })
          set({ lastSyncTime: currentTime })
        } catch (error) {
          console.error('Error syncing usage data:', error)
        }
      },
    }),
    {
      name: 'subscription-storage',
      storage: createJSONStorage(() => storage),
    }
  )
)
