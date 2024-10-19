"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from "@/lib/utils"

interface LoadingBeamProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean
  loadingText?: string
  waveColor?: string
  waveSpeed?: number
  waveWidth?: number
}

export const LoadingBeam: React.FC<LoadingBeamProps> = ({
  children,
  isLoading = false,
  loadingText = 'Loading...',
  waveColor = 'white',
  waveSpeed = 1.5,
  waveWidth = 100,
  className,
  disabled,
  ...props
}) => {
  return (
    <button
      className={cn(
        "relative overflow-hidden rounded-md bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2",
        isLoading && "cursor-not-allowed",
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <motion.div
          className="absolute inset-0 z-10"
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{
            repeat: Infinity,
            repeatType: "loop",
            duration: waveSpeed,
            ease: "linear",
          }}
        >
          <div
            className={cn(
              "h-full opacity-25",
              `w-[${waveWidth}%]`
            )}
            style={{
              background: `linear-gradient(90deg, transparent 0%, ${waveColor} 50%, transparent 100%)`,
            }}
          />
        </motion.div>
      )}
      <span className={cn("relative z-20", isLoading && "invisible")}>
        {children}
      </span>
      {isLoading && (
        <span className="absolute inset-0 z-30 flex items-center justify-center">
          {loadingText}
        </span>
      )}
    </button>
  )
}
