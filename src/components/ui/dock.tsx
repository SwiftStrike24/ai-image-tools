"use client";

import React, { PropsWithChildren, useRef, useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { cva, type VariantProps } from "class-variance-authority";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  AnimatePresence,
} from "framer-motion";

import { cn } from "@/lib/utils";

export interface DockProps extends VariantProps<typeof dockVariants> {
  className?: string;
  magnification?: number;
  distance?: number;
  direction?: "top" | "middle" | "bottom";
  children: React.ReactNode;
}

const DEFAULT_MAGNIFICATION = 60;
const DEFAULT_DISTANCE = 140;

const dockVariants = cva(
  "fixed bottom-0 left-0 right-0 w-full flex justify-center items-end p-2 sm:p-4 z-50",
);

const Dock = React.forwardRef<HTMLDivElement, DockProps>(
  (
    {
      className,
      children,
      magnification = DEFAULT_MAGNIFICATION,
      distance = DEFAULT_DISTANCE,
      direction = "bottom",
      ...props
    },
    ref,
  ) => {
    const mouseX = useMotionValue(Infinity);
    const [sizes, setSizes] = useState({
      baseSize: 40,
      magnification: magnification,
      distance: distance,
    });

    useEffect(() => {
      const handleResize = () => {
        const width = window.innerWidth;
        if (width < 640) {
          // Small screens
          setSizes({
            baseSize: 30,
            magnification: 45,
            distance: 100,
          });
        } else if (width < 1024) {
          // Medium screens
          setSizes({
            baseSize: 40,
            magnification: 60,
            distance: 140,
          });
        } else {
          // Large screens
          setSizes({
            baseSize: 50,
            magnification: 70,
            distance: 180,
          });
        }
      };

      handleResize(); // Set initial sizes
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, []);

    const renderChildren = () => {
      return React.Children.map(children, (child: any) => {
        return React.cloneElement(child, {
          mouseX: mouseX,
          baseSize: sizes.baseSize,
          magnification: sizes.magnification,
          distance: sizes.distance,
        });
      });
    };

    const dockContent = (
      <motion.div
        ref={ref}
        onMouseMove={(e) => mouseX.set(e.pageX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        {...props}
        className={cn(dockVariants({ className }))}
      >
        <motion.div className="flex gap-1 sm:gap-0.1 p-1 sm:p-2 rounded-2xl border supports-backdrop-blur:bg-white/10 supports-backdrop-blur:dark:bg-black/10 backdrop-blur-md">
          {renderChildren()}
        </motion.div>
      </motion.div>
    );

    if (typeof window !== "undefined") {
      return ReactDOM.createPortal(dockContent, document.body);
    } else {
      return null;
    }
  },
);

Dock.displayName = "Dock";

export interface DockIconProps {
  baseSize?: number;
  magnification?: number;
  distance?: number;
  mouseX?: any;
  className?: string;
  children?: React.ReactNode;
  onClick?: () => void;
  label: string;
  props?: PropsWithChildren;
}

const DockIcon = ({
  baseSize = 40,
  magnification = DEFAULT_MAGNIFICATION,
  distance = DEFAULT_DISTANCE,
  mouseX,
  className,
  children,
  onClick,
  label,
  ...props
}: DockIconProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const distanceCalc = useTransform(mouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  let widthSync = useTransform(
    distanceCalc,
    [-distance, 0, distance],
    [baseSize, magnification, baseSize],
  );

  let width = useSpring(widthSync, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  const scale = useSpring(
    useTransform(width, [baseSize, magnification], [1, 1.3]),
    {
      mass: 0.1,
      stiffness: 150,
      damping: 12,
    },
  );

  return (
    <motion.div
      ref={ref}
      style={{ width }}
      className={cn(
        "flex flex-col items-center justify-end cursor-pointer",
        "px-1 sm:px-2",
        className,
      )}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.8 }}
            transition={{
              duration: 0.2,
              type: "spring",
              stiffness: 200,
              damping: 20,
            }}
            className="absolute bottom-full mb-1 sm:mb-2 px-2 py-1 bg-gray-800 text-white text-xs sm:text-sm rounded-md whitespace-nowrap shadow-lg"
          >
            {label}
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div
        className="flex items-center justify-center relative"
        style={{ scale }}
      >
        <motion.div
          className="absolute bottom-0 w-full h-1/2 bg-gradient-to-b from-transparent to-black/20 rounded-b-full blur-sm"
          style={{ scale: useTransform(scale, [1, 1.3], [0, 1]) }}
        />
        {children}
      </motion.div>
      <motion.div
        className="w-6 h-0.5 sm:w-8 sm:h-1 bg-gray-400 rounded-full mt-1"
        style={{
          scaleX: useTransform(scale, [1, 1.3], [0.3, 1]),
          opacity: useTransform(scale, [1, 1.3], [0.6, 1]),
        }}
      />
    </motion.div>
  );
};

DockIcon.displayName = "DockIcon";

export { Dock, DockIcon, dockVariants };
