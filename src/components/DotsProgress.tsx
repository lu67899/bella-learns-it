import { cn } from "@/lib/utils";

interface DotsProgressProps {
  total: number;
  completed: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: { dot: "h-1.5 w-1.5", gap: "gap-1" },
  md: { dot: "h-2 w-2", gap: "gap-1.5" },
  lg: { dot: "h-2.5 w-2.5", gap: "gap-2" },
};

export function DotsProgress({
  total,
  completed,
  size = "sm",
  className,
}: DotsProgressProps) {
  const { dot, gap } = sizeMap[size];

  return (
    <div className={cn("flex items-center", gap, className)}>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={cn(
            dot,
            "rounded-full transition-all duration-300",
            i < completed
              ? "bg-primary shadow-[0_0_6px_hsl(var(--primary)/0.4)]"
              : "bg-muted-foreground/20"
          )}
        />
      ))}
    </div>
  );
}
