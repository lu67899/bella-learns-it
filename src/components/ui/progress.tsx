import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/lib/utils";

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  variant?: "default" | "gradient";
  animated?: boolean;
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, variant = "default", animated = false, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn("relative h-2 w-full overflow-hidden rounded-full bg-secondary/50", className)}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn(
        "h-full w-full flex-1 rounded-full transition-all duration-500 ease-out",
        animated && "animate-pulse-glow"
      )}
      style={{
        transform: `translateX(-${100 - (value || 0)}%)`,
        background:
          variant === "gradient"
            ? "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)), hsl(var(--primary)))"
            : "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))",
        backgroundSize: variant === "gradient" ? "200% 100%" : undefined,
        boxShadow:
          (value || 0) > 0
            ? "0 0 12px hsl(var(--primary) / 0.4), 0 0 4px hsl(var(--accent) / 0.3)"
            : "none",
      }}
    />
  </ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
