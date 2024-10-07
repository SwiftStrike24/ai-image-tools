export const plans = [
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

export const featureComparison = [
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