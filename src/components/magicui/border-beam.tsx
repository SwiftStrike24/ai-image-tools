import { cn } from "@/lib/utils";

interface BorderBeamProps {
  className?: string;
  size?: number;
  duration?: number;
  borderWidth?: number;
  anchor?: number;
  colorFrom?: string;
  colorTo?: string;
  delay?: number;
}

export const BorderBeam = ({
  className,
  size = 200,
  duration = 15,
  anchor = 90,
  borderWidth = 1.5,
  colorFrom = "#ffaa40",
  colorTo = "#9c40ff",
  delay = 0,
}: BorderBeamProps) => {
  return (
    <div
      data-size={size}
      data-duration={duration}
      data-anchor={anchor}
      data-border-width={borderWidth}
      data-color-from={colorFrom}
      data-color-to={colorTo}
      data-delay={`-${delay}s`}
      className={cn(
        "pointer-events-none absolute inset-0 rounded-[inherit] [border:calc(var(--border-width)*1px)_solid_transparent]",
        "![mask-clip:padding-box,border-box] ![mask-composite:intersect] [mask:linear-gradient(transparent,transparent),linear-gradient(white,white)]",
        "after:absolute after:aspect-square after:w-[calc(var(--size)*1px)] after:animate-border-beam after:[animation-delay:var(--delay)] after:[background:linear-gradient(to_left,var(--color-from),var(--color-to),transparent)] after:[offset-anchor:calc(var(--anchor)*1%)_50%] after:[offset-path:rect(0_auto_auto_0_round_calc(var(--size)*1px))]",
        "before:absolute before:aspect-square before:w-[calc(var(--size)*0.8px)] before:animate-border-beam-reverse before:[animation-delay:calc(var(--delay)+0.5s)] before:[background:linear-gradient(to_right,var(--color-to),var(--color-from),transparent)] before:[offset-anchor:calc(100%-var(--anchor)*1%)_50%] before:[offset-path:rect(0_auto_auto_0_round_calc(var(--size)*0.8px))]",
        "border-beam",
        className
      )}
    />
  );
};
