import type { NavSection } from "@/types";

const TITLES: Record<NavSection, { title: string; desc: string }> = {
  overview: { title: "Overview", desc: "Key metrics and dataset summary" },
  molecules: { title: "Molecules", desc: "Browse, filter, and export molecule analytics" },
};

export function Header({ activeSection }: { activeSection: NavSection }) {
  const { title, desc } = TITLES[activeSection];
  return (
    <header className="flex items-center h-12 px-6 border-b border-border shrink-0">
      <div>
        <h1 className="text-sm font-semibold leading-tight text-foreground">{title}</h1>
        <p className="text-[11px] text-muted-foreground/70 leading-tight">{desc}</p>
      </div>
    </header>
  );
}
