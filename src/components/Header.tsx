import type { NavSection } from "@/types";

const TITLES: Record<NavSection, { title: string; desc: string }> = {
  overview: {
    title: "Overview",
    desc: "Analytics summary and key metrics",
  },
  molecules: {
    title: "Molecules",
    desc: "Browse and filter molecule analytics",
  },
  upload: {
    title: "Upload Dataset",
    desc: "Import IQVIA Excel data for analysis",
  },
  reports: {
    title: "Reports",
    desc: "Export and review analytics reports",
  },
};

export function Header({ activeSection }: { activeSection: NavSection }) {
  const { title, desc } = TITLES[activeSection];
  return (
    <header className="flex items-center h-14 px-6 border-b border-border/60 bg-background shrink-0">
      <div>
        <h1 className="text-sm font-semibold leading-tight text-foreground">{title}</h1>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </header>
  );
}
