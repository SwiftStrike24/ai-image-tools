import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckIcon, CalendarIcon, AlertTriangleIcon } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { useRouter } from 'next/navigation'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useSubscriptionStore } from '@/stores/subscriptionStore'
import { Plan, plans } from '@/data/plans'  // Import both Plan type and plans array
import { LoadingBeam } from '@/components/loading-beam'  // Import LoadingBeam

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
  const [isLoading, setIsLoading] = useState(false)  // Add loading state

  const {
    setSubscriptionData,
    fetchSubscriptionData
  } = useSubscriptionStore()

  const handleUpgradeOrSubscribe = async () => {
    if (!isSignedIn) {
      router.push(`/sign-in?redirect=${encodeURIComponent('/pricing')}`);
      return;
    }

    setIsLoading(true)  // Set loading to true when action starts
    try {
      if (currentSubscription === 'basic' || currentSubscription === 'inactive') {
        await handleSubscribe();
      } else {
        await handleManageSubscription();
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false)  // Only set loading to false if there's an error
    }
  };

  const handleManageSubscription = async () => {
    try {
      const response = await fetch('/api/subscription/create-portal-session', {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to create portal session');
      const { url } = await response.json();
      window.location.href = url;
      // Don't set isLoading to false here, as we're redirecting
    } catch (error) {
      console.error('Error creating portal session:', error);
      toast({
        title: "Error",
        description: "Failed to open subscription management. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false)  // Set loading to false only if there's an error
    }
  };

  const handleSubscribe = async () => {
    if (plan.name === 'Basic') {
      toast({
        title: "Basic Plan",
        description: "You're already on the Basic plan or can access these features for free.",
        variant: "default",
      });
      setIsLoading(false)  // Set loading to false for Basic plan
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
          // Don't set isLoading to false here, as we're redirecting
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
        setIsLoading(false)  // Set loading to false only if there's an error
      }
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

    setIsLoading(true)  // Set loading to true when action starts
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
    } finally {
      setIsLoading(false)  // Set loading to false when action completes
    }
  };

  const handleDowngradeClick = async () => {
    setIsLoading(true)  // Set loading to true when action starts
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
    } finally {
      setIsLoading(false)  // Set loading to false when action completes
    }
  };

  const getButtonStyle = () => {
    if (!isSignedIn) {
      return 'bg-purple-600 hover:bg-purple-700';
    }
    if (plan.name.toLowerCase() === currentSubscription.toLowerCase()) {
      return 'bg-orange-500 hover:bg-orange-600 cursor-not-allowed';
    }
    if (pendingDowngrade && pendingDowngrade.toLowerCase() === plan.name.toLowerCase()) {
      return 'bg-gray-500 cursor-not-allowed';
    }
    if (pendingUpgrade && pendingUpgrade.toLowerCase() === plan.name.toLowerCase()) {
      return 'bg-gray-500 cursor-not-allowed';
    }
    if (plan.name === 'Basic') {
      return 'bg-gray-500 cursor-not-allowed opacity-50';
    }
    // Downgrade button style
    if (plans.findIndex(p => p.name.toLowerCase() === plan.name.toLowerCase()) < 
        plans.findIndex(p => p.name.toLowerCase() === currentSubscription.toLowerCase())) {
      return 'bg-gray-400 hover:bg-gray-500 text-gray-800';
    }
    // Upgrade button style
    return 'bg-purple-600 hover:bg-purple-700';
  };

  const getButtonText = () => {
    if (!isSignedIn) return 'Sign In to Subscribe';
    if (plan.name.toLowerCase() === currentSubscription.toLowerCase()) return 'Current Plan';
    if (pendingDowngrade && pendingDowngrade.toLowerCase() === plan.name.toLowerCase()) return 'Downgrade in Progress';
    if (pendingUpgrade && pendingUpgrade.toLowerCase() === plan.name.toLowerCase()) return 'Upgrade Scheduled';
    if (plan.name === 'Basic') return 'Free Plan';
    if (plans.findIndex(p => p.name.toLowerCase() === plan.name.toLowerCase()) < 
        plans.findIndex(p => p.name.toLowerCase() === currentSubscription.toLowerCase())) {
      return 'Downgrade';
    }
    return 'Upgrade';
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
      <div className="mt-auto">
        <LoadingBeam
          isLoading={isLoading}
          onClick={handleUpgradeOrSubscribe}
          className={`w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-100 ${
            getButtonStyle()
          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors duration-200`}
          disabled={!!(
            isSignedIn && (
              getButtonText() === 'Current Plan' ||
              plan.name === 'Basic' ||
              pendingDowngrade ||
              pendingUpgrade
            )
          )}
        >
          {getButtonText()}
        </LoadingBeam>
        {isSignedIn && pendingUpgrade === plan.name.toLowerCase() && (
          <div className="mt-2 text-sm text-gray-300">
            <CalendarIcon className="inline-block mr-1" size={16} />
            Upgrade scheduled for {nextBillingDate ? new Date(nextBillingDate).toLocaleDateString() : 'Loading...'}
          </div>
        )}
      </div>
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
