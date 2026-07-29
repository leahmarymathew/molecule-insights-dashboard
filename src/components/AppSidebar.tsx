import { Atom, LayoutDashboard, FlaskConical, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavSection } from "@/types";

const NAV: { id: NavSection; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "molecules", label: "Molecules", icon: FlaskConical },
];

interface AppSidebarProps {
  activeSection: NavSection;
  onNavigate: (s: NavSection) => void;
  hasData: boolean;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

export function AppSidebar({
  activeSection,
  onNavigate,
  hasData,
  collapsed,
  onToggleCollapsed,
}: AppSidebarProps) {
  return (
    <aside
      className={cn(
        "flex flex-col shrink-0 border-r border-sidebar-border bg-sidebar h-full transition-[width] duration-150",
        collapsed ? "w-14" : "w-56",
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex items-center h-14 border-b border-sidebar-border",
          collapsed ? "justify-center px-0" : "gap-2.5 px-4",
        )}
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary shrink-0">
          <Atom className="h-4 w-4 text-primary-foreground" />
        </div>
        {!collapsed && (
          <span className="text-sm font-semibold text-sidebar-foreground tracking-tight truncate">
            MolecuLab
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {NAV.map(({ id, label, icon: Icon }) => {
          const requiresData = id === "molecules";
          const disabled = requiresData && !hasData;
          const active = activeSection === id;
          return (
            <button
              key={id}
              onClick={() => !disabled && onNavigate(id)}
              disabled={disabled}
              aria-current={active ? "page" : undefined}
              aria-label={label}
              title={
                disabled
                  ? "Upload a dataset to unlock"
                  : collapsed
                    ? label
                    : undefined
              }
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-left transition-colors",
                collapsed && "justify-center px-0",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                disabled && "opacity-35 cursor-not-allowed pointer-events-none",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && label}
            </button>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className={cn("border-t border-sidebar-border p-2", collapsed && "flex justify-center")}>
        <button
          onClick={onToggleCollapsed}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          className={cn(
            "flex items-center gap-2 rounded-md py-1.5 text-xs text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors",
            collapsed ? "justify-center px-0 w-9" : "w-full px-3",
          )}
        >
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          {!collapsed && "Collapse"}
        </button>
      </div>
    </aside>
  );
}
