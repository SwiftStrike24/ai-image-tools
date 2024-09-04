"use client";

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useWindowSize } from 'react-use'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { id: 'upscaler', label: 'Image Upscaler', path: '/upscaler' },
  { id: 'generator', label: 'Image Generator', path: '/generator' },
]

export default function Header() {
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState(tabs[0].id)
  const { width } = useWindowSize()
  const [indicatorWidth, setIndicatorWidth] = useState(0)
  const [indicatorOffset, setIndicatorOffset] = useState(0)

  useEffect(() => {
    const currentTab = tabs.find(tab => tab.path === pathname) || tabs[0]
    setActiveTab(currentTab.id)
  }, [pathname])

  useEffect(() => {
    const activeElement = document.getElementById(activeTab)
    if (activeElement) {
      setIndicatorWidth(activeElement.offsetWidth)
      setIndicatorOffset(activeElement.offsetLeft)
    }
  }, [activeTab, width])

  return (
    <header className="bg-gray-900 text-white p-4 md:p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-purple-900 opacity-10 blur-3xl"></div>
      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-0">
            <Link href="/" className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
              AI Image Tools
            </Link>
          </h1>
          <nav className="relative">
            <div className="flex space-x-1 bg-gray-800 rounded-lg p-1">
              {tabs.map((tab) => (
                <Link
                  key={tab.id}
                  href={tab.path}
                  id={tab.id}
                  className={`${
                    activeTab === tab.id ? 'text-white' : 'text-gray-400'
                  } relative z-20 px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-opacity-75`}
                  aria-current={activeTab === tab.id ? 'page' : undefined}
                >
                  {tab.label}
                </Link>
              ))}
            </div>
            <motion.div
              className="absolute left-0 bottom-1 top-1 bg-purple-600 rounded-md z-10"
              initial={false}
              animate={{
                width: indicatorWidth,
                x: indicatorOffset,
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          </nav>
        </div>
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="text-center"
        >
          <h2 className="text-xl md:text-2xl font-semibold mb-2">
            {activeTab === 'upscaler' ? 'Enhance Your Images' : 'Create Unique Visuals'}
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto">
            {activeTab === 'upscaler'
              ? 'Upload your images and watch them transform with our AI-powered upscaling technology.'
              : 'Describe your vision, and our AI will bring it to life with stunning, original imagery.'}
          </p>
        </motion.div>
      </div>
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-30 mix-blend-multiply filter blur-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-indigo-700 animate-pulse"></div>
        </div>
      </div>
    </header>
  )
}