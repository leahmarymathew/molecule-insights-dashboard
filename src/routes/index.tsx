import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Atom, FlaskConical, Layers, Database, Bell, Search } from "lucide-react";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/AppSidebar";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { UploadSection } from "@/components/dashboard/UploadSection";
import { ActivityChart } from "@/components/dashboard/ActivityChart";
import { ResultsTable } from "@/components/dashboard/ResultsTable";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { summarize, type DatasetRow } from "@/lib/parseDataset";
import { analyzeMolecules } from "@/lib/analyzeMolecules";

export const Route = createFileRoute("/")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "MolecuLab — Pharmaceutical Molecule Analytics" },
      { name: "description", content: "Dark analytics dashboard for molecular screening, binding affinity, and compound pipeline insights." },
    ],
  }),
});

function Dashboard() {
  const [rows, setRows] = useState<DatasetRow[]>([]);
  const summary = useMemo(() => summarize(rows), [rows]);
  const analytics = useMemo(() => analyzeMolecules(rows), [rows]);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background text-foreground">
        <AppSidebar />
        <SidebarInset className="flex flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-border/60 bg-background/80 px-4 backdrop-blur">
            <SidebarTrigger />
            <div className="relative hidden flex-1 max-w-md md:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search compounds, assays, datasets…" className="h-9 pl-9 bg-secondary/40 border-border/60" />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-4 w-4" />
                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-primary" />
              </Button>
              <Button size="sm" className="font-medium">New Experiment</Button>
            </div>
          </header>

          <main className="flex-1 space-y-6 p-4 md:p-6">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-semibold tracking-tight">Molecule Analytics</h1>
              <p className="text-sm text-muted-foreground">Real-time insights across your discovery pipeline.</p>
            </div>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard label="Total Rows" value={summary.totalRows.toLocaleString()} change={0} icon={Database} hint="parsed records" />
              <KpiCard label="Total Molecules" value={summary.totalMolecules.toLocaleString()} change={0} icon={Atom} hint="unique molecules" />
              <KpiCard label="International Products" value={summary.totalProducts.toLocaleString()} change={0} icon={Layers} hint="unique products" />
              <KpiCard label="Status" value={rows.length ? "Ready" : "Idle"} change={0} icon={FlaskConical} hint={rows.length ? "data loaded" : "awaiting upload"} />
            </section>

            <section className="grid gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <ActivityChart />
              </div>
              <div>
                <UploadSection onParsed={setRows} />
              </div>
            </section>

            <section>
              <ResultsTable data={analytics} />
            </section>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
