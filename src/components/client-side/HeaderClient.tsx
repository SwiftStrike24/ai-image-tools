"use client";

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWindowSize } from 'react-use'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from "@/lib/utils"
import { UserButton } from '@clerk/nextjs'

const tabs = [
  { id: 'upscaler', label: 'Image Upscaler', path: '/upscaler' },
  { id: 'generator', label: 'Image Generator', path: '/generator' },
]

export default function HeaderClient() {  // Changed from Header to HeaderClient
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
      <div className="absolute inset-0 bg-purple-900 opacity-10 blur-3xl"></div>
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
              <div className="flex space-x-2 bg-gray-800 rounded-lg p-1">
                {tabs.map((tab) => (
                  <Link
                    key={tab.id}
                    href={tab.path}
                    id={tab.id}
                    className={cn(
                      "relative z-20 px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200",
                      activeTab === tab.id 
                        ? "text-white" 
                        : "text-gray-400 hover:text-purple-300"
                    )}
                    aria-current={activeTab === tab.id ? 'page' : undefined}
                    onClick={() => handleTabChange(tab.id)}
                  >
                    {tab.label}
                  </Link>
                ))}
              </div>
              <AnimatePresence initial={false}>
                <motion.div
                  key={activeTab}
                  className="absolute left-0 bottom-1 top-1 bg-purple-600 rounded-md z-10"
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
            initial={{ opacity: 0, x: slideDirection * 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: slideDirection * -50 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            <h2 className="text-2xl md:text-3xl font-semibold mb-4 text-purple-300">
              {activeTab === 'upscaler' ? 'Advanced Image Enhancement' : 'AI-Powered Visual Creation'}
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto text-lg">
              {activeTab === 'upscaler'
                ? 'Elevate your images with cutting-edge AI upscaling technology, bringing unparalleled clarity and detail to your visuals.'
                : 'Transform your ideas into stunning, high-resolution imagery using state-of-the-art AI generation techniques.'}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-30 mix-blend-multiply filter blur-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-indigo-700 animate-pulse"></div>
        </div>
      </div>
    </header>
  )
}