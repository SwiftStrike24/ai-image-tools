"use client"

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckIcon, SparklesIcon, RefreshCw } from 'lucide-react'
import ShineBorder from '@/components/magicui/shine-border'
import { MagicCard } from '@/components/magicui/magic-card'
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@clerk/nextjs"
import { useRouter } from 'next/navigation'
import { useSubscription } from '@/hooks/useSubscription'
import { Button } from "@/components/ui/button"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { XCircle } from 'lucide-react'
import { CalendarIcon, AlertTriangleIcon, ArrowDownIcon, ArrowUpIcon } from 'lucide-react'
import { PlanContent } from '@/components/pricing/plan-content'
import { plans, featureComparison } from '@/data/plans'

export function PricingComponentComponent() {
  const [isMonthly, setIsMonthly] = useState(true)
  const { subscriptionType, fetchUsage } = useSubscription('generator')
  const { isLoaded, isSignedIn } = useAuth()
  const [nextBillingDate, setNextBillingDate] = useState<string | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)
  const [cancellationDate, setCancellationDate] = useState<string | null>(null)
  const { toast } = useToast()
  const [isRenewing, setIsRenewing] = useState(false)
  const [pendingDowngrade, setPendingDowngrade] = useState<string | null>(null)
  const [isDowngradeInProgress, setIsDowngradeInProgress] = useState(false)
  const [currentSubscription, setCurrentSubscription] = useState<string>('basic')
  const [pendingUpgrade, setPendingUpgrade] = useState<string | null>(null)
  const [isUpgradeInProgress, setIsUpgradeInProgress] = useState(false)
  const [isScheduleUpgradeModalOpen, setIsScheduleUpgradeModalOpen] = useState(false)
  const [scheduledUpgradePlan, setScheduledUpgradePlan] = useState<string | null>(null)

  const refreshSubscriptionData = useCallback(async () => {
    try {
      const response = await fetch('/api/get-next-billing-date');
      if (!response.ok) {
        throw new Error('Failed to fetch subscription data');
      }
      const data = await response.json();
      setCurrentSubscription(data.currentSubscription || 'basic');
      setPendingUpgrade(data.pendingUpgrade);
      setNextBillingDate(data.nextBillingDate);
      setIsDowngradeInProgress(!!data.pendingDowngrade);
      setIsUpgradeInProgress(!!data.pendingUpgrade);
      setScheduledUpgradePlan(data.pendingUpgrade);
      setPendingDowngrade(data.pendingDowngrade);
      await fetchUsage(); // Refresh usage data
    } catch (error) {
      console.error('Error refreshing subscription data:', error);
      toast({
        title: "Error",
        description: "Failed to refresh subscription data. Please try again.",
        variant: "destructive",
      });
    }
  }, [fetchUsage, toast]);

  useEffect(() => {
    const fetchDates = async () => {
      await refreshSubscriptionData();
    };

    fetchDates();
  }, [refreshSubscriptionData]);

  // Helper function to determine button text and style
  const getButtonProps = (planName: string) => {
    const lowerPlanName = planName.toLowerCase();
    const lowerSubType = subscriptionType.toLowerCase();

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

  const handleCancelSubscription = async () => {
    setIsCancelling(true)
    try {
      const response = await fetch('/api/cancel-subscription', {
        method: 'POST',
      })
      if (response.ok) {
        const data = await response.json()
        setCancellationDate(data.cancellationDate)
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

  const handleRenewSubscription = async () => {
    setIsRenewing(true)
    try {
      const response = await fetch('/api/renew-subscription', {
        method: 'POST',
      })
      if (response.ok) {
        const data = await response.json()
        setNextBillingDate(data.nextBillingDate)
        setCancellationDate(null)
        toast({
          title: "Subscription Renewed",
          description: "Your subscription has been successfully renewed.",
        })
      } else {
        throw new Error('Failed to renew subscription')
      }
    } catch (error) {
      console.error('Error renewing subscription:', error)
      toast({
        title: "Error",
        description: "Failed to renew subscription. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsRenewing(false)
    }
  }

  const handleDowngrade = async (planName: string) => {
    try {
      const response = await fetch('/api/downgrade-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planName }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'An error occurred');
      }

      const data = await response.json();
      
      toast({
        title: "Downgrade Scheduled",
        description: `Your subscription will be downgraded to ${planName} on ${new Date(data.nextBillingDate).toLocaleDateString()}.`,
        variant: "default",
      });

      setPendingDowngrade(data.pendingDowngrade);
      setNextBillingDate(data.nextBillingDate);
      setIsDowngradeInProgress(true);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCancelDowngrade = async () => {
    try {
      const response = await fetch('/api/cancel-downgrade', {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'An error occurred');
      }

      const data = await response.json();
      
      toast({
        title: "Downgrade Cancelled",
        description: "Your subscription will continue as normal.",
        variant: "default",
      });

      setPendingDowngrade(null);
      setIsDowngradeInProgress(false);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCancelUpgrade = async () => {
    try {
      const response = await fetch('/api/cancel-upgrade', {
        method: 'POST',
      });
      if (response.ok) {
        const data = await response.json();
        setPendingUpgrade(null);
        setIsUpgradeInProgress(false);
        toast({
          title: "Upgrade Cancelled",
          description: "Your scheduled upgrade has been cancelled.",
        });
      } else {
        throw new Error('Failed to cancel upgrade');
      }
    } catch (error) {
      console.error('Error cancelling upgrade:', error);
      toast({
        title: "Error",
        description: "Failed to cancel upgrade. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpgrade = async (planName: string) => {
    try {
      const response = await fetch('/api/upgrade-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newPlanId: plans.find(p => p.name === planName)?.priceId, action: 'confirm' }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'An error occurred');
      }

      const data = await response.json();
      
      toast({
        title: "Upgrade Successful",
        description: `Your subscription has been upgraded to ${planName}.`,
        variant: "default",
      });

      // Update local state
      setCurrentSubscription(planName.toLowerCase());
      setPendingUpgrade(null);
      setIsUpgradeInProgress(false);

      // Refresh subscription data
      await refreshSubscriptionData();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleScheduleUpgrade = async (planName: string) => {
    try {
      const response = await fetch('/api/upgrade-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newPlanId: plans.find(p => p.name === planName)?.priceId, action: 'schedule' }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'An error occurred');
      }

      const data = await response.json();
      
      toast({
        title: "Upgrade Scheduled",
        description: `Your subscription will be upgraded to ${planName} on ${new Date(data.nextBillingDate).toLocaleDateString()}.`,
        variant: "default",
      });

      setPendingUpgrade(planName);
      setNextBillingDate(data.nextBillingDate);
      setIsUpgradeInProgress(true);
      setScheduledUpgradePlan(planName);
      setIsScheduleUpgradeModalOpen(false);

      // Refresh subscription data
      await refreshSubscriptionData();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCancelScheduledUpgrade = async () => {
    try {
      const response = await fetch('/api/cancel-upgrade', {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'An error occurred');
      }

      const data = await response.json();
      
      toast({
        title: "Scheduled Upgrade Cancelled",
        description: "Your subscription will continue as normal.",
        variant: "default",
      });

      setPendingUpgrade(null);
      setIsUpgradeInProgress(false);
      setScheduledUpgradePlan(null);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred. Please try again.",
        variant: "destructive",
      });
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
                      Current Plan: <span className="font-semibold bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">{currentSubscription.charAt(0).toUpperCase() + currentSubscription.slice(1)}</span>
                    </p>
                    {currentSubscription !== 'basic' && (
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
                          </div>
                        ) : scheduledUpgradePlan ? (
                          <div className="flex flex-col space-y-2">
                            <div className="flex items-center space-x-2 text-green-400">
                              <SparklesIcon className="w-5 h-5" />
                              <p className="text-sm">Upgrade scheduled</p>
                            </div>
                            <div className="flex items-center space-x-2 text-gray-300">
                              <ArrowUpIcon className="w-5 h-5" />
                              <p className="text-sm">New Plan: <span className="font-semibold">{scheduledUpgradePlan.charAt(0).toUpperCase() + scheduledUpgradePlan.slice(1)}</span></p>
                            </div>
                            <div className="flex items-center space-x-2 text-gray-300">
                              <CalendarIcon className="w-5 h-5" />
                              <p className="text-sm">Changes take effect on: {new Date(nextBillingDate!).toLocaleDateString()}</p>
                            </div>
                          </div>
                        ) : cancellationDate ? (
                          <p className="text-sm">Subscription ends on: {new Date(cancellationDate).toLocaleDateString()}</p>
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
                    {pendingDowngrade && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 text-white bg-red-600 hover:bg-red-700"
                        onClick={handleCancelDowngrade}
                      >
                        Cancel Downgrade
                      </Button>
                    )}
                    {scheduledUpgradePlan && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 text-white bg-red-600 hover:bg-red-700"
                        onClick={handleCancelScheduledUpgrade}
                      >
                        Cancel Scheduled Upgrade
                      </Button>
                    )}
                  </div>
                  {currentSubscription !== 'basic' && !pendingDowngrade && !scheduledUpgradePlan && (
                    <div>
                      {cancellationDate ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2 text-black"
                          onClick={handleRenewSubscription}
                          disabled={isRenewing}
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Renew Subscription
                        </Button>
                      ) : (
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
                      )}
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
                      isDowngradeInProgress={isDowngradeInProgress}
                      isUpgradeInProgress={isUpgradeInProgress}
                      pendingDowngrade={pendingDowngrade}
                      pendingUpgrade={pendingUpgrade}
                      handleDowngrade={handleDowngrade}
                      handleUpgrade={handleUpgrade}
                      subscriptionType={subscriptionType}
                      nextBillingDate={nextBillingDate}
                    />
                  </ShineBorder>
                ) : (
                  <PlanContent 
                    plan={plan} 
                    isMonthly={isMonthly} 
                    buttonProps={getButtonProps(plan.name)} 
                    isDowngradeInProgress={isDowngradeInProgress}
                    isUpgradeInProgress={isUpgradeInProgress}
                    pendingDowngrade={pendingDowngrade}
                    pendingUpgrade={pendingUpgrade}
                    handleDowngrade={handleDowngrade}
                    handleUpgrade={handleUpgrade}
                    subscriptionType={subscriptionType}
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
          <div className="overflow-x-auto">
            <table className="min-w-full rounded-lg overflow-hidden bg-opacity-60 bg-gray-900 backdrop-blur-md">
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
                      {feature.note && (
                        <div className="mt-1 text-xs text-gray-400 font-normal">
                          <span className="inline-block px-2 py-1 rounded-full bg-gray-700 bg-opacity-50">
                            * {feature.note}
                          </span>
                        </div>
                      )}
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
        </motion.div>

        {/* Schedule Upgrade Modal */}
        <AlertDialog open={isScheduleUpgradeModalOpen} onOpenChange={setIsScheduleUpgradeModalOpen}>
          <AlertDialogContent className="bg-gray-800 text-gray-100 border border-gray-700">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-2xl font-bold">Schedule Upgrade</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-300">
                Are you sure you want to schedule an upgrade from the {currentSubscription} plan to the {scheduledUpgradePlan} plan?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="mt-4 space-y-4">
              <div className="flex items-start space-x-2">
                <CalendarIcon className="w-5 h-5 text-blue-400 mt-0.5" />
                <p className="text-sm text-gray-300">
                  Your new plan will take effect at the start of your next billing cycle:
                  <span className="block font-semibold text-white mt-1">
                    {nextBillingDate ? new Date(nextBillingDate).toLocaleDateString() : 'Loading...'}
                  </span>
                </p>
              </div>
              <p className="text-sm text-gray-300 font-semibold">
                You will gain access to the following features:
              </p>
              <ul className="space-y-2 max-h-40 overflow-y-auto">
                {getNewFeatures(currentSubscription, scheduledUpgradePlan || '').map((feature: string, index: number) => (
                  <li key={index} className="flex items-start text-sm">
                    <span className="text-green-400 mr-2">•</span>
                    <span className="text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            <AlertDialogFooter className="mt-6">
              <AlertDialogCancel className="bg-gray-700 text-gray-100 hover:bg-gray-600">Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => scheduledUpgradePlan && handleScheduleUpgrade(scheduledUpgradePlan)} 
                className="bg-purple-600 text-white hover:bg-purple-700"
              >
                Confirm Scheduled Upgrade
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}

// Helper function to get lost features when downgrading
function getLostFeatures(currentPlan: string, newPlan: string) {
  const planOrder = ['basic', 'pro', 'premium', 'ultimate'];
  const currentPlanIndex = planOrder.indexOf(currentPlan.toLowerCase());
  const newPlanIndex = planOrder.indexOf(newPlan.toLowerCase());

  if (newPlanIndex >= currentPlanIndex) return [];

  const lostFeatures = [];
  for (let i = currentPlanIndex; i > newPlanIndex; i--) {
    lostFeatures.push(...plans[i].features);
  }

  // Remove duplicates and features that are still available in the new plan
  const newPlanFeatures = new Set(plans[newPlanIndex].features);
  return [...new Set(lostFeatures.filter(feature => !newPlanFeatures.has(feature)))];
}

// Helper function to get new features when upgrading
function getNewFeatures(currentPlan: string, newPlan: string) {
  const planOrder = ['basic', 'pro', 'premium', 'ultimate'];
  const currentPlanIndex = planOrder.indexOf(currentPlan.toLowerCase());
  const newPlanIndex = planOrder.indexOf(newPlan.toLowerCase());

  if (newPlanIndex <= currentPlanIndex) return [];

  const newFeatures = [];
  for (let i = currentPlanIndex + 1; i <= newPlanIndex; i++) {
    newFeatures.push(...plans[i].features);
  }

  // Remove duplicates and features that are already available in the current plan
  const currentPlanFeatures = new Set(plans[currentPlanIndex].features);
  return [...new Set(newFeatures.filter(feature => !currentPlanFeatures.has(feature)))];
}
