"use client"

import { PricingComponentComponent } from '@/components/pricing-component'
import { motion } from 'framer-motion'
import GridPattern from "@/components/magicui/animated-grid-pattern"
import AnimatedGradientText from "@/components/magicui/animated-gradient-text"
import BlurFade from "@/components/magicui/blur-fade"
import ShimmerButton from "@/components/magicui/shimmer-button"
import { Home, Sparkles, Zap } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function PricingPage() {
  const router = useRouter()

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
      },
    },
  }

  const buttonVariants = {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    hover: { scale: 1.05 },
    tap: { scale: 0.95 },
  }

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-gray-800 text-white relative overflow-hidden"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <GridPattern
        width={60}
        height={60}
        x={-1}
        y={-1}
        strokeDasharray={0}
        numSquares={100}
        className="absolute inset-0 z-0 opacity-50"
        maxOpacity={0.3}
        duration={8}
        repeatDelay={0}
      />
      
      <div className="relative z-20 container mx-auto px-4 py-16 pt-24">
        <BlurFade>
          <div className="flex justify-center items-center mb-12">
            <AnimatedGradientText className="text-4xl md:text-6xl font-bold mb-4 text-center">
              <div className="flex items-center justify-center">
                <span className="text-white">Choose Your Plan</span>
              </div>
            </AnimatedGradientText>
          </div>
        </BlurFade>
        
        <motion.div 
          className="text-center mb-16"
          variants={itemVariants}
        >
          <p className="text-xl md:text-2xl mb-8 text-gray-300">Unlock the full potential of AI-powered image tools</p>
        </motion.div>

        <motion.div variants={itemVariants}>
          <PricingComponentComponent />
        </motion.div>
      </div>
      
      <div className="absolute top-4 right-4 flex space-x-4 z-50">
        <motion.div
          variants={buttonVariants}
          initial="initial"
          animate="animate"
          whileHover="hover"
          whileTap="tap"
          className="w-full"
        >
          <ShimmerButton
            onClick={() => router.push('/')}
            className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-full flex items-center justify-center"
            shimmerColor="#ffffff33"
            background="rgba(22, 163, 74, 0.5)"
          >
            <Home className="w-4 h-4 mr-2" />
            <span className="font-medium">Home</span>
          </ShimmerButton>
        </motion.div>

        <motion.div
          variants={buttonVariants}
          initial="initial"
          animate="animate"
          whileHover="hover"
          whileTap="tap"
          className="w-full"
        >
          <ShimmerButton
            onClick={() => router.push('/generator')}
            className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-full flex items-center justify-center"
            shimmerColor="#ffffff33"
            background="rgba(124, 58, 237, 0.5)"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            <span className="font-medium">Generator</span>
          </ShimmerButton>
        </motion.div>
        
        <motion.div
          variants={buttonVariants}
          initial="initial"
          animate="animate"
          whileHover="hover"
          whileTap="tap"
          className="w-full"
        >
          <ShimmerButton
            onClick={() => router.push('/upscaler')}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center"
            shimmerColor="#ffffff33"
            background="rgba(37, 99, 235, 0.5)"
          >
            <Zap className="w-4 h-4 mr-2" />
            <span className="font-medium">Upscaler</span>
          </ShimmerButton>
        </motion.div>
      </div>
    </motion.div>
  )
}