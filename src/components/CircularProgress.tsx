import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CircularProgressProps {
  value?: number;
  size?: number;
  strokeWidth?: number;
  variant?: "default" | "gradient";
  className?: string;
}

export function CircularProgress({
  value = 0,
  size = 44,
  strokeWidth = 3,
  variant = "default",
  className,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;
  const gradientId = `circular-gradient-${size}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cn("-rotate-90", className)}
    >
      {variant === "gradient" && (
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--accent))" />
          </linearGradient>
        </defs>
      )}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-muted/30"
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={variant === "gradient" ? `url(#${gradientId})` : "currentColor"}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        className={variant === "default" ? "text-primary" : undefined}
      />
    </svg>
  );
}
