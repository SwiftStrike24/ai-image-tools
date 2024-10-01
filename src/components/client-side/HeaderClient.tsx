"use client";

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { cn } from "@/lib/utils"
import { UserButton } from '@clerk/nextjs'
import { Sparkles, Zap, Menu, CreditCard } from 'lucide-react'
import RetroGrid from "@/components/magicui/retro-grid"
import AnimatedGradientText from "@/components/magicui/animated-gradient-text"
import HyperText from "@/components/magicui/hyper-text"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import ShimmerButton from "@/components/magicui/shimmer-button"

const tabs = [
  { id: 'upscaler', label: 'Image Upscaler', path: '/upscaler', icon: Zap },
  { id: 'generator', label: 'Image Generator', path: '/generator', icon: Sparkles },
]

export default function HeaderClient() {
  const router = useRouter()
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState('')
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    const currentTab = tabs.find(tab => tab.path === pathname)
    setActiveTab(currentTab ? currentTab.id : '')
  }, [pathname])

  const handleTabChange = (newTab: string, path: string) => {
    setActiveTab(newTab)
    setIsMenuOpen(false)
    router.push(path)
  }

  const buttonVariants = {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    hover: { scale: 1.05 },
    tap: { scale: 0.95 },
  }

  return (
    <header className="relative bg-gradient-to-br from-gray-900 to-purple-900 text-white p-2 md:p-3 overflow-hidden">
      <RetroGrid className="absolute inset-0 z-0 opacity-20" />
      <div className="absolute inset-0 bg-purple-900/30 backdrop-blur-sm" />
      <div className="relative z-20 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="text-lg md:text-xl font-bold">
              <HyperText
                text="FluxScale AI"
                className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600"
                duration={3000}
              />
            </Link>
            
            <motion.div
              variants={buttonVariants}
              initial="initial"
              animate="animate"
              whileHover="hover"
              whileTap="tap"
            >
              <ShimmerButton
                onClick={() => router.push('/pricing')}
                className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full flex items-center justify-center"
                shimmerColor="#ffffff33"
                background="rgba(236, 72, 153, 0.5)"
              >
                <CreditCard className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="font-medium whitespace-nowrap">My Subscription</span>
              </ShimmerButton>
            </motion.div>
          </div>

          <div className="flex items-center space-x-2 md:space-x-4">
            <nav className="hidden md:block">
              <ul className="flex space-x-1">
                {tabs.map((tab) => (
                  <li key={tab.id}>
                    <Button
                      variant={activeTab === tab.id ? "default" : "ghost"}
                      className={cn(
                        "relative overflow-hidden group px-2 py-1",
                        activeTab === tab.id && "bg-purple-600/50"
                      )}
                      onClick={() => handleTabChange(tab.id, tab.path)}
                    >
                      <div className="flex items-center space-x-1">
                        <tab.icon className="w-3 h-3" />
                        <span className="text-xs">{tab.label}</span>
                      </div>
                      <motion.div
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"
                        initial={false}
                        animate={{ scale: activeTab === tab.id ? 1 : 0 }}
                        transition={{ duration: 0.3 }}
                      />
                    </Button>
                  </li>
                ))}
              </ul>
            </nav>
            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[250px] sm:w-[300px] bg-gray-900 text-white">
                <nav className="flex flex-col space-y-4 mt-8">
                  {tabs.map((tab) => (
                    <Button
                      key={tab.id}
                      variant={activeTab === tab.id ? "default" : "ghost"}
                      className={cn(
                        "justify-start",
                        activeTab === tab.id && "bg-purple-600/50"
                      )}
                      onClick={() => handleTabChange(tab.id, tab.path)}
                    >
                      <div className="flex items-center space-x-2">
                        <tab.icon className="w-4 h-4 mr-2" />
                        <span>{tab.label}</span>
                      </div>
                    </Button>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
            <UserButton 
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8",
                  userButtonAvatarBox: "h-8 w-8",
                },
              }}
            />
          </div>
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="text-center mt-2"
          >
            <AnimatedGradientText className="text-sm md:text-base font-semibold mb-1">
              {activeTab === 'upscaler' ? 'AI Image Upscaler' : 'AI Image Generator'}
            </AnimatedGradientText>
            <p className="text-gray-300 max-w-2xl mx-auto text-xs md:text-sm">
              {activeTab === 'upscaler'
                ? 'Boost your images instantly! Enhance resolution and reveal hidden quality.'
                : 'Turn words into art! Create unique images from your descriptions.'}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </header>
  )
}