import { cn } from "@/lib/utils";

interface SegmentProgressProps {
  value: number;
  segments?: number;
  className?: string;
}

export function SegmentProgress({
  value = 0,
  segments = 5,
  className,
}: SegmentProgressProps) {
  const filledSegments = Math.round((Math.min(100, Math.max(0, value)) / 100) * segments);

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {Array.from({ length: segments }, (_, i) => (
        <div
          key={i}
          className={cn(
            "h-1.5 flex-1 rounded-full transition-all duration-300",
            i < filledSegments
              ? "bg-primary shadow-[0_0_6px_hsl(var(--primary)/0.3)]"
              : "bg-muted-foreground/20"
          )}
        />
      ))}
    </div>
  );
}
