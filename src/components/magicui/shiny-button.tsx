"use client";

import { motion, HTMLMotionProps } from "framer-motion";
import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

// Define a custom type that extends HTMLMotionProps for button
type CustomButtonMotionProps = HTMLMotionProps<"button"> & {
  initial?: { [key: string]: string | number };
  animate?: { [key: string]: string | number };
};

const animationProps: CustomButtonMotionProps = {
  initial: { "--x": "100%", scale: 0.8 },
  animate: { "--x": "-100%", scale: 1 },
  whileTap: { scale: 0.95 },
  transition: {
    repeat: Infinity,
    repeatType: "loop",
    repeatDelay: 1,
    type: "spring",
    stiffness: 20,
    damping: 15,
    mass: 2,
    scale: {
      type: "spring",
      stiffness: 200,
      damping: 5,
      mass: 0.5,
    },
  },
};

interface ShinyButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  text: string | React.ReactNode;
  className?: string;
}

const ShinyButton = ({
  text,
  className,
  ...props
}: ShinyButtonProps) => {
  return (
    <motion.button
      {...animationProps as any}
      className={cn(
        "relative rounded-lg px-6 py-2 font-medium backdrop-blur-xl transition-[box-shadow] duration-300 ease-in-out hover:shadow dark:bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/10%)_0%,transparent_60%)] dark:hover:shadow-[0_0_20px_hsl(var(--primary)/10%)]",
        className,
      )}
      {...props}
    >
      <span
        className="relative block h-full w-full text-sm uppercase tracking-wide text-[rgb(0,0,0,65%)] dark:font-light dark:text-[rgb(255,255,255,90%)] shiny-button-text"
      >
        {text}
      </span>
      <span
        className="absolute inset-0 z-10 block rounded-[inherit] bg-[linear-gradient(-75deg,hsl(var(--primary)/10%)_calc(var(--x)+20%),hsl(var(--primary)/50%)_calc(var(--x)+25%),hsl(var(--primary)/10%)_calc(var(--x)+100%))] p-px shiny-button-overlay"
      ></span>
    </motion.button>
  );
};

export default ShinyButton;
