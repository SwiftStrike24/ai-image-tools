"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckIcon, SparklesIcon } from 'lucide-react'
import ShineBorder from './magicui/shine-border'
import { MagicCard } from './magicui/magic-card'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

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
    paymentLink: 'https://buy.stripe.com/test_3cseY93JD8kE3Wo9AA'
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
    paymentLink: 'https://buy.stripe.com/test_6oE9DPcg958sboQ9AB'
  },
  {
    name: 'Ultimate',
    price: '$29',
    features: [
      '4000 upscales/month & 4000 generations/month',
      'All upscale options available',
      'Unlimited prompt enhancements',
      'Exclusive access to GPT-4o for prompt enhancements',
    ],
    cta: 'Go Ultimate',
    paymentLink: 'https://buy.stripe.com/test_14kcQ15RL7gA2Sk146'
  },
]

const featureComparison = [
  { name: 'Upscales/month', free: '150', pro: '1000', premium: '2000', ultimate: '4000' },
  { name: 'Generations/month', free: '150', pro: '1000', premium: '2000', ultimate: '4000' },
  { name: 'Max upscale option', free: '4x', pro: '8x', premium: '10x', ultimate: 'All options' },
  { name: 'Prompt enhancements/month', free: '150', pro: 'Unlimited', premium: 'Unlimited', ultimate: 'Unlimited' },
  { name: 'AI model choice', free: 'Yes', pro: 'Yes', premium: 'Yes', ultimate: 'Yes + GPT-4o' },
]

// Add this custom component for the Stripe Buy Button
const StripeBuyButton = ({ buyButtonId, publishableKey }: { buyButtonId: string; publishableKey: string }) => {
  return (
    <div
      dangerouslySetInnerHTML={{
        __html: `
          <stripe-buy-button
            buy-button-id="${buyButtonId}"
            publishable-key="${publishableKey}"
          >
          </stripe-buy-button>
        `
      }}
    />
  )
}

export function PricingComponentComponent() {
  const [isMonthly, setIsMonthly] = useState(true)

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
                    <PlanContent plan={plan} isMonthly={isMonthly} />
                  </ShineBorder>
                ) : (
                  <PlanContent plan={plan} isMonthly={isMonthly} />
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

function PlanContent({ plan, isMonthly }: { plan: any; isMonthly: boolean }) {
  const handleSubscribe = () => {
    if (plan.paymentLink) {
      window.location.href = plan.paymentLink;
    } else {
      console.log(`${plan.name} plan selected`);
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
            plan.popular
              ? 'bg-purple-600 hover:bg-purple-700'
              : 'bg-gray-700 hover:bg-gray-600'
          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors duration-200`}
        >
          {plan.cta}
        </motion.button>
      </div>
    </div>
  )
}