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
  green: "text-emerald-600",
  red: "text-red-600",
  amber: "text-amber-600",
};

export function KpiCard({ label, value, icon: Icon, hint, highlight }: KpiCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 transition hover:shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div
        title={value}
        className={cn(
          "text-2xl font-bold tabular-nums truncate",
          highlight ? highlightClass[highlight] : "text-foreground",
        )}
      >
        {value}
      </div>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
