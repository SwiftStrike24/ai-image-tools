export interface Plan {
  name: string;
  price: string;
  features: string[];
  popular?: boolean;
  priceId: string | null;
  cta: string;
}

export const plans: Plan[] = [
  {
    name: 'Basic',
    price: '$0',
    features: [
      '10 upscales/day & 10 generations/day',
      'Upscale options: 2x and 4x only',
      '10 prompt enhancements/day',
      'AI model choice: Meta-Llama 3 (8B) or GPT-4o-mini',
    ],
    cta: 'Get Started',
    priceId: null,
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
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || '',
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
    priceId: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID || '',
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
    priceId: process.env.NEXT_PUBLIC_STRIPE_ULTIMATE_PRICE_ID || '',
  },
]

export const featureComparison = [
  { name: 'Upscales/month', free: '300', pro: '1000', premium: '2000', ultimate: '4000' },
  { name: 'Generations/month', free: '300', pro: '1000', premium: '2000', ultimate: '4000' },
  { name: 'Max upscale option', free: '4x', pro: '8x', premium: '10x', ultimate: 'All options' },
  { 
    name: 'Prompt enhancements/month', 
    free: '300', 
    pro: 'Unlimited', 
    premium: 'Unlimited', 
    ultimate: 'Unlimited'
  },
  { name: 'AI model choice', free: 'Yes', pro: 'Yes', premium: 'Yes', ultimate: 'Yes + GPT-4o' },
]
