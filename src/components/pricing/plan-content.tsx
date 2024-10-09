import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckIcon, CalendarIcon, AlertTriangleIcon } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { useRouter } from 'next/navigation'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useSubscriptionStore } from '@/stores/subscriptionStore'
import { Plan, plans } from '@/data/plans'  // Import both Plan type and plans array

interface PlanContentProps {
  plan: Plan;
  isMonthly: boolean;
  buttonProps: { text: string; style: string };
  isSignedIn: boolean;
  currentSubscription: string;
  pendingUpgrade: string | null;
  pendingDowngrade: string | null;
  nextBillingDate: string | null;
}

export function PlanContent({
  plan,
  isMonthly,
  buttonProps,
  isSignedIn,
  currentSubscription,
  pendingUpgrade,
  pendingDowngrade,
  nextBillingDate
}: PlanContentProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [isDowngradeModalOpen, setIsDowngradeModalOpen] = useState(false)
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false)
  const [proratedAmount, setProratedAmount] = useState<number | null>(null)
  const [isConfirmingUpgrade, setIsConfirmingUpgrade] = useState(false)
  const [isScheduleUpgradeModalOpen, setIsScheduleUpgradeModalOpen] = useState(false)

  const {
    setSubscriptionData,
    fetchSubscriptionData
  } = useSubscriptionStore()

  const handleUpgradeOrSubscribe = async () => {
    if (!isSignedIn) {
      router.push(`/sign-in?redirect=${encodeURIComponent('/pricing')}`)
      return
    }

    if (currentSubscription === 'basic' || currentSubscription === 'inactive') {
      await handleSubscribe();
    } else if (buttonProps.text.startsWith('Upgrade')) {
      await handleUpgradeClick();
    } else if (buttonProps.text.startsWith('Downgrade')) {
      setIsDowngradeModalOpen(true);
    }
  };

  const handleSubscribe = async () => {
    if (plan.name === 'Basic') {
      toast({
        title: "Basic Plan",
        description: "You're already on the Basic plan or can access these features for free.",
        variant: "default",
      });
      return;
    }

    if (plan.priceId) {
      try {
        const response = await fetch('/api/subscription/subscription-management', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'subscribe', newPlanId: plan.priceId }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'An error occurred');
        }

        const data = await response.json();
        
        if (data.url) {
          window.location.href = data.url;
        } else {
          throw new Error('No checkout URL returned');
        }
      } catch (error) {
        console.error('Error:', error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "An error occurred. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleUpgradeClick = async () => {
    try {
      const response = await fetch('/api/subscription/subscription-management', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'upgrade', newPlanId: plan.priceId, subAction: 'calculate' }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'An error occurred');
      }

      const data = await response.json();
      setProratedAmount(data.proratedAmount);
      setIsUpgradeModalOpen(true);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const confirmUpgrade = async () => {
    setIsConfirmingUpgrade(true);
    try {
      const response = await fetch('/api/subscription/subscription-management', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'upgrade', newPlanId: plan.priceId, subAction: 'confirm' }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'An error occurred');
      }

      const data = await response.json();
      
      setSubscriptionData({
        currentSubscription: plan.name.toLowerCase(),
        pendingUpgrade: null,
      });

      toast({
        title: "Upgrade Successful",
        description: `Your subscription has been upgraded to ${plan.name}.`,
        variant: "default",
      });

      setIsUpgradeModalOpen(false);
      await fetchSubscriptionData();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsConfirmingUpgrade(false);
    }
  };

  const handleDowngradeClick = async () => {
    try {
      const response = await fetch('/api/subscription/subscription-management', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'downgrade', planName: plan.name }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'An error occurred');
      }

      const data = await response.json();
      
      setSubscriptionData({
        pendingDowngrade: plan.name.toLowerCase(),
        nextBillingDate: data.nextBillingDate,
      });

      toast({
        title: "Downgrade Scheduled",
        description: `Your subscription will be downgraded to ${plan.name} on ${new Date(data.nextBillingDate).toLocaleDateString()}.`,
        variant: "default",
      });

      setIsDowngradeModalOpen(false);
      await fetchSubscriptionData();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleScheduleUpgrade = async () => {
    if (!plan.priceId) {
      toast({
        title: "Error",
        description: "Unable to schedule upgrade. Please try again later.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/subscription/subscription-management', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'upgrade', newPlanId: plan.priceId, subAction: 'schedule' }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'An error occurred');
      }

      const data = await response.json();
      
      setSubscriptionData({
        pendingUpgrade: plan.name.toLowerCase(),
        nextBillingDate: data.nextBillingDate,
      });

      toast({
        title: "Upgrade Scheduled",
        description: `Your subscription will be upgraded to ${plan.name} on ${new Date(data.nextBillingDate).toLocaleDateString()}.`,
        variant: "default",
      });

      setIsScheduleUpgradeModalOpen(false);
      await fetchSubscriptionData();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getButtonStyle = () => {
    if (!isSignedIn) {
      return buttonProps.style;
    }
    if (plan.name === 'Basic') {
      return 'bg-gray-500 cursor-not-allowed opacity-50';
    }
    if (pendingDowngrade && pendingDowngrade.toLowerCase() === plan.name.toLowerCase()) {
      return 'bg-gray-500 cursor-not-allowed';
    }
    if (pendingUpgrade && pendingUpgrade.toLowerCase() === plan.name.toLowerCase()) {
      return 'bg-gray-500 cursor-not-allowed';
    }
    if (buttonProps.text === 'Current Plan') {
      return 'bg-purple-700 cursor-not-allowed';
    }
    return buttonProps.style;
  };

  return (
    <div className="flex flex-col h-full rounded-2xl p-4 sm:p-6 bg-opacity-60 bg-gray-800 backdrop-blur-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg sm:text-xl font-extrabold text-gray-100">
          {plan.name}
        </h3>
        {plan.popular && (
          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-purple-600 text-gray-100">
            Best Value
          </span>
        )}
      </div>
      <div className="mb-4 sm:mb-6 flex items-baseline text-2xl sm:text-4xl font-extrabold">
        {plan.price}
        <span className="ml-1 text-lg sm:text-xl font-medium text-gray-400">
          {isMonthly ? '/mo' : '/yr'}
        </span>
      </div>
      <ul className="space-y-2 sm:space-y-4 mb-6 sm:mb-8 flex-grow">
        {plan.features.map((feature: string, index: number) => (
          <li key={index} className="flex items-start">
            <CheckIcon className="h-5 w-5 sm:h-6 sm:w-6 text-purple-400 flex-shrink-0 mr-2" aria-hidden="true" />
            <span className="text-xs sm:text-sm text-gray-300">{feature}</span>
          </li>
        ))}
      </ul>
      <div className="mt-auto space-y-2">
        <motion.button
          whileHover={{ scale: !isSignedIn || (buttonProps.text !== 'Current Plan' && plan.name !== 'Basic' && !pendingDowngrade && !pendingUpgrade) ? 1.05 : 1 }}
          whileTap={{ scale: !isSignedIn || (buttonProps.text !== 'Current Plan' && plan.name !== 'Basic' && !pendingDowngrade && !pendingUpgrade) ? 0.95 : 1 }}
          onClick={handleUpgradeOrSubscribe}
          className={`w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-100 ${
            getButtonStyle()
          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors duration-200`}
          disabled={!!(
            isSignedIn && (
              buttonProps.text === 'Current Plan' ||
              plan.name === 'Basic' ||
              pendingDowngrade ||
              pendingUpgrade
            )
          )}
        >
          {isSignedIn
            ? (pendingDowngrade && pendingDowngrade.toLowerCase() === plan.name.toLowerCase()
              ? 'Downgrade in Progress'
              : pendingUpgrade && pendingUpgrade.toLowerCase() === plan.name.toLowerCase()
              ? 'Upgrade Scheduled'
              : plan.name === 'Basic' 
              ? 'Free Plan' 
              : buttonProps.text)
            : 'Sign In to Subscribe'}
        </motion.button>
        {isSignedIn && plan.name !== 'Basic' && buttonProps.text.startsWith('Upgrade') && currentSubscription !== 'basic' && !pendingUpgrade && !pendingDowngrade && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsScheduleUpgradeModalOpen(true)}
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-100 bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
          >
            Schedule Upgrade for Next Billing Cycle
          </motion.button>
        )}
        {isSignedIn && pendingUpgrade === plan.name.toLowerCase() && (
          <div className="mt-2 text-sm text-gray-300">
            <CalendarIcon className="inline-block mr-1" size={16} />
            Upgrade scheduled for {nextBillingDate ? new Date(nextBillingDate).toLocaleDateString() : 'Loading...'}
          </div>
        )}
      </div>

      {/* Downgrade Confirmation Modal */}
      <AlertDialog open={isDowngradeModalOpen} onOpenChange={setIsDowngradeModalOpen}>
        <AlertDialogContent className="bg-gray-800 text-gray-100 border border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold">Confirm Downgrade</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              Are you sure you want to downgrade from the {currentSubscription} plan to the {plan.name} plan?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="mt-4 space-y-4">
            <div className="flex items-start space-x-2">
              <CalendarIcon className="w-5 h-5 text-blue-400 mt-0.5" />
              <p className="text-sm text-gray-300">
                Your new plan will take effect at the end of your current billing period:
                <span className="block font-semibold text-white mt-1">
                  {nextBillingDate ? new Date(nextBillingDate).toLocaleDateString() : 'Loading...'}
                </span>
              </p>
            </div>
            <div className="flex items-start space-x-2">
              <AlertTriangleIcon className="w-5 h-5 text-yellow-400 mt-0.5" />
              <p className="text-sm text-gray-300">
                Tip: To maximize your current plan&apos;s benefits, consider waiting until the end of your billing period before downgrading.
              </p>
            </div>
            <p className="text-sm text-gray-300 font-semibold">
              You will lose access to the following features:
            </p>
            <ul className="space-y-2 max-h-40 overflow-y-auto">
              {getLostFeatures(currentSubscription, plan.name).map((feature: string, index: number) => (
                <li key={index} className="flex items-start text-sm">
                  <span className="text-red-400 mr-2">•</span>
                  <span className="text-gray-300">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
          <AlertDialogFooter className="mt-6">
            <AlertDialogCancel className="bg-gray-700 text-gray-100 hover:bg-gray-600">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDowngradeClick} className="bg-purple-600 text-white hover:bg-purple-700">
              Confirm Downgrade
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Upgrade Confirmation Modal */}
      <AlertDialog open={isUpgradeModalOpen} onOpenChange={setIsUpgradeModalOpen}>
        <AlertDialogContent className="bg-gray-800 text-gray-100 border border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold">Confirm Upgrade</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              Are you sure you want to upgrade from the {currentSubscription} plan to the {plan.name} plan?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="mt-4 space-y-4">
            <div className="flex items-start space-x-2">
              <CalendarIcon className="w-5 h-5 text-blue-400 mt-0.5" />
              <p className="text-sm text-gray-300">
                Your new plan will take effect immediately.
              </p>
            </div>
            <div className="flex items-start space-x-2">
              <AlertTriangleIcon className="w-5 h-5 text-yellow-400 mt-0.5" />
              <p className="text-sm text-gray-300">
                You will be charged a prorated amount of ${proratedAmount?.toFixed(2)} for the remainder of your current billing cycle.
              </p>
            </div>
            <p className="text-sm text-gray-300 font-semibold">
              You will gain access to the following features:
            </p>
            <ul className="space-y-2 max-h-40 overflow-y-auto">
              {getNewFeatures(currentSubscription, plan.name).map((feature: string, index: number) => (
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
              onClick={confirmUpgrade} 
              className="bg-purple-600 text-white hover:bg-purple-700"
              disabled={isConfirmingUpgrade}
            >
              {isConfirmingUpgrade ? 'Upgrading...' : 'Confirm Upgrade'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Schedule Upgrade Modal */}
      <AlertDialog open={isScheduleUpgradeModalOpen} onOpenChange={setIsScheduleUpgradeModalOpen}>
        <AlertDialogContent className="bg-gray-800 text-gray-100 border border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold">Schedule Upgrade</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              Are you sure you want to schedule an upgrade from the {currentSubscription} plan to the {plan.name} plan?
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
              {getNewFeatures(currentSubscription, plan.name).map((feature: string, index: number) => (
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
              onClick={handleScheduleUpgrade} 
              className="bg-purple-600 text-white hover:bg-purple-700"
            >
              Confirm Scheduled Upgrade
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// Helper functions to get lost and new features
function getLostFeatures(currentPlan: string, newPlan: string) {
  const planOrder = ['basic', 'pro', 'premium', 'ultimate'];
  const currentPlanIndex = planOrder.indexOf(currentPlan.toLowerCase());
  const newPlanIndex = planOrder.indexOf(newPlan.toLowerCase());

  if (newPlanIndex >= currentPlanIndex) return [];

  const lostFeatures = [];
  for (let i = currentPlanIndex; i > newPlanIndex; i--) {
    lostFeatures.push(...plans[i].features);
  }

  const newPlanFeatures = new Set(plans[newPlanIndex].features);
  return [...new Set(lostFeatures.filter(feature => !newPlanFeatures.has(feature)))];
}

function getNewFeatures(currentPlan: string, newPlan: string) {
  const planOrder = ['basic', 'pro', 'premium', 'ultimate'];
  const currentPlanIndex = planOrder.indexOf(currentPlan.toLowerCase());
  const newPlanIndex = planOrder.indexOf(newPlan.toLowerCase());

  if (newPlanIndex <= currentPlanIndex || currentPlanIndex === -1 || newPlanIndex === -1) {
    return [];
  }

  const newFeatures = [];
  for (let i = currentPlanIndex + 1; i <= newPlanIndex; i++) {
    const plan = plans.find(p => p.name.toLowerCase() === planOrder[i]);
    if (plan) {
      newFeatures.push(...plan.features);
    }
  }

  const currentPlanData = plans.find(p => p.name.toLowerCase() === currentPlan.toLowerCase());
  const currentPlanFeatures = new Set(currentPlanData?.features || []);
  return [...new Set(newFeatures.filter(feature => !currentPlanFeatures.has(feature)))];
}