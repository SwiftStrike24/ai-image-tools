"use client"

import { PricingComponentComponent } from '@/components/pricing-component'
import { motion } from 'framer-motion'
import GridPattern from "@/components/magicui/animated-grid-pattern"
import AnimatedGradientText from "@/components/magicui/animated-gradient-text"
import BlurFade from "@/components/magicui/blur-fade"
import { Home, Sparkles, Zap } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Dock, DockIcon } from "@/components/ui/dock"

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

  const dockItems = [
    { icon: Home, label: "Home", onClick: () => router.push('/') },
    { icon: Sparkles, label: "Generator", onClick: () => router.push('/generator') },
    { icon: Zap, label: "Upscaler", onClick: () => router.push('/upscaler') },
  ]

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
      
      <Dock className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
        {dockItems.map((item, index) => (
          <DockIcon key={index} onClick={item.onClick} label={item.label}>
            <item.icon className="w-8 h-8 text-white" />
          </DockIcon>
        ))}
      </Dock>
    </motion.div>
  )
}