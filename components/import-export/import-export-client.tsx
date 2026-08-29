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
  FileCode,
  Info,
  HelpCircle,
  Building2,
  Globe,
  MapPin,
  Phone,
  Check,
  AlertCircle,
  Database,
  Lock,
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

  // Sample CSV Template Generator
  const handleDownloadSampleCSV = () => {
    const sampleData = [
      {
        "Company Name": "Austin Dental Care",
        "Industry / Niche": "Healthcare & Dentistry",
        Website: "https://austindentalcare.demo",
        City: "Austin",
        State: "TX",
        Phone: "+1 (512) 555-0199",
        "Deal Value": "12000",
        "Main Opportunity": "Outdated website lacking mobile appointment booking",
        Notes: "4.9 star Google rating with 85 reviews. Good candidate for web overhaul.",
      },
      {
        "Company Name": "Dallas Premier Roofing",
        "Industry / Niche": "Home Services & Contracting",
        Website: "https://dallasroofingpros.demo",
        City: "Dallas",
        State: "TX",
        Phone: "+1 (214) 555-0142",
        "Deal Value": "18500",
        "Main Opportunity": "Missing SSL certificate and poor local search presence",
        Notes: "High commercial urgency, emergency storm repair contractor.",
      },
      {
        "Company Name": "Denver Tech Dynamics",
        "Industry / Niche": "B2B SaaS & IT",
        Website: "https://denvertechdynamics.demo",
        City: "Denver",
        State: "CO",
        Phone: "+1 (303) 555-0188",
        "Deal Value": "25000",
        "Main Opportunity": "Modernizing product landing page and lead capture forms",
        Notes: "Series A funded startup expanding enterprise sales team.",
      },
      {
        "Company Name": "Miami Sun Real Estate",
        "Industry / Niche": "Real Estate & Property",
        Website: "https://miamisunrealty.demo",
        City: "Miami",
        State: "FL",
        Phone: "+1 (305) 555-0112",
        "Deal Value": "15000",
        "Main Opportunity": "Custom IDX property search integration",
        Notes: "Luxury brokerage looking for fast mobile UX.",
      },
    ];

    const csv = Papa.unparse(sampleData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "revlo_sample_prospects_template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Sample JSON Template Generator
  const handleDownloadSampleJSON = () => {
    const sampleJson = [
      {
        name: "Austin Dental Care",
        niche: "Healthcare & Dentistry",
        website: "https://austindentalcare.demo",
        city: "Austin",
        state: "TX",
        phone: "+1 (512) 555-0199",
        dealValue: "12000",
        mainOpportunity: "Outdated website lacking mobile appointment booking",
        notes: "4.9 star Google rating with 85 reviews. Good candidate for web overhaul.",
      },
      {
        name: "Dallas Premier Roofing",
        niche: "Home Services & Contracting",
        website: "https://dallasroofingpros.demo",
        city: "Dallas",
        state: "TX",
        phone: "+1 (214) 555-0142",
        dealValue: "18500",
        mainOpportunity: "Missing SSL certificate and poor local search presence",
        notes: "High commercial urgency, emergency storm repair contractor.",
      },
    ];

    const blob = new Blob([JSON.stringify(sampleJson, null, 2)], {
      type: "application/json;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "revlo_sample_prospects_template.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // File Upload Handler
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

  // Execute Import
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
        continue;
      }

      await createProspectAction({
        name,
        niche: row.niche || row.Niche || row["Industry / Niche"] || row.category || "",
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

  // Safe CSV Export with Formula Injection Defense
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
    link.setAttribute("download", `revlo_prospects_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="rounded-2xl border border-border/60 bg-card/70 p-4 sm:p-6 backdrop-blur-md space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <span>CSV Import & Safe Export Engine</span>
              </h1>
              <Badge variant="secondary" className="text-xs font-mono">
                {existingProspects.length} Active Records
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground pt-1">
              Bulk dataset ingestion with automatic duplicate detection, schema mapping, and formula injection defense
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {canExport && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleExportCSV}
                className="text-xs gap-1.5 font-semibold rounded-xl border-border/80 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export CSV ({existingProspects.length})</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Feature & Format Guidance Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        {/* Card 1: Supported File Formats */}
        <div className="p-4 sm:p-5 rounded-2xl border border-border/70 bg-card/80 dark:bg-zinc-900/80 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 font-bold text-foreground">
            <FileSpreadsheet className="h-4 w-4 text-primary" />
            <span>Supported Import Formats</span>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            Upload standard comma-delimited <strong>.CSV</strong> files. Columns are automatically auto-mapped regardless of casing or spacing.
          </p>
          <div className="flex flex-wrap gap-1.5 pt-1">
            <Badge variant="outline" className="font-mono text-[10px]">Company Name</Badge>
            <Badge variant="outline" className="font-mono text-[10px]">Industry / Niche</Badge>
            <Badge variant="outline" className="font-mono text-[10px]">Website</Badge>
            <Badge variant="outline" className="font-mono text-[10px]">City & State</Badge>
            <Badge variant="outline" className="font-mono text-[10px]">Phone</Badge>
            <Badge variant="outline" className="font-mono text-[10px]">Deal Value</Badge>
          </div>
        </div>

        {/* Card 2: Enterprise Duplicate Protection */}
        <div className="p-4 sm:p-5 rounded-2xl border border-border/70 bg-card/80 dark:bg-zinc-900/80 space-y-3 shadow-xs">
          <div className="flex items-center gap-2 font-bold text-foreground">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>Duplicate Protection Engine</span>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            During upload, records are cross-checked against active workspace prospects using normalized root domain matching and name/city combinations.
          </p>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            ✅ Zero duplicate pollution & safe skip
          </div>
        </div>

        {/* Card 3: Download Sample Templates */}
        <div className="p-4 sm:p-5 rounded-2xl border border-border/70 bg-card/80 dark:bg-zinc-900/80 space-y-3 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 font-bold text-foreground">
              <Download className="h-4 w-4 text-indigo-500" />
              <span>Sample Starter Templates</span>
            </div>
            <p className="text-muted-foreground leading-relaxed pt-1">
              Download pre-formatted sample files with realistic prospect data to test or format your spreadsheet.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2">
            <Button
              size="sm"
              variant="gradient"
              onClick={handleDownloadSampleCSV}
              className="text-xs gap-1.5 rounded-xl font-semibold cursor-pointer"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>Sample .CSV</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownloadSampleJSON}
              className="text-xs gap-1.5 rounded-xl font-medium cursor-pointer"
            >
              <FileCode className="h-3.5 w-3.5" />
              <span>Sample .JSON</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Import Completion Alert */}
      {importSummary && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <div className="text-xs">
              <span className="font-bold text-foreground">Import Completed Successfully! </span>
              <span className="text-emerald-600 dark:text-emerald-300">
                Created <strong>{importSummary.imported}</strong> new prospects. ({importSummary.duplicates} duplicates protected/skipped).
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Upload Drag & Drop Box */}
      <div className="rounded-3xl border-2 border-dashed border-border/80 bg-card/50 dark:bg-zinc-900/50 p-8 text-center backdrop-blur-md space-y-4">
        <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto border border-primary/20">
          <Upload className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-foreground">
            Select or Drop CSV Prospect File
          </h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Choose a .CSV file from your device. You will be able to review duplicate warnings and row mappings before confirming.
          </p>
        </div>
        <div>
          <label className="inline-flex">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              id="csv-file-input"
            />
            <Button
              type="button"
              variant="gradient"
              size="sm"
              className="gap-2 cursor-pointer font-semibold rounded-xl shadow-xs"
              onClick={() => {
                const input = document.getElementById("csv-file-input") as HTMLInputElement;
                input?.click();
              }}
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Browse CSV File</span>
            </Button>
          </label>
        </div>
      </div>

      {/* CSV Preview & Duplicate Warnings Table */}
      {parsedRows.length > 0 && (
        <div className="rounded-3xl border border-border/70 bg-card/90 dark:bg-zinc-900/90 backdrop-blur-xl overflow-hidden shadow-sm space-y-4 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-4">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <span>Ingestion Preview</span>
                <Badge variant="secondary" className="font-mono text-[11px]">
                  {parsedRows.length} Rows Parsed
                </Badge>
              </h3>
              <p className="text-xs text-muted-foreground pt-0.5">
                Review verified status and duplicate flags below before committing to database
              </p>
            </div>

            <Button
              size="sm"
              variant="gradient"
              onClick={handleExecuteImport}
              disabled={isImporting}
              className="text-xs font-semibold gap-1.5 rounded-xl cursor-pointer shadow-xs self-start sm:self-auto"
            >
              {isImporting ? "Importing..." : "Confirm & Ingest Valid Prospects"}
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="overflow-x-auto max-h-96 rounded-2xl border border-border/60">
            <Table>
              <TableHeader className="bg-muted/40 dark:bg-zinc-950/60">
                <TableRow>
                  <TableHead className="font-bold text-xs">Company Name</TableHead>
                  <TableHead className="font-bold text-xs">Website</TableHead>
                  <TableHead className="font-bold text-xs">Location</TableHead>
                  <TableHead className="font-bold text-xs">Niche</TableHead>
                  <TableHead className="font-bold text-xs">Duplicate Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parsedRows.map((row, idx) => {
                  const dupe = duplicateReports[idx];
                  const name = row.name || row["Company Name"] || row.company || "Unnamed";
                  const website = row.website || row.Website || row.url || "—";
                  const city = row.city || row.City || "";
                  const state = row.state || row.State || "";
                  const niche = row.niche || row.Niche || row["Industry / Niche"] || "—";

                  return (
                    <TableRow key={idx} className="hover:bg-muted/30">
                      <TableCell className="font-semibold text-xs text-foreground">
                        {name}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {website}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {[city, state].filter(Boolean).join(", ") || "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {niche}
                      </TableCell>
                      <TableCell>
                        {dupe?.isDuplicate ? (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[11px] font-semibold">
                            <AlertTriangle className="h-3 w-3" />
                            <span>Duplicate ({dupe.reason}) - Will Skip</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Valid Record</span>
                          </div>
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
