"use client"

import { useState, useEffect } from 'react'
import { PricingComponentComponent } from '@/components/pricing-component'
import { motion, useAnimation } from 'framer-motion'
import GridPattern from "@/components/magicui/animated-grid-pattern"
import AnimatedGradientText from "@/components/magicui/animated-gradient-text"
import BlurFade from "@/components/magicui/blur-fade"
import { Home, Sparkles, Zap, LogIn } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Dock, DockIcon } from "@/components/ui/dock"
import { useAuth, UserButton } from "@clerk/nextjs"
import ShimmerButton from "@/components/magicui/shimmer-button"
import { LoadingBeam } from '@/components/loading-beam'

export default function PricingPage() {
  const router = useRouter()
  const { isLoaded, isSignedIn } = useAuth()
  const controls = useAnimation()
  const [isClientSide, setIsClientSide] = useState(false)
  const [isLoginLoading, setIsLoginLoading] = useState(false)

  useEffect(() => {
    setIsClientSide(true)
  }, [])

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
    { icon: Zap, label: "Upscaler", onClick: () => router.push('/upscaler') },
    { icon: Sparkles, label: "Generator", onClick: () => router.push('/generator') },
  ]

  const handleLoginClick = async () => {
    setIsLoginLoading(true)
    try {
      await controls.start({
        scale: [1, 0.9, 1.1, 1],
        rotate: [0, -10, 10, 0],
        transition: { duration: 0.4 }
      })
      router.push('/sign-in?redirect=/pricing')
      // Don't set isLoginLoading to false here, as we're redirecting
    } catch (error) {
      console.error('Error during login animation:', error);
      setIsLoginLoading(false)  // Set loading to false only if there's an error
    }
  }

  if (!isClientSide || !isLoaded) {
    return null // or a loading spinner
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
        <div className="absolute top-4 right-4">
          {!isSignedIn ? (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                animate={controls}
              >
                <LoadingBeam
                  isLoading={isLoginLoading}
                  onClick={handleLoginClick}
                  className="px-6 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-full flex items-center justify-center overflow-hidden relative"
                >
                  <motion.div className="flex items-center justify-center relative z-10">
                    <LogIn className="w-4 h-4 mr-2" />
                    <span className="font-medium">Login</span>
                  </motion.div>
                </LoadingBeam>
              </motion.div>
            </motion.div>
          ) : (
            <UserButton 
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "h-10 w-10",
                  userButtonAvatarBox: "h-10 w-10",
                },
              }}
            />
          )}
        </div>

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
