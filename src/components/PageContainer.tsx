import { cn } from "@/lib/utils";
import { usePageSize } from "@/hooks/usePageSize";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  const { pageSize } = usePageSize();

  return (
    <div className={cn(
      "mx-auto px-4 pb-20",
      pageSize === "large" ? "max-w-5xl" : "max-w-2xl",
      className
    )}>
      {children}
    </div>
  );
}
