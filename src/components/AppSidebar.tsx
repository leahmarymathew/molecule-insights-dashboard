import { Atom, LayoutDashboard, FlaskConical, Upload, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavSection } from "@/types";

const NAV: { id: NavSection; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "molecules", label: "Molecules", icon: FlaskConical },
  { id: "upload", label: "Upload Dataset", icon: Upload },
  { id: "reports", label: "Reports", icon: BarChart3 },
];

interface AppSidebarProps {
  activeSection: NavSection;
  onNavigate: (s: NavSection) => void;
  hasData: boolean;
}

export function AppSidebar({ activeSection, onNavigate, hasData }: AppSidebarProps) {
  return (
    <aside className="flex flex-col w-56 shrink-0 border-r border-border/60 bg-sidebar h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 h-14 border-b border-border/60">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary shrink-0">
          <Atom className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-sm font-semibold text-sidebar-foreground tracking-tight">
          MolecuLab
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {NAV.map(({ id, label, icon: Icon }) => {
          const requiresData = id === "molecules" || id === "reports";
          const disabled = requiresData && !hasData;
          const active = activeSection === id;
          return (
            <button
              key={id}
              onClick={() => !disabled && onNavigate(id)}
              disabled={disabled}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-left transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                disabled && "opacity-35 cursor-not-allowed pointer-events-none",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </button>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-border/60 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 shrink-0">
            <span className="text-[10px] font-semibold text-primary">R</span>
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-sidebar-foreground">Dr. R. Kapoor</p>
            <p className="truncate text-xs text-sidebar-foreground/50">Research Lead</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
