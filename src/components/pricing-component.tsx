"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckIcon, SparklesIcon } from 'lucide-react'

const plans = [
  {
    name: 'Free',
    price: '$0',
    features: [
      '10 upscales/day & 10 generations/day',
      'Upscale options: 2x and 4x only',
      '5 prompt enhancements/day',
      'AI model choice available',
    ],
    cta: 'Get Started',
  },
  {
    name: 'Pro',
    price: '$10',
    features: [
      '1000 upscales/month & 1000 generations/month',
      'Upscale options: 2x, 4x, 6x, 8x',
      'Unlimited prompt enhancements',
      'AI model choice available',
    ],
    cta: 'Upgrade to Pro',
    popular: true,
  },
  {
    name: 'Premium',
    price: '$20',
    features: [
      '2000 upscales/month & 2000 generations/month',
      'Upscale options: 2x, 4x, 6x, 8x, 10x',
      'Unlimited prompt enhancements',
      'AI model choice available',
    ],
    cta: 'Go Premium',
  },
]

const featureComparison = [
  { name: 'Upscales per month', free: '300', pro: '1000', premium: '2000' },
  { name: 'Generations per month', free: '300', pro: '1000', premium: '2000' },
  { name: 'Max upscale option', free: '4x', pro: '8x', premium: '10x' },
  { name: 'Prompt enhancements', free: '5/day', pro: 'Unlimited', premium: 'Unlimited' },
  { name: 'AI model choice', free: 'Yes', pro: 'Yes', premium: 'Yes' },
]

export function PricingComponentComponent() {
  const [isMonthly, setIsMonthly] = useState(true)

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h2 className="text-4xl font-extrabold sm:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
            Choose Your Plan
          </h2>
          <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-400 sm:mt-4">
            Unlock the full potential of AI-powered image tools
          </p>
        </div>

        <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`flex flex-col rounded-2xl overflow-hidden ${
                plan.popular
                  ? 'ring-4 ring-purple-500 ring-opacity-50 transform scale-105 z-10'
                  : ''
              }`}
              style={{
                background: `rgba(30, 30, 30, ${plan.popular ? '0.8' : '0.6'})`,
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
              }}
            >
              <div className="px-6 py-8 sm:p-10 sm:pb-6">
                <div className="flex justify-between items-center">
                  <h3
                    className="text-2xl font-extrabold text-gray-100 sm:text-3xl"
                  >
                    {plan.name}
                  </h3>
                  {plan.popular && (
                    <span className="px-3 py-1 rounded-full text-sm font-semibold bg-purple-600 text-gray-100">
                      Best Value
                    </span>
                  )}
                </div>
                <div className="mt-4 flex items-baseline text-6xl font-extrabold">
                  {plan.price}
                  <span className="ml-1 text-2xl font-medium text-gray-400">
                    {isMonthly ? '/mo' : '/yr'}
                  </span>
                </div>
              </div>
              <div className="flex-1 px-6 pt-6 pb-8 sm:p-10 sm:pt-6">
                <ul className="space-y-4">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <div className="flex-shrink-0">
                        <CheckIcon className="h-6 w-6 text-purple-400" aria-hidden="true" />
                      </div>
                      <p className="ml-3 text-base text-gray-300">{feature}</p>
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <div className="rounded-lg shadow-sm">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`w-full flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-gray-100 ${
                        plan.popular
                          ? 'bg-purple-600 hover:bg-purple-700'
                          : 'bg-gray-700 hover:bg-gray-600'
                      } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors duration-200`}
                    >
                      {plan.cta}
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-16"
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