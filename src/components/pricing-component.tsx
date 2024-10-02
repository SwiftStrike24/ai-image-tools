"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckIcon, SparklesIcon } from 'lucide-react'
import ShineBorder from '@/components/magicui/shine-border'
import { MagicCard } from '@/components/magicui/magic-card'
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@clerk/nextjs"
import { useRouter } from 'next/navigation'
import { useSubscription } from '@/hooks/useSubscription'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"

const plans = [
  {
    name: 'Basic',
    price: '$0',
    features: [
      '5 upscales/day & 5 generations/day',
      'Upscale options: 2x and 4x only',
      '5 prompt enhancements/day',
      'AI model choice: Meta-Llama 3 (8B) or GPT-4o-mini',
    ],
    cta: 'Get Started',
    priceId: null, // No priceId for the free plan
  },
  {
    name: 'Pro',
    price: '$8',
    features: [
      '1000 upscales/month & 1000 generations/month',
      'Upscale options: 2x, 4x, 6x, 8x',
      'Unlimited prompt enhancements',
      'AI model choice: Meta-Llama 3 (8B) or GPT-4o-mini',
    ],
    cta: 'Upgrade to Pro',
    popular: true,
    priceId: 'price_1Q3AztHYPfrMrymk4VqOuNAD',
  },
  {
    name: 'Premium',
    price: '$15',
    features: [
      '2000 upscales/month & 2000 generations/month',
      'Upscale options: 2x, 4x, 6x, 8x, 10x',
      'Unlimited prompt enhancements',
      'AI model choice: Meta-Llama 3 (8B) or GPT-4o-mini',
    ],
    cta: 'Go Premium',
    priceId: 'price_1Q3B16HYPfrMrymkgzihBxJR',
  },
  {
    name: 'Ultimate',
    price: '$35',
    features: [
      '4000 upscales/month & 4000 generations/month',
      'All upscale options available',
      'Unlimited prompt enhancements',
      'Exclusive access to GPT-4o for prompt enhancements',
    ],
    cta: 'Go Ultimate',
    priceId: 'price_1Q3B2gHYPfrMrymkYyJgjmci',
  },
]

const featureComparison = [
  { name: 'Upscales/month', free: '150', pro: '1000', premium: '2000', ultimate: '4000' },
  { name: 'Generations/month', free: '150', pro: '1000', premium: '2000', ultimate: '4000' },
  { name: 'Max upscale option', free: '4x', pro: '8x', premium: '10x', ultimate: 'All options' },
  { 
    name: 'Prompt enhancements/month', 
    free: '150', 
    pro: 'Unlimited*', 
    premium: 'Unlimited*', 
    ultimate: 'Unlimited*',
    note: 'Limited to the number of generations per month'
  },
  { name: 'AI model choice', free: 'Yes', pro: 'Yes', premium: 'Yes', ultimate: 'Yes + GPT-4o' },
]

export function PricingComponentComponent() {
  const [isMonthly, setIsMonthly] = useState(true)
  const { subscriptionType } = useSubscription('generator'); // Use the generator type, but it doesn't matter which one we use here

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

  return (
    <div className="bg-transparent text-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
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
                    <PlanContent plan={plan} isMonthly={isMonthly} buttonProps={getButtonProps(plan.name)} />
                  </ShineBorder>
                ) : (
                  <PlanContent plan={plan} isMonthly={isMonthly} buttonProps={getButtonProps(plan.name)} />
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
            <table className="min-w-full rounded-lg overflow-hidden" style={{
              background: 'rgba(30, 30, 30, 0.6)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            }}>
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
      </div>
    </div>
  )
}

function PlanContent({ plan, isMonthly, buttonProps }: { plan: any; isMonthly: boolean; buttonProps: { text: string; style: string } }) {
  const { toast } = useToast()
  const { isLoaded, isSignedIn } = useAuth()
  const router = useRouter()
  const [isDowngradeModalOpen, setIsDowngradeModalOpen] = useState(false)
  const { subscriptionType } = useSubscription('generator');

  const handleSubscribe = async () => {
    if (plan.name === 'Basic') {
      // Instead of scrolling, we'll handle the Basic plan subscription here
      // For now, let's just show a toast message
      toast({
        title: "Basic Plan",
        description: "You've selected the Basic plan. No further action needed.",
        variant: "default",
      });
      return;
    }

    if (!isLoaded) {
      return;
    }

    if (!isSignedIn) {
      router.push('/sign-in?redirect=/pricing');
      return;
    }

    if (buttonProps.text === 'Current Plan') {
      toast({
        title: "Current Plan",
        description: "You are already subscribed to this plan.",
        variant: "default",
      });
      return;
    }

    if (buttonProps.text.startsWith('Downgrade')) {
      // Open confirmation modal
      setIsDowngradeModalOpen(true);
      return;
    }

    if (plan.priceId) {
      try {
        const response = await fetch('/api/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ priceId: plan.priceId }),
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
    } else {
      // Handle downgrading to Basic plan
      setIsDowngradeModalOpen(true);
    }
  };

  const handleDowngrade = async () => {
    try {
      const response = await fetch('/api/downgrade-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planName: plan.name }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'An error occurred');
      }

      const data = await response.json();
      
      toast({
        title: "Downgrade Scheduled",
        description: `Your subscription has been downgraded to ${plan.name}.`,
        variant: "default",
      });

      setIsDowngradeModalOpen(false);
      router.refresh();
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
    <div 
      className="flex flex-col h-full rounded-2xl p-4 sm:p-6"
      style={{
        background: 'rgba(30, 30, 30, 0.6)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
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
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSubscribe}
          className={`w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-100 ${
            buttonProps.style
          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors duration-200`}
          disabled={buttonProps.text === 'Current Plan'}
        >
          {buttonProps.text}
        </motion.button>
      </div>

      <AnimatePresence>
        {isDowngradeModalOpen && (
          <Dialog open={isDowngradeModalOpen} onOpenChange={setIsDowngradeModalOpen}>
            <DialogContent className="sm:max-w-[425px] bg-gray-800 text-gray-100">
              <DialogHeader>
                <DialogTitle>Confirm Downgrade</DialogTitle>
                <DialogDescription>
                  Are you sure you want to downgrade from the {subscriptionType} plan to the {plan.name} plan?
                </DialogDescription>
              </DialogHeader>
              <div className="mt-4">
                <p className="text-sm text-gray-300">
                  You will lose access to the following features:
                </p>
                <ScrollArea className="h-[200px] mt-2">
                  <ul className="space-y-2">
                    {getLostFeatures(subscriptionType, plan.name).map((feature: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <CheckIcon className="h-5 w-5 text-red-500 flex-shrink-0 mr-2" aria-hidden="true" />
                        <span className="text-xs text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              </div>
              <div className="mt-4 flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsDowngradeModalOpen(false)}>Cancel</Button>
                <Button onClick={handleDowngrade}>Confirm Downgrade</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
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