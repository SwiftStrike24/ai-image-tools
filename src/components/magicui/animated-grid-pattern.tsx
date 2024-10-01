"use client";

import { useEffect, useId, useRef, useState, useMemo } from "react";
import { motion, useAnimation } from "framer-motion";
import { cn } from "@/lib/utils";

interface GridPatternProps {
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  strokeDasharray?: any;
  numSquares?: number;
  className?: string;
  maxOpacity?: number;
  duration?: number;
  repeatDelay?: number;
}

export function GridPattern({
  width = 40,
  height = 40,
  x = -1,
  y = -1,
  strokeDasharray = 0,
  numSquares = 50,
  className,
  maxOpacity = 0.5,
  duration = 4,
  repeatDelay = 0.5,
  ...props
}: GridPatternProps) {
  const id = useId();
  const containerRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [hoveredSquare, setHoveredSquare] = useState<number | null>(null);

  const getPos = useMemo(() => () => [
    Math.floor(Math.random() * (dimensions.width / width)),
    Math.floor(Math.random() * (dimensions.height / height)),
  ], [dimensions.width, dimensions.height, width, height]);

  const generateSquares = useMemo(() => (count: number) => 
    Array.from({ length: count }, (_, i) => ({
      id: i,
      pos: getPos(),
      delay: Math.random() * 4,
      duration: 2 + Math.random() * 2,
    }))
  , [getPos]);

  const [squares, setSquares] = useState(() => generateSquares(numSquares));

  useEffect(() => {
    if (dimensions.width && dimensions.height) {
      setSquares(generateSquares(numSquares));
    }
  }, [dimensions, numSquares, generateSquares]);

  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
    };
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden">
      <svg
        ref={containerRef}
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 h-[200%] w-full",
          "animate-move-up",
          className
        )}
        {...props}
      >
        <defs>
          <pattern
            id={id}
            width={width}
            height={height}
            patternUnits="userSpaceOnUse"
            x={x}
            y={y}
          >
            <path
              d={`M.5 ${height}V.5H${width}`}
              fill="none"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${id})`} />
        <svg x={x} y={y} className="overflow-visible">
          {squares.map(({ pos: [x, y], id, delay, duration }) => (
            <motion.rect
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: hoveredSquare === id ? [0, 1, 0] : [0, maxOpacity, 0],
                scale: hoveredSquare === id ? [1, 1.2, 1] : 1,
              }}
              transition={{
                duration: hoveredSquare === id ? duration / 2 : duration,
                repeat: Infinity,
                repeatDelay: delay,
                ease: "easeInOut",
                times: [0, 0.5, 1],
              }}
              key={`${x}-${y}-${id}`}
              width={width - 1}
              height={height - 1}
              x={x * width + 1}
              y={y * height + 1}
              fill={hoveredSquare === id ? "rgba(255, 255, 255, 0.3)" : "rgba(255, 255, 255, 0.1)"}
              strokeWidth="0"
              onMouseEnter={() => setHoveredSquare(id)}
              onMouseLeave={() => setHoveredSquare(null)}
              style={{ pointerEvents: "all" }}
            />
          ))}
        </svg>
      </svg>
    </div>
  );
}

export default GridPattern;
