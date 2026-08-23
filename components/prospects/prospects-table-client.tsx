"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  Download,
  Trash2,
  CheckSquare,
  Building2,
  Star,
  ExternalLink,
  ChevronRight,
  User,
  Plus,
  ShieldAlert,
  LayoutGrid,
  List,
  Mail,
  Phone,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  deleteProspectAction,
  bulkUpdateStageAction,
  bulkAssignAction,
} from "@/lib/actions/prospects";
import { ProspectCreateModal } from "./prospect-create-modal";

export interface ProspectItem {
  id: string;
  name: string;
  legalName?: string | null;
  category?: string | null;
  niche: string | null;
  website: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  phone: string | null;
  email?: string | null;
  businessStatus?: string | null;
  googleRating: string | null;
  reviewCount: number | null;
  leadScore: number;
  leadGrade: string;
  icpFit?: string | null;
  urgency?: string | null;
  dealValue: string | null;
  stageId: string | null;
  stageName?: string;
  stageColor?: string;
  assignedToId: string | null;
  assignedToName?: string;
  mainOpportunity: string | null;
  buyingSignals?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export function ProspectsTableClient({
  initialProspects,
  stages,
  usersList,
  canDelete = false,
}: {
  initialProspects: ProspectItem[];
  stages: { id: string; name: string; color: string }[];
  usersList: { id: string; name: string }[];
  canDelete?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [selectedNiche, setSelectedNiche] = useState<string>("ALL");
  const [selectedStage, setSelectedStage] = useState<string>("ALL");
  const [selectedGrade, setSelectedGrade] = useState<string>("ALL");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"score" | "name" | "value" | "date">("score");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [bulkStageId, setBulkStageId] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Filter niches list
  const niches = useMemo(() => {
    const set = new Set<string>();
    initialProspects.forEach((p) => {
      if (p.niche) set.add(p.niche);
    });
    return Array.from(set);
  }, [initialProspects]);

  // Filtered & Sorted Prospects
  const filteredProspects = useMemo(() => {
    return initialProspects
      .filter((p) => {
        const matchesSearch =
          !search ||
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.city?.toLowerCase().includes(search.toLowerCase()) ||
          p.niche?.toLowerCase().includes(search.toLowerCase()) ||
          p.website?.toLowerCase().includes(search.toLowerCase()) ||
          p.email?.toLowerCase().includes(search.toLowerCase());

        const matchesNiche = selectedNiche === "ALL" || p.niche === selectedNiche;
        const matchesStage = selectedStage === "ALL" || p.stageId === selectedStage;
        const matchesGrade = selectedGrade === "ALL" || p.leadGrade === selectedGrade;

        return matchesSearch && matchesNiche && matchesStage && matchesGrade;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortBy === "score") diff = a.leadScore - b.leadScore;
        else if (sortBy === "name") diff = a.name.localeCompare(b.name);
        else if (sortBy === "value") diff = (Number(a.dealValue) || 0) - (Number(b.dealValue) || 0);
        else if (sortBy === "date")
          diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();

        return sortOrder === "desc" ? -diff : diff;
      });
  }, [initialProspects, search, selectedNiche, selectedStage, selectedGrade, sortBy, sortOrder]);

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredProspects.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProspects.map((p) => p.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkStageChange = async () => {
    if (!bulkStageId || selectedIds.length === 0) return;
    setIsProcessing(true);
    await bulkUpdateStageAction(selectedIds, bulkStageId);
    setSelectedIds([]);
    setIsProcessing(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete prospect "${name}"?`)) return;
    try {
      await deleteProspectAction(id);
    } catch (err: unknown) {
      alert((err as Error).message || "Failed to delete prospect");
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Filter & Action Bar */}
      <div className="rounded-2xl border border-border/60 bg-card/70 p-3 sm:p-4 backdrop-blur-md space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search companies, domains, emails, cities..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="gradient"
              onClick={() => setIsCreateOpen(true)}
              className="text-xs font-semibold gap-1.5 shadow-md shadow-indigo-500/20"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Prospect</span>
            </Button>
          </div>
        </div>

        {/* Filter Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            {/* Niche Filter */}
            <select
              value={selectedNiche}
              onChange={(e) => setSelectedNiche(e.target.value)}
              className="h-9 px-3 rounded-lg bg-background/60 border border-border/80 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="ALL">All Industries</option>
              {niches.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>

            {/* Stage Filter */}
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="h-9 px-3 rounded-lg bg-background/60 border border-border/80 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="ALL">All Stages</option>
              {stages.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            {/* Grade Filter */}
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="h-9 px-3 rounded-lg bg-background/60 border border-border/80 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="ALL">All Lead Grades</option>
              <option value="A+">A+ Tier</option>
              <option value="A">A Tier</option>
              <option value="B">B Tier</option>
              <option value="C">C Tier</option>
              <option value="D">D Tier</option>
            </select>

            {/* Sort Toggle */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
              className="text-xs gap-1.5 h-9"
            >
              <ArrowUpDown className="h-3 w-3" />
              <span className="hidden sm:inline">{sortOrder === "asc" ? "Ascending" : "Descending"}</span>
            </Button>
          </div>

          {/* View Mode Toggle for Responsive Screen Sizes */}
          <div className="flex items-center p-0.5 rounded-lg bg-muted/60 border border-border/40">
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                viewMode === "table"
                  ? "bg-card text-foreground font-semibold shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Table View"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("cards")}
              className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                viewMode === "cards"
                  ? "bg-card text-foreground font-semibold shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="Cards View"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Bulk Action Bar (when rows are selected) */}
        {selectedIds.length > 0 && (
          <div className="flex flex-wrap items-center justify-between p-2.5 rounded-xl bg-primary/10 border border-primary/20 animate-in fade-in text-xs gap-2">
            <div className="flex items-center gap-2 font-medium text-foreground">
              <CheckSquare className="h-4 w-4 text-primary" />
              <span>{selectedIds.length} prospects selected</span>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={bulkStageId}
                onChange={(e) => setBulkStageId(e.target.value)}
                className="h-8 px-2.5 rounded-md bg-background border border-border text-xs text-foreground"
              >
                <option value="">Move to Stage...</option>
                {stages.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>

              <Button
                size="sm"
                variant="secondary"
                onClick={handleBulkStageChange}
                disabled={!bulkStageId || isProcessing}
                className="h-8 text-xs font-medium"
              >
                Apply Stage
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Conditional: Cards Grid View vs Table */}
      {viewMode === "cards" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProspects.length === 0 ? (
            <div className="col-span-3 text-center py-12 rounded-2xl border border-border/60 bg-card/40 text-xs text-muted-foreground">
              No matching prospects found.
            </div>
          ) : (
            filteredProspects.map((p) => (
              <div
                key={p.id}
                className="p-5 rounded-2xl border border-border/60 bg-card/70 backdrop-blur-md space-y-3 hover:border-indigo-500/40 transition-all group relative"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <Link
                      href={`/prospects/${p.id}`}
                      className="font-bold text-sm text-foreground group-hover:text-primary transition-colors block"
                    >
                      {p.name}
                    </Link>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span>{p.niche || "—"}</span>
                      {p.businessStatus && (
                        <span className="text-[10px] uppercase font-mono px-1 rounded bg-muted/60">
                          {p.businessStatus}
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge
                    variant={
                      p.leadGrade === "A+" || p.leadGrade === "A"
                        ? "success"
                        : "info"
                    }
                    className="text-[10px] font-mono"
                  >
                    Score: {p.leadScore} ({p.leadGrade})
                  </Badge>
                </div>

                <div className="text-xs space-y-1 text-muted-foreground">
                  {p.city && <div>📍 {p.city}, {p.state || p.country}</div>}
                  {p.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3 text-emerald-400" />
                      <span>{p.phone}</span>
                    </div>
                  )}
                  {p.googleRating && (
                    <div className="flex items-center gap-1 text-amber-400">
                      <Star className="h-3 w-3 fill-amber-400" />
                      <span>{p.googleRating} ({p.reviewCount || 0} reviews)</span>
                    </div>
                  )}
                  {p.icpFit && (
                    <div className="flex items-center gap-1.5 pt-1">
                      <span className="text-[11px]">ICP Fit:</span>
                      <Badge variant={p.icpFit === "HIGH" ? "success" : "secondary"} className="text-[9px] px-1 py-0">
                        {p.icpFit}
                      </Badge>
                    </div>
                  )}
                  {p.mainOpportunity && (
                    <p className="text-foreground/80 line-clamp-2 pt-1 text-[11px]">
                      💡 {p.mainOpportunity}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/30 text-xs">
                  <Badge variant="outline" className="text-[10px]">
                    {p.stageName || "Researching"}
                  </Badge>
                  <span className="font-bold text-foreground">
                    {p.dealValue ? `$${Number(p.dealValue).toLocaleString()}` : "—"}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Spreadsheet Data Table */
        <div className="rounded-2xl border border-border/60 bg-card/70 backdrop-blur-md overflow-x-auto shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      filteredProspects.length > 0 &&
                      selectedIds.length === filteredProspects.length
                    }
                    onChange={toggleSelectAll}
                    className="rounded border-border cursor-pointer"
                  />
                </TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Industry / Status</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Phone / Email</TableHead>
                <TableHead>Google Rating</TableHead>
                <TableHead>Lead Score</TableHead>
                <TableHead>ICP Fit</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Deal Value</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredProspects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-12 text-xs text-muted-foreground">
                    No matching prospects found. Try adjusting your filters or search query.
                  </TableCell>
                </TableRow>
              ) : (
                filteredProspects.map((p) => {
                  const isSelected = selectedIds.includes(p.id);

                  return (
                    <TableRow
                      key={p.id}
                      className={`transition-colors cursor-pointer ${
                        isSelected ? "bg-primary/5" : ""
                      }`}
                    >
                      <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(p.id)}
                          className="rounded border-border cursor-pointer"
                        />
                      </TableCell>

                      <TableCell>
                        <Link href={`/prospects/${p.id}`} className="block group">
                          <div className="font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                            <span>{p.name}</span>
                            <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          {p.website && (
                            <span className="text-[11px] text-muted-foreground hover:underline flex items-center gap-1">
                              {p.website.replace(/^https?:\/\//, "")}
                            </span>
                          )}
                        </Link>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-0.5">
                          <div className="text-xs text-foreground font-medium">
                            {p.niche || "—"}
                          </div>
                          {p.businessStatus && (
                            <Badge variant="outline" className="text-[9px] px-1 py-0 uppercase font-mono">
                              {p.businessStatus}
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {p.city ? `${p.city}, ${p.state || p.country || ""}` : "—"}
                        </span>
                      </TableCell>

                      <TableCell>
                        <div className="text-xs space-y-0.5">
                          {p.phone && (
                            <div className="text-muted-foreground">{p.phone}</div>
                          )}
                          {p.email && (
                            <div className="text-primary text-[11px] truncate max-w-[120px]">
                              {p.email}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        {p.googleRating ? (
                          <div className="flex items-center gap-1 text-amber-400 text-xs">
                            <Star className="h-3.5 w-3.5 fill-amber-400" />
                            <span className="font-medium text-foreground">
                              {p.googleRating}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              ({p.reviewCount || 0})
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant={
                            p.leadGrade === "A+" || p.leadGrade === "A"
                              ? "success"
                              : p.leadGrade === "B"
                              ? "info"
                              : "secondary"
                          }
                          className="font-mono text-[11px]"
                        >
                          {p.leadScore} ({p.leadGrade})
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant={p.icpFit === "HIGH" ? "success" : "secondary"}
                          className="text-[10px] px-1.5 py-0"
                        >
                          {p.icpFit || "MEDIUM"}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline" className="text-[11px] capitalize">
                          {p.stageName || "Researching"}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <span className="font-semibold text-xs text-foreground">
                          {p.dealValue
                            ? `$${Number(p.dealValue).toLocaleString()}`
                            : "—"}
                        </span>
                      </TableCell>

                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/prospects/${p.id}`}>
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs">
                              View
                            </Button>
                          </Link>
                          {canDelete && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(p.id, p.name)}
                              className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 cursor-pointer"
                              title="Delete Prospect (Admin Only)"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Creation Modal */}
      <ProspectCreateModal
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        stages={stages}
        workspaceUsers={usersList}
      />
    </div>
  );
}
