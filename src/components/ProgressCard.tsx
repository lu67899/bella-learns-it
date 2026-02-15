import { CircularProgress } from "./CircularProgress";
import { Progress } from "@/components/ui/progress";

interface ProgressCardProps {
  value?: number;
  title?: string;
}

export function ProgressCard({ value = 75, title = "Progresso Geral" }: ProgressCardProps) {
  return (
    <div className="p-4 rounded-xl bg-card border border-border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
            {title}
          </p>
          <p className="text-sm font-medium mt-0.5">
            {Math.round(value)}% completo
          </p>
        </div>
        <CircularProgress value={value} size={44} strokeWidth={3} />
      </div>
      <Progress value={value} className="mt-3" />
    </div>
  );
}
