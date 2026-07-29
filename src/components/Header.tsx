import type { NavSection } from "@/types";

const TITLES: Record<NavSection, { title: string; desc: string }> = {
  overview: { title: "Overview", desc: "Key metrics and dataset summary" },
  molecules: { title: "Molecules", desc: "Browse, filter, and export molecule analytics" },
};

export function Header({ activeSection }: { activeSection: NavSection }) {
  const { title, desc } = TITLES[activeSection];
  return (
    <header className="flex items-center h-14 px-6 border-b border-border shrink-0">
      <div>
        <h1 className="text-base font-semibold leading-tight text-foreground">{title}</h1>
        <p className="text-xs text-muted-foreground leading-tight mt-0.5">{desc}</p>
      </div>
    </header>
  );
}
