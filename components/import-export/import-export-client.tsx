"use client";

import { useState } from "react";
import Papa from "papaparse";
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { createProspectAction } from "@/lib/actions/prospects";
import { detectProspectDuplicate } from "@/lib/utils/duplicates";

export function ImportExportClient({
  existingProspects,
  canExport = true,
}: {
  existingProspects: any[];
  canExport?: boolean;
}) {
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [duplicateReports, setDuplicateReports] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<{ imported: number; duplicates: number } | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportSummary(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as any[];
        setParsedRows(rows);

        // Run duplicate detection
        const dupes = rows.map((row) => {
          const name = row.name || row["Company Name"] || row.company || "";
          const website = row.website || row.Website || row.url || "";
          const phone = row.phone || row.Phone || "";
          const city = row.city || row.City || "";

          return detectProspectDuplicate(
            { name, website, phone, city },
            existingProspects
          );
        });

        setDuplicateReports(dupes);
      },
    });
  };

  const handleExecuteImport = async () => {
    if (parsedRows.length === 0) return;
    setIsImporting(true);

    let importedCount = 0;
    let dupesCount = 0;

    for (let i = 0; i < parsedRows.length; i++) {
      const row = parsedRows[i];
      const dupe = duplicateReports[i];

      const name = row.name || row["Company Name"] || row.company || "";
      if (!name) continue;

      if (dupe?.isDuplicate) {
        dupesCount++;
        continue; // Skip duplicate or handle according to workspace policy
      }

      await createProspectAction({
        name,
        niche: row.niche || row.Niche || row.category || "",
        website: row.website || row.Website || "",
        city: row.city || row.City || "",
        state: row.state || row.State || "",
        phone: row.phone || row.Phone || "",
        mainOpportunity: row.opportunity || row["Main Opportunity"] || "",
        notes: row.notes || row.Notes || "Imported from CSV",
        dealValue: row.value || row["Deal Value"] || "10000",
      });
      importedCount++;
    }

    setImportSummary({ imported: importedCount, duplicates: dupesCount });
    setParsedRows([]);
    setDuplicateReports([]);
    setIsImporting(false);
  };

  const handleExportCSV = () => {
    if (existingProspects.length === 0) return;

    // Formula injection mitigation (escape leading =, +, -, @)
    const sanitizedData = existingProspects.map((p) => {
      const sanitize = (val: any) => {
        if (typeof val === "string" && /^[=+\-@]/.test(val)) {
          return `'${val}`;
        }
        return val;
      };

      return {
        "Company Name": sanitize(p.name),
        "Industry / Niche": sanitize(p.niche),
        Website: sanitize(p.website),
        City: sanitize(p.city),
        State: sanitize(p.state),
        Phone: sanitize(p.phone),
        "Lead Score": p.leadScore,
        "Lead Grade": p.leadGrade,
        "Deal Value": p.dealValue,
        "Main Opportunity": sanitize(p.mainOpportunity),
      };
    });

    const csv = Papa.unparse(sanitizedData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `prospectforge-export-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            CSV Import & Safe Export Engine
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Import bulk prospect lists with automatic duplicate detection and export filtered data safely.
          </p>
        </div>

        {canExport && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportCSV}
            className="text-xs gap-1.5 font-semibold"
          >
            <Download className="h-3.5 w-3.5" />
            Export Workspace CSV
          </Button>
        )}
      </div>

      {importSummary && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            <div className="text-xs">
              <span className="font-bold text-foreground">Import Complete! </span>
              <span className="text-emerald-300">
                Successfully imported {importSummary.imported} new prospects. ({importSummary.duplicates} duplicates protected/skipped).
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Upload Box */}
      <div className="rounded-2xl border-2 border-dashed border-border/80 bg-card/40 p-8 text-center backdrop-blur-md space-y-4">
        <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto">
          <Upload className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-foreground">
            Upload CSV Prospect File
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Supports standard columns: Company Name, Website, City, Niche, Phone, Opportunity.
          </p>
        </div>
        <div>
          <label className="inline-flex">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              type="button"
              variant="gradient"
              size="sm"
              className="gap-2 cursor-pointer font-semibold shadow-md shadow-indigo-500/20"
              onClick={() => {
                const input = document.querySelector('input[type="file"]') as HTMLInputElement;
                input?.click();
              }}
            >
              <FileSpreadsheet className="h-4 w-4" />
              Select CSV File
            </Button>
          </label>
        </div>
      </div>

      {/* CSV Preview & Duplicate Warnings Table */}
      {parsedRows.length > 0 && (
        <div className="rounded-2xl border border-border/60 bg-card/70 backdrop-blur-md overflow-hidden shadow-sm space-y-4 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Preview Rows ({parsedRows.length} parsed)
              </h3>
              <p className="text-xs text-muted-foreground">
                Duplicate detection algorithms reviewed matches against existing workspace records.
              </p>
            </div>

            <Button
              size="sm"
              variant="gradient"
              onClick={handleExecuteImport}
              disabled={isImporting}
              className="text-xs font-semibold gap-1.5"
            >
              {isImporting ? "Importing..." : "Confirm & Import Valid Rows"}
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="overflow-x-auto max-h-96">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Website</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Duplicate Status</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {parsedRows.map((row, idx) => {
                  const dupe = duplicateReports[idx];
                  const name = row.name || row["Company Name"] || row.company || "—";
                  const website = row.website || row.Website || "—";
                  const city = row.city || row.City || "—";

                  return (
                    <TableRow key={idx}>
                      <TableCell className="font-semibold text-xs text-foreground">
                        {name}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {website}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {city}
                      </TableCell>
                      <TableCell>
                        {dupe?.isDuplicate ? (
                          <div className="flex items-center gap-1.5 text-amber-400 text-xs">
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                            <span>
                              Possible Duplicate ({dupe.reason})
                            </span>
                          </div>
                        ) : (
                          <Badge variant="success" className="text-[10px]">
                            Ready to Import
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
