"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { SparklesIcon, XCircle, CalendarIcon, AlertTriangleIcon, ArrowDownIcon, ArrowUpIcon } from 'lucide-react'
import ShineBorder from '@/components/magicui/shine-border'
import { MagicCard } from '@/components/magicui/magic-card'
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@clerk/nextjs"
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { PlanContent } from '@/components/pricing/plan-content'
import { plans, featureComparison } from '@/data/plans'
import { useSubscriptionStore } from '@/stores/subscriptionStore'

export function PricingComponentComponent() {
  const [isMonthly, setIsMonthly] = useState(true)
  const { isLoaded, isSignedIn } = useAuth()
  const [isCancelling, setIsCancelling] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const {
    currentSubscription,
    pendingUpgrade,
    pendingDowngrade,
    nextBillingDate,
    isLoading,
    fetchSubscriptionData,
    setSubscriptionData,
    clearSubscriptionData
  } = useSubscriptionStore()

  useEffect(() => {
    if (isLoaded) {
      if (isSignedIn) {
        fetchSubscriptionData()
      } else {
        clearSubscriptionData()
      }
    }
  }, [isLoaded, isSignedIn, fetchSubscriptionData, clearSubscriptionData])

  // Modify this part to handle 'inactive' as 'basic'
  const displayCurrentSubscription = currentSubscription === 'inactive' ? 'basic' : currentSubscription

  const handleCancelSubscription = async () => {
    setIsCancelling(true)
    try {
      const response = await fetch('/api/subscription/subscription-management', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'cancel' }),
      })
      if (response.ok) {
        const data = await response.json()
        setSubscriptionData({ 
          pendingDowngrade: 'basic',
          nextBillingDate: data.cancellationDate
        })
        toast({
          title: "Subscription Cancelled",
          description: `Your subscription will end on ${new Date(data.cancellationDate).toLocaleDateString()}`,
        })
      } else {
        throw new Error('Failed to cancel subscription')
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error)
      toast({
        title: "Error",
        description: "Failed to cancel subscription. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCancelling(false)
    }
  }

  const handleCancelDowngrade = async () => {
    setIsProcessing(true)
    try {
      const response = await fetch('/api/subscription/subscription-management', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'cancelDowngrade' }),
      })
      if (response.ok) {
        const data = await response.json()
        setSubscriptionData({ 
          pendingDowngrade: null,
          nextBillingDate: data.nextBillingDate
        })
        toast({
          title: "Downgrade Cancelled",
          description: "Your scheduled downgrade has been cancelled.",
        })
      } else {
        throw new Error('Failed to cancel downgrade')
      }
    } catch (error) {
      console.error('Error cancelling downgrade:', error)
      toast({
        title: "Error",
        description: "Failed to cancel downgrade. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCancelUpgrade = async () => {
    setIsProcessing(true)
    try {
      const response = await fetch('/api/subscription/subscription-management', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'cancelUpgrade' }),
      })
      if (response.ok) {
        const data = await response.json()
        setSubscriptionData({ 
          pendingUpgrade: null,
          nextBillingDate: data.nextBillingDate
        })
        toast({
          title: "Upgrade Cancelled",
          description: "Your scheduled upgrade has been cancelled.",
        })
      } else {
        throw new Error('Failed to cancel upgrade')
      }
    } catch (error) {
      console.error('Error cancelling upgrade:', error)
      toast({
        title: "Error",
        description: "Failed to cancel upgrade. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const getButtonProps = (planName: string) => {
    if (!isSignedIn) {
      return { text: 'Sign In to Subscribe', style: 'bg-purple-600 hover:bg-purple-700' };
    }

    const lowerPlanName = planName.toLowerCase();
    const lowerSubType = displayCurrentSubscription.toLowerCase();

    if (lowerPlanName === lowerSubType) {
      return { text: 'Current Plan', style: 'bg-gray-500 cursor-not-allowed' };
    } else if (
      ['basic', 'pro', 'premium', 'ultimate'].indexOf(lowerPlanName) >
      ['basic', 'pro', 'premium', 'ultimate'].indexOf(lowerSubType)
    ) {
      return { text: `Upgrade to ${planName}`, style: 'bg-purple-600 hover:bg-purple-700' };
    } else {
      return { text: `Downgrade to ${planName}`, style: 'bg-yellow-600 hover:bg-yellow-700' };
    }
  };

  return (
    <div className="bg-transparent text-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {isLoaded && isSignedIn && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <MagicCard
              gradientSize={200}
              gradientColor="#8B5CF6"
              gradientOpacity={0.2}
              className="rounded-xl"
            >
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold mb-2">Your Plan Details</h3>
                    <p className="text-lg mb-2">
                      Current Plan: <span className="font-semibold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">{displayCurrentSubscription.charAt(0).toUpperCase() + displayCurrentSubscription.slice(1)}</span>
                    </p>
                    {displayCurrentSubscription !== 'basic' && (
                      <>
                        {pendingDowngrade ? (
                          <div className="flex flex-col space-y-2">
                            <div className="flex items-center space-x-2 text-yellow-400">
                              <AlertTriangleIcon className="w-5 h-5" />
                              <p className="text-sm">Downgrade in progress</p>
                            </div>
                            <div className="flex items-center space-x-2 text-gray-300">
                              <ArrowDownIcon className="w-5 h-5" />
                              <p className="text-sm">New Plan: <span className="font-semibold">{pendingDowngrade.charAt(0).toUpperCase() + pendingDowngrade.slice(1)}</span></p>
                            </div>
                            <div className="flex items-center space-x-2 text-gray-300">
                              <CalendarIcon className="w-5 h-5" />
                              <p className="text-sm">Changes take effect on: {new Date(nextBillingDate!).toLocaleDateString()}</p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2 text-white bg-red-600 hover:bg-red-700"
                              onClick={handleCancelDowngrade}
                              disabled={isProcessing}
                            >
                              Cancel Downgrade
                            </Button>
                          </div>
                        ) : pendingUpgrade ? (
                          <div className="flex flex-col space-y-2">
                            <div className="flex items-center space-x-2 text-green-400">
                              <SparklesIcon className="w-5 h-5" />
                              <p className="text-sm">Upgrade scheduled</p>
                            </div>
                            <div className="flex items-center space-x-2 text-gray-300">
                              <ArrowUpIcon className="w-5 h-5" />
                              <p className="text-sm">New Plan: <span className="font-semibold">{pendingUpgrade.charAt(0).toUpperCase() + pendingUpgrade.slice(1)}</span></p>
                            </div>
                            <div className="flex items-center space-x-2 text-gray-300">
                              <CalendarIcon className="w-5 h-5" />
                              <p className="text-sm">Changes take effect on: {new Date(nextBillingDate!).toLocaleDateString()}</p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2 text-white bg-red-600 hover:bg-red-700"
                              onClick={handleCancelUpgrade}
                              disabled={isProcessing}
                            >
                              Cancel Scheduled Upgrade
                            </Button>
                          </div>
                        ) : (
                          nextBillingDate && (
                            <div className="flex items-center space-x-2">
                              <CalendarIcon className="w-5 h-5 text-blue-400" />
                              <p className="text-sm">Next billing date: {new Date(nextBillingDate).toLocaleDateString()}</p>
                            </div>
                          )
                        )}
                      </>
                    )}
                  </div>
                  {displayCurrentSubscription !== 'basic' && !pendingDowngrade && !pendingUpgrade && (
                    <div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm" className="mt-2" disabled={isCancelling}>
                            <XCircle className="w-4 h-4 mr-2" />
                            Cancel Subscription
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure you want to cancel?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Your subscription will remain active until the end of your current billing period. After that, you&apos;ll be downgraded to the Basic plan.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>No, keep my subscription</AlertDialogCancel>
                            <AlertDialogAction onClick={handleCancelSubscription}>Yes, cancel my subscription</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
              </div>
            </MagicCard>
          </motion.div>
        )}

        <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-4 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`${plan.popular ? 'md:scale-105 md:z-10' : ''}`}
            >
              <MagicCard
                gradientSize={100}
                gradientColor={plan.popular ? "#8B5CF6" : "#4B5563"}
                gradientOpacity={0.15}
                className="h-full rounded-2xl"
              >
                {plan.popular ? (
                  <ShineBorder
                    borderRadius={16}
                    borderWidth={2}
                    duration={10}
                    color={["#8B5CF6", "#6366F1", "#EC4899"]}
                    className="h-full"
                  >
                    <PlanContent 
                      plan={plan} 
                      isMonthly={isMonthly} 
                      buttonProps={getButtonProps(plan.name)}
                      isSignedIn={isSignedIn ?? false}
                      currentSubscription={currentSubscription}
                      pendingUpgrade={pendingUpgrade}
                      pendingDowngrade={pendingDowngrade}
                      nextBillingDate={nextBillingDate}
                    />
                  </ShineBorder>
                ) : (
                  <PlanContent 
                    plan={plan} 
                    isMonthly={isMonthly} 
                    buttonProps={getButtonProps(plan.name)}
                    isSignedIn={isSignedIn ?? false}
                    currentSubscription={currentSubscription}
                    pendingUpgrade={pendingUpgrade}
                    pendingDowngrade={pendingDowngrade}
                    nextBillingDate={nextBillingDate}
                  />
                )}
              </MagicCard>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-16 overflow-hidden"
        >
          <h3 className="text-2xl font-bold text-center mb-8 text-gray-100">Feature Comparison</h3>
          <MagicCard 
            className="overflow-hidden rounded-xl"
            gradientSize={50}  // Reduced from 1000 to 300
            gradientColor="#FFFFFF"
            gradientOpacity={0.15}  // Reduced from 0.15 to 0.1
          >
            <div className="overflow-x-auto">
              <table className="min-w-full bg-opacity-60 bg-gray-900 backdrop-blur-md">
                <thead className="bg-gray-800 bg-opacity-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Feature
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Free
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Pro
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Premium
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Ultimate
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {featureComparison.map((feature, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-gray-800 bg-opacity-30' : 'bg-gray-800 bg-opacity-10'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-300">
                        {feature.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {feature.free}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {feature.pro}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {feature.premium}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {feature.ultimate}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </MagicCard>
          <div className="mt-4 text-sm text-gray-400 text-right">
            * Prompt enhancements are limited to the number of generations per month
          </div>
        </motion.div>
      </div>
    </div>
  )
}