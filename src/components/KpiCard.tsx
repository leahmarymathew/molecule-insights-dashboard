import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  hint?: string;
  highlight?: "green" | "red" | "amber";
}

const highlightClass: Record<string, string> = {
  green: "text-emerald-400",
  red: "text-red-400",
  amber: "text-amber-400",
};

export function KpiCard({ label, value, icon: Icon, hint, highlight }: KpiCardProps) {
  return (
    <div className="rounded-lg border border-border/60 bg-card p-4 transition hover:border-border">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div
        className={cn(
          "text-2xl font-bold tabular-nums",
          highlight ? highlightClass[highlight] : "text-foreground",
        )}
      >
        {value}
      </div>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
