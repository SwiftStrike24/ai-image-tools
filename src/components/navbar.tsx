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

export function NavBar() {
  const [scrolled, setScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)

    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  const navContent = (
    <div className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
      <div className={`flex items-center justify-center p-2 w-full ${scrolled ? 'bg-white/50 dark:bg-black/50 backdrop-blur-md' : 'bg-transparent'}`}>
        <div className={`relative flex justify-between w-[95%] md:w-[620px] min-h-[60px] transition-all duration-300`}>
          <div className={`absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl opacity-50 blur-xl ${scrolled ? 'opacity-30' : 'opacity-50'}`}></div>
          <div className={`relative z-10 flex items-center justify-between w-full min-h-[60px] p-2 bg-white bg-opacity-10 border border-gray-200 border-opacity-20 rounded-xl shadow-lg backdrop-blur-lg dark:bg-black dark:bg-opacity-10 dark:border-gray-800 transition-all duration-300 ${scrolled ? 'hover:shadow-xl' : 'hover:shadow-2xl'}`}>
            <Sheet>
              <SheetTrigger className="p-2 transition md:hidden">
                <GiHamburgerMenu className="text-gray-600 dark:text-gray-300" />
              </SheetTrigger>
              <SheetContent side="left">
                <SheetHeader>
                  <SheetTitle>FluxScale AI</SheetTitle>
                  <SheetDescription>
                    Scaling your AI solutions with ease
                  </SheetDescription>
                </SheetHeader>
                <div className="flex flex-col mt-4 space-y-3">
                  <SheetClose asChild>
                    <Link href="/">
                      <Button variant="outline" className="w-full">
                        Home
                      </Button>
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link href="/pricing">
                      <Button variant="outline" className="w-full">
                        Pricing
                      </Button>
                    </Link>
                  </SheetClose>
                </div>
              </SheetContent>
            </Sheet>
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
            <div className="flex items-center gap-2">
              <NavigationMenu>
                <NavigationMenuList className="hidden md:flex">
                  <Link href="/pricing" className="pl-2">
                    <Button
                      variant="ghost"
                      className="text-gray-600 transition-colors duration-200 hover:text-purple-500 dark:text-gray-300 dark:hover:text-purple-400"
                    >
                      Pricing
                    </Button>
                  </Link>
                </NavigationMenuList>
              </NavigationMenu>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  if (typeof window !== "undefined" && mounted) {
    return createPortal(navContent, document.body)
  }

  return null
}