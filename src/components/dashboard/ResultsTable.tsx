import { FlaskConical } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function ResultsTable() {
  return (
    <Card className="border-border/60 bg-card/60 backdrop-blur">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-base">Analysis Results</CardTitle>
          <p className="text-xs text-muted-foreground">Recently processed molecule batches</p>
        </div>
        <Button variant="outline" size="sm">Export CSV</Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/60 hover:bg-transparent">
                <TableHead>Compound ID</TableHead>
                <TableHead>SMILES</TableHead>
                <TableHead>MW (g/mol)</TableHead>
                <TableHead>LogP</TableHead>
                <TableHead>Binding (nM)</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={6} className="py-16">
                  <div className="flex flex-col items-center justify-center gap-3 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <FlaskConical className="h-7 w-7" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">No results yet</p>
                      <p className="mt-1 text-xs text-muted-foreground">Upload a dataset to see analysis results here.</p>
                    </div>
                    <Button size="sm" className="mt-2">Run Sample Analysis</Button>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
