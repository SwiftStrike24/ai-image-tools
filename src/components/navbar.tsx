"use client"

import React, { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import {
  NavigationMenu,
  NavigationMenuList,
} from "@/components/ui/navigation-menu"
import Link from "next/link"
import { GiHamburgerMenu } from "react-icons/gi"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet"
import HyperText from "@/components/magicui/hyper-text"
import { X } from "lucide-react"

// Improved NavBar component with added "Enter App" button
export function NavBar() {
  // State management for scroll and component mounting
  const [scrolled, setScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    // Efficient scroll handler with throttling
    const handleScroll = () => {
      window.requestAnimationFrame(() => {
        setScrolled(window.scrollY > 10)
      })
    }

    window.addEventListener("scroll", handleScroll)

    // Cleanup function to remove event listener
    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  // Extracted navigation items for better maintainability
  const navigationItems = [
    { href: "/pricing", label: "Pricing" },
    { href: "/generator", label: "Enter App" },
  ]

  // Main navigation content
  const navContent = (
    <div className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
      <div className={`flex items-center justify-center p-2 w-full ${scrolled ? 'bg-white/50 dark:bg-black/50 backdrop-blur-md' : 'bg-transparent'}`}>
        <div className={`relative flex justify-between w-[95%] md:w-[620px] min-h-[60px] transition-all duration-300`}>
          {/* Background gradient */}
          <div className={`absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl opacity-50 blur-xl ${scrolled ? 'opacity-30' : 'opacity-50'}`}></div>
          
          {/* Main navigation bar content */}
          <div className={`relative z-10 flex items-center justify-between w-full min-h-[60px] p-2 bg-white bg-opacity-10 border border-gray-200 border-opacity-20 rounded-xl shadow-lg backdrop-blur-lg dark:bg-black dark:bg-opacity-10 dark:border-gray-800 transition-all duration-300 ${scrolled ? 'hover:shadow-xl' : 'hover:shadow-2xl'}`}>
            {/* Mobile menu */}
            <Sheet>
              <SheetTrigger className="p-2 transition md:hidden">
                <GiHamburgerMenu className="text-gray-600 dark:text-gray-300" />
              </SheetTrigger>
              <SheetContent side="left" className="bg-white dark:bg-gray-900">
                <SheetHeader>
                  <SheetTitle className="text-gray-900 dark:text-gray-100">FluxScale AI</SheetTitle>
                  <SheetDescription className="text-gray-600 dark:text-gray-400">
                    Supercharge Your Visuals with AI
                  </SheetDescription>
                </SheetHeader>
                <div className="flex flex-col mt-4 space-y-3">
                  <SheetClose asChild>
                    <Link href="/">
                      <Button variant="outline" className="w-full text-black dark:text-black hover:text-white dark:hover:text-white hover:bg-gray-800 dark:hover:bg-gray-800">
                        Home
                      </Button>
                    </Link>
                  </SheetClose>
                  {navigationItems.map((item) => (
                    <SheetClose key={item.href} asChild>
                      <Link href={item.href}>
                        <Button variant="outline" className="w-full text-black dark:text-black hover:text-white dark:hover:text-white hover:bg-gray-800 dark:hover:bg-gray-800">
                          {item.label}
                        </Button>
                      </Link>
                    </SheetClose>
                  ))}
                </div>
                <SheetClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
                  <X className="h-4 w-4 text-white" />
                  <span className="sr-only">Close</span>
                </SheetClose>
              </SheetContent>
            </Sheet>

            {/* Logo */}
            <div className="flex items-center">
              <Link
                href="/"
                className="text-xl font-bold text-gray-800 transition-colors duration-200 hover:text-purple-500 dark:text-gray-200 dark:hover:text-purple-400"
              >
                <HyperText
                  text="FluxScale AI"
                  className="text-2xl font-bold text-purple-500"
                  duration={2000}
                />
              </Link>
            </div>

            {/* Desktop navigation menu */}
            <div className="flex items-center gap-2">
              <NavigationMenu>
                <NavigationMenuList className="hidden md:flex">
                  {navigationItems.map((item) => (
                    <Link key={item.href} href={item.href} className="pl-2">
                      <Button
                        variant="ghost"
                        className="text-gray-600 transition-colors duration-200 hover:text-purple-500 dark:text-gray-300 dark:hover:text-purple-400"
                      >
                        {item.label}
                      </Button>
                    </Link>
                  ))}
                </NavigationMenuList>
              </NavigationMenu>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  // Use createPortal for better performance and to avoid z-index issues
  if (typeof window !== "undefined" && mounted) {
    return createPortal(navContent, document.body)
  }

  return null
}
