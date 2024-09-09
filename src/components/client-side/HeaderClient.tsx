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
  const [slideDirection, setSlideDirection] = useState(1)

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

  const getSlideDirection = (newTab: string) => {
    const currentIndex = tabs.findIndex(tab => tab.id === activeTab)
    const newIndex = tabs.findIndex(tab => tab.id === newTab)
    return newIndex > currentIndex ? 1 : -1
  }

  const handleTabChange = (newTab: string) => {
    setSlideDirection(getSlideDirection(newTab))
    setActiveTab(newTab)
  }

  return (
    <header className="bg-gradient-to-br from-gray-900 to-purple-900 text-white p-6 relative overflow-hidden">
      <RetroGrid className="absolute inset-0 z-0 opacity-30" />
      <div className="absolute inset-0 bg-purple-900/50 backdrop-blur-xl"></div>
      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <motion.h1 
            className="text-3xl md:text-4xl font-bold mb-6 md:mb-0"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
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
                      "relative z-20 px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 flex items-center",
                      activeTab === tab.id 
                        ? "text-white bg-purple-600/50" 
                        : "text-gray-300 hover:text-purple-300 hover:bg-purple-600/20"
                    )}
                    aria-current={activeTab === tab.id ? 'page' : undefined}
                    onClick={() => handleTabChange(tab.id)}
                  >
                    <tab.icon className="w-4 h-4 mr-2" />
                    {tab.label}
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
                  avatarBox: "h-10 w-10",
                  userButtonAvatarBox: "h-10 w-10",
                },
              }}
            />
          </div>
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            <h2 className="text-2xl md:text-3xl font-semibold mb-4 text-purple-300">
              {activeTab === 'upscaler' ? 'AI Image Upscaler' : 'AI Image Generator'}
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto text-lg">
              {activeTab === 'upscaler'
                ? 'Enhance your images with Real-ESRGAN technology. Upscale, sharpen, and bring out details in your visuals with advanced AI.'
                : 'Create stunning, high-resolution images from text prompts using FLUX.1 AI. Transform your ideas into visual masterpieces.'}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </header>
  )
}