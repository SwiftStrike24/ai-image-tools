"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";
import "@/styles/shiny-button.css";

interface ShinyButtonProps extends HTMLMotionProps<"button"> {
  text?: string;
  children?: React.ReactNode;
}

const ShinyButton = ({
  text,
  children,
  className,
  ...props
}: ShinyButtonProps) => {
  return (
    <motion.button
      className={cn(
        "relative rounded-lg px-6 py-2 font-medium text-white bg-black backdrop-blur-xl transition-all duration-300 ease-in-out",
        "hover:shadow-[0_0_20px_rgba(147,51,234,0.5)] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50",
        "before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-r before:from-transparent before:via-purple-500 before:to-transparent before:opacity-0 before:transition-opacity hover:before:opacity-20",
        className
      )}
      {...props}
    >
      <span className="relative block h-full w-full text-sm uppercase tracking-wide shiny-button-text">
        {text || children}
      </span>
      <span className="absolute inset-0 z-10 block rounded-[inherit] bg-[linear-gradient(-75deg,rgba(147,51,234,0.1)_calc(var(--x)+20%),rgba(147,51,234,0.3)_calc(var(--x)+25%),rgba(147,51,234,0.1)_calc(var(--x)+100%))] p-px shiny-button-overlay" />
    </motion.button>
  );
};

export default ShinyButton;
