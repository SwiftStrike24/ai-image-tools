"use client";

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWindowSize } from 'react-use'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from "@/lib/utils"
import { UserButton } from '@clerk/nextjs'
import { Sparkles, Zap } from 'lucide-react'
import RetroGrid from "@/components/magicui/retro-grid"

const tabs = [
  { id: 'upscaler', label: 'Image Upscaler', path: '/upscaler', icon: Zap },
  { id: 'generator', label: 'Image Generator', path: '/generator', icon: Sparkles },
]

export default function HeaderClient() {
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState(tabs[0].id)
  const { width } = useWindowSize()
  const [indicatorWidth, setIndicatorWidth] = useState(0)
  const [indicatorOffset, setIndicatorOffset] = useState(0)
  const [prevIndicatorOffset, setPrevIndicatorOffset] = useState(0)

  useEffect(() => {
    const currentTab = tabs.find(tab => tab.path === pathname) || tabs[0]
    setActiveTab(currentTab.id)
  }, [pathname])

  const updateIndicator = useCallback(() => {
    const activeElement = document.getElementById(activeTab)
    if (activeElement) {
      setPrevIndicatorOffset(indicatorOffset)
      setIndicatorWidth(activeElement.offsetWidth)
      setIndicatorOffset(activeElement.offsetLeft)
    }
  }, [activeTab, indicatorOffset])

  useEffect(() => {
    updateIndicator()
    window.addEventListener('resize', updateIndicator)
    return () => window.removeEventListener('resize', updateIndicator)
  }, [activeTab, width, updateIndicator])

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab)
  }

  return (
    <header className="bg-gradient-to-br from-gray-900 to-purple-900 text-white p-3 md:p-4 relative overflow-hidden">
      <RetroGrid className="absolute inset-0 z-0 opacity-30" />
      <div className="absolute inset-0 bg-purple-900/50 backdrop-blur-xl"></div>
      <div className="relative z-20 max-w-7xl mx-auto">
        <div className="flex justify-between items-center">
          <motion.h1 
            className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 md:mb-0"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Link href="/" className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600 hover:from-pink-600 hover:to-purple-400 transition-all duration-300">
              FluxScale AI
            </Link>
          </motion.h1>
          <div className="flex items-center space-x-4">
            <nav className="relative">
              <div className="flex space-x-2 bg-gray-800/50 backdrop-blur-md rounded-lg p-1">
                {tabs.map((tab) => (
                  <Link
                    key={tab.id}
                    href={tab.path}
                    id={tab.id}
                    className={cn(
                      "relative z-20 px-3 py-2 text-xs md:text-sm font-medium rounded-md transition-colors duration-200 flex items-center",
                      activeTab === tab.id 
                        ? "text-white bg-purple-600/50" 
                        : "text-gray-300 hover:text-purple-300 hover:bg-purple-600/20"
                    )}
                    aria-current={activeTab === tab.id ? 'page' : undefined}
                    onClick={() => handleTabChange(tab.id)}
                  >
                    <tab.icon className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                    <span className="hidden md:inline">{tab.label}</span>
                    <span className="md:hidden">{tab.label.split(' ')[1]}</span>
                  </Link>
                ))}
              </div>
              <AnimatePresence initial={false}>
                <motion.div
                  key={activeTab}
                  className="absolute left-0 bottom-1 top-1 bg-purple-600/50 rounded-md z-10"
                  initial={{ 
                    width: indicatorWidth, 
                    x: prevIndicatorOffset,
                    opacity: 0
                  }}
                  animate={{
                    width: indicatorWidth,
                    x: indicatorOffset,
                    opacity: 1
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ 
                    type: 'spring', 
                    stiffness: 300, 
                    damping: 30,
                    opacity: { duration: 0.2 }
                  }}
                />
              </AnimatePresence>
            </nav>
            <UserButton 
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8 md:h-10 md:w-10",
                  userButtonAvatarBox: "h-8 w-8 md:h-10 md:w-10",
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
            className="text-center"
          >
            <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold mb-2 md:mb-4 text-purple-300">
              {activeTab === 'upscaler' ? 'AI Image Upscaler' : 'AI Image Generator'}
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto text-sm md:text-base lg:text-lg">
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