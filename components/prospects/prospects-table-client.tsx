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
  Filter,
  X,
  RotateCcw,
  Sliders,
  DollarSign,
  TrendingUp,
  MapPin,
  Check,
  ChevronDown,
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
  // Search & Target Field
  const [search, setSearch] = useState("");
  const [searchTargetField, setSearchTargetField] = useState<
    "ALL" | "name" | "niche" | "location" | "contact" | "opportunity"
  >("ALL");

  // Advanced Filters State
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);
  const [selectedNiche, setSelectedNiche] = useState<string>("ALL");
  const [selectedStage, setSelectedStage] = useState<string>("ALL");
  const [selectedGrade, setSelectedGrade] = useState<string>("ALL");
  const [selectedIcp, setSelectedIcp] = useState<string>("ALL");
  const [selectedUrgency, setSelectedUrgency] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedAssignee, setSelectedAssignee] = useState<string>("ALL");
  const [minScore, setMinScore] = useState<number>(0);
  const [minValue, setMinValue] = useState<number>(0);
  const [requireContactInfo, setRequireContactInfo] = useState(false);

  // Sorting & View Mode
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"score" | "name" | "value" | "date" | "rating">("score");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [bulkStageId, setBulkStageId] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Distinct Filter Options
  const niches = useMemo(() => {
    const set = new Set<string>();
    initialProspects.forEach((p) => {
      if (p.niche) set.add(p.niche);
    });
    return Array.from(set);
  }, [initialProspects]);

  // Reset all filters
  const resetFilters = () => {
    setSearch("");
    setSearchTargetField("ALL");
    setSelectedNiche("ALL");
    setSelectedStage("ALL");
    setSelectedGrade("ALL");
    setSelectedIcp("ALL");
    setSelectedUrgency("ALL");
    setSelectedStatus("ALL");
    setSelectedAssignee("ALL");
    setMinScore(0);
    setMinValue(0);
    setRequireContactInfo(false);
  };

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (search.trim()) count++;
    if (searchTargetField !== "ALL") count++;
    if (selectedNiche !== "ALL") count++;
    if (selectedStage !== "ALL") count++;
    if (selectedGrade !== "ALL") count++;
    if (selectedIcp !== "ALL") count++;
    if (selectedUrgency !== "ALL") count++;
    if (selectedStatus !== "ALL") count++;
    if (selectedAssignee !== "ALL") count++;
    if (minScore > 0) count++;
    if (minValue > 0) count++;
    if (requireContactInfo) count++;
    return count;
  }, [
    search,
    searchTargetField,
    selectedNiche,
    selectedStage,
    selectedGrade,
    selectedIcp,
    selectedUrgency,
    selectedStatus,
    selectedAssignee,
    minScore,
    minValue,
    requireContactInfo,
  ]);

  // Filtered & Sorted Prospects
  const filteredProspects = useMemo(() => {
    return initialProspects
      .filter((p) => {
        // 1. Text Search with Target Field Routing
        if (search.trim()) {
          const q = search.toLowerCase().trim();
          if (searchTargetField === "name") {
            const matches =
              p.name.toLowerCase().includes(q) ||
              (p.legalName && p.legalName.toLowerCase().includes(q));
            if (!matches) return false;
          } else if (searchTargetField === "niche") {
            const matches =
              (p.niche && p.niche.toLowerCase().includes(q)) ||
              (p.category && p.category.toLowerCase().includes(q));
            if (!matches) return false;
          } else if (searchTargetField === "location") {
            const matches =
              (p.city && p.city.toLowerCase().includes(q)) ||
              (p.state && p.state.toLowerCase().includes(q)) ||
              (p.country && p.country.toLowerCase().includes(q));
            if (!matches) return false;
          } else if (searchTargetField === "contact") {
            const matches =
              (p.phone && p.phone.toLowerCase().includes(q)) ||
              (p.email && p.email.toLowerCase().includes(q));
            if (!matches) return false;
          } else if (searchTargetField === "opportunity") {
            const matches =
              (p.mainOpportunity && p.mainOpportunity.toLowerCase().includes(q)) ||
              (p.buyingSignals && p.buyingSignals.toLowerCase().includes(q));
            if (!matches) return false;
          } else {
            // Global Search Across All Fields
            const globalMatches =
              p.name.toLowerCase().includes(q) ||
              p.city?.toLowerCase().includes(q) ||
              p.state?.toLowerCase().includes(q) ||
              p.country?.toLowerCase().includes(q) ||
              p.niche?.toLowerCase().includes(q) ||
              p.category?.toLowerCase().includes(q) ||
              p.website?.toLowerCase().includes(q) ||
              p.email?.toLowerCase().includes(q) ||
              p.phone?.toLowerCase().includes(q) ||
              p.mainOpportunity?.toLowerCase().includes(q) ||
              p.buyingSignals?.toLowerCase().includes(q);
            if (!globalMatches) return false;
          }
        }

        // 2. Facet filters
        if (selectedNiche !== "ALL" && p.niche !== selectedNiche) return false;
        if (selectedStage !== "ALL" && p.stageId !== selectedStage) return false;
        if (selectedGrade !== "ALL" && p.leadGrade !== selectedGrade) return false;
        if (selectedIcp !== "ALL" && (p.icpFit || "MEDIUM") !== selectedIcp) return false;
        if (selectedUrgency !== "ALL" && (p.urgency || "MEDIUM") !== selectedUrgency) return false;
        if (selectedStatus !== "ALL" && (p.businessStatus || "OPERATIONAL") !== selectedStatus) return false;
        if (selectedAssignee !== "ALL") {
          if (selectedAssignee === "UNASSIGNED" && p.assignedToId) return false;
          if (selectedAssignee !== "UNASSIGNED" && p.assignedToId !== selectedAssignee) return false;
        }

        // 3. Numeric Thresholds
        if (minScore > 0 && p.leadScore < minScore) return false;
        if (minValue > 0 && (Number(p.dealValue) || 0) < minValue) return false;

        // 4. Contact requirement toggle
        if (requireContactInfo && !p.phone && !p.email) return false;

        return true;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortBy === "score") diff = a.leadScore - b.leadScore;
        else if (sortBy === "name") diff = a.name.localeCompare(b.name);
        else if (sortBy === "value") diff = (Number(a.dealValue) || 0) - (Number(b.dealValue) || 0);
        else if (sortBy === "rating") diff = (Number(a.googleRating) || 0) - (Number(b.googleRating) || 0);
        else if (sortBy === "date")
          diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();

        return sortOrder === "desc" ? -diff : diff;
      });
  }, [
    initialProspects,
    search,
    searchTargetField,
    selectedNiche,
    selectedStage,
    selectedGrade,
    selectedIcp,
    selectedUrgency,
    selectedStatus,
    selectedAssignee,
    minScore,
    minValue,
    requireContactInfo,
    sortBy,
    sortOrder,
  ]);

  // Aggregate stats of filtered results
  const filteredPipelineValue = useMemo(() => {
    return filteredProspects.reduce((acc, p) => acc + (Number(p.dealValue) || 0), 0);
  }, [filteredProspects]);

  const avgLeadScore = useMemo(() => {
    if (filteredProspects.length === 0) return 0;
    const total = filteredProspects.reduce((acc, p) => acc + p.leadScore, 0);
    return Math.round(total / filteredProspects.length);
  }, [filteredProspects]);

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
    if (!confirm(`Are you sure you want to permanently delete prospect "${name}"?`)) return;
    try {
      await deleteProspectAction(id);
    } catch (err: unknown) {
      alert((err as Error).message || "Failed to delete prospect");
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Filter & Search Console */}
      <div className="rounded-2xl border border-border/40 bg-card p-3.5 sm:p-4 shadow-xs space-y-3">
        {/* Row 1: Search Input with Field Routing & Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Compound Search Bar */}
          <div className="flex items-center flex-1 max-w-2xl gap-2">
            {/* Target Field Selector */}
            <select
              value={searchTargetField}
              onChange={(e) => setSearchTargetField(e.target.value as any)}
              className="h-9 px-2.5 rounded-lg bg-background border border-border/60 text-xs text-foreground font-medium shrink-0 focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="ALL">All Fields</option>
              <option value="name">Company Name</option>
              <option value="niche">Industry / Niche</option>
              <option value="location">City / State / Country</option>
              <option value="contact">Phone or Email</option>
              <option value="opportunity">Opportunity / Signals</option>
            </select>

            {/* Live Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder={
                  searchTargetField === "name"
                    ? "Search by company name..."
                    : searchTargetField === "niche"
                    ? "Search industry or business category..."
                    : searchTargetField === "location"
                    ? "Search Austin, Texas, USA..."
                    : searchTargetField === "contact"
                    ? "Search phone numbers or emails..."
                    : searchTargetField === "opportunity"
                    ? "Search opportunity or buying signal notes..."
                    : "Search companies, domains, emails, locations..."
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-xs h-9"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Advanced Filters Drawer Toggle */}
            <Button
              size="sm"
              variant={isAdvancedFiltersOpen || activeFilterCount > 0 ? "secondary" : "outline"}
              onClick={() => setIsAdvancedFiltersOpen(!isAdvancedFiltersOpen)}
              className="text-xs gap-1.5 h-9 font-medium"
            >
              <Filter className="h-3.5 w-3.5 text-indigo-500" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="h-4 w-4 rounded-full bg-primary text-white text-[10px] flex items-center justify-center font-bold">
                  {activeFilterCount}
                </span>
              )}
            </Button>

            {/* Add Prospect Modal Button */}
            <Button
              size="sm"
              variant="gradient"
              onClick={() => setIsCreateOpen(true)}
              className="text-xs font-semibold gap-1.5 shadow-md shadow-indigo-500/20 h-9 px-3.5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Prospect</span>
            </Button>
          </div>
        </div>

        {/* Row 2: Collapsible Advanced Multi-Facet Filter Bar */}
        {isAdvancedFiltersOpen && (
          <div className="pt-3 border-t border-border/30 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2.5 text-xs animate-in fade-in duration-150">
            {/* 1. Industry / Niche */}
            <div>
              <label className="block mb-1 text-[11px] font-medium text-muted-foreground">Industry / Niche</label>
              <select
                value={selectedNiche}
                onChange={(e) => setSelectedNiche(e.target.value)}
                className="w-full h-8 px-2 rounded-md bg-background border border-border/60 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="ALL">All Industries</option>
                {niches.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Pipeline Stage */}
            <div>
              <label className="block mb-1 text-[11px] font-medium text-muted-foreground">Pipeline Stage</label>
              <select
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
                className="w-full h-8 px-2 rounded-md bg-background border border-border/60 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="ALL">All Stages</option>
                {stages.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Lead Tier Grade */}
            <div>
              <label className="block mb-1 text-[11px] font-medium text-muted-foreground">Lead Grade Tier</label>
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="w-full h-8 px-2 rounded-md bg-background border border-border/60 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="ALL">All Grades</option>
                <option value="A+">A+ Tier (Top Priority)</option>
                <option value="A">A Tier</option>
                <option value="B">B Tier</option>
                <option value="C">C Tier</option>
                <option value="D">D Tier</option>
              </select>
            </div>

            {/* 4. ICP Fit Level */}
            <div>
              <label className="block mb-1 text-[11px] font-medium text-muted-foreground">ICP Commercial Fit</label>
              <select
                value={selectedIcp}
                onChange={(e) => setSelectedIcp(e.target.value)}
                className="w-full h-8 px-2 rounded-md bg-background border border-border/60 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="ALL">All ICP Levels</option>
                <option value="HIGH">High Fit</option>
                <option value="MEDIUM">Medium Fit</option>
                <option value="LOW">Low Fit</option>
              </select>
            </div>

            {/* 5. Minimum Score Threshold */}
            <div>
              <label className="block mb-1 text-[11px] font-medium text-muted-foreground">Min Lead Score</label>
              <select
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
                className="w-full h-8 px-2 rounded-md bg-background border border-border/60 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value={0}>Any Score (0+)</option>
                <option value={60}>Score ≥ 60</option>
                <option value={75}>Score ≥ 75</option>
                <option value={85}>Score ≥ 85 (High Priority)</option>
                <option value={90}>Score ≥ 90 (A+ Only)</option>
              </select>
            </div>

            {/* 6. Minimum Deal Value */}
            <div>
              <label className="block mb-1 text-[11px] font-medium text-muted-foreground">Min Deal Size</label>
              <select
                value={minValue}
                onChange={(e) => setMinValue(Number(e.target.value))}
                className="w-full h-8 px-2 rounded-md bg-background border border-border/60 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value={0}>Any Value</option>
                <option value={10000}>$10,000+</option>
                <option value={20000}>$20,000+</option>
                <option value={30000}>$30,000+</option>
              </select>
            </div>
          </div>
        )}

        {/* Row 3: Active Filters Chips Bar & Quick Stats */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/20 text-xs">
          {/* Active Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-medium text-muted-foreground mr-1">
              Showing <span className="font-semibold text-foreground">{filteredProspects.length}</span> of {initialProspects.length} prospects:
            </span>

            {search && (
              <Badge variant="secondary" className="gap-1 text-[10px] pl-2 pr-1 py-0.5">
                <span>Search: "{search}"</span>
                <button onClick={() => setSearch("")} className="hover:text-destructive cursor-pointer">
                  <X className="h-2.5 w-2.5" />
                </button>
              </Badge>
            )}

            {selectedNiche !== "ALL" && (
              <Badge variant="secondary" className="gap-1 text-[10px] pl-2 pr-1 py-0.5">
                <span>Niche: {selectedNiche}</span>
                <button onClick={() => setSelectedNiche("ALL")} className="hover:text-destructive cursor-pointer">
                  <X className="h-2.5 w-2.5" />
                </button>
              </Badge>
            )}

            {selectedStage !== "ALL" && (
              <Badge variant="secondary" className="gap-1 text-[10px] pl-2 pr-1 py-0.5">
                <span>Stage: {stages.find((s) => s.id === selectedStage)?.name || selectedStage}</span>
                <button onClick={() => setSelectedStage("ALL")} className="hover:text-destructive cursor-pointer">
                  <X className="h-2.5 w-2.5" />
                </button>
              </Badge>
            )}

            {selectedGrade !== "ALL" && (
              <Badge variant="secondary" className="gap-1 text-[10px] pl-2 pr-1 py-0.5">
                <span>Grade: {selectedGrade}</span>
                <button onClick={() => setSelectedGrade("ALL")} className="hover:text-destructive cursor-pointer">
                  <X className="h-2.5 w-2.5" />
                </button>
              </Badge>
            )}

            {minScore > 0 && (
              <Badge variant="secondary" className="gap-1 text-[10px] pl-2 pr-1 py-0.5">
                <span>Score ≥ {minScore}</span>
                <button onClick={() => setMinScore(0)} className="hover:text-destructive cursor-pointer">
                  <X className="h-2.5 w-2.5" />
                </button>
              </Badge>
            )}

            {activeFilterCount > 0 && (
              <button
                onClick={resetFilters}
                className="text-[11px] text-primary hover:underline ml-1 font-medium cursor-pointer"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Right: Sort & View Mode Switcher */}
          <div className="flex items-center gap-2">
            {/* Sort Selector */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="h-8 px-2 rounded-md bg-background border border-border/60 text-xs text-foreground font-medium"
            >
              <option value="score">Sort by Score</option>
              <option value="value">Sort by Deal Value</option>
              <option value="rating">Sort by Google Rating</option>
              <option value="name">Sort by Company Name</option>
              <option value="date">Sort by Date Added</option>
            </select>

            {/* Asc / Desc Toggle */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
              className="h-8 px-2 text-xs"
              title={sortOrder === "asc" ? "Ascending" : "Descending"}
            >
              <ArrowUpDown className="h-3 w-3" />
            </Button>

            {/* View Mode Toggle */}
            <div className="flex items-center p-0.5 rounded-lg bg-muted/60 border border-border/30">
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                  viewMode === "table"
                    ? "bg-card text-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Table View"
              >
                <List className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setViewMode("cards")}
                className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                  viewMode === "cards"
                    ? "bg-card text-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Cards View"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
            </div>
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
            <div className="col-span-3 text-center py-12 rounded-2xl border border-border/40 bg-card text-xs text-muted-foreground">
              No prospects matching the search criteria. Try clearing some filters.
            </div>
          ) : (
            filteredProspects.map((p) => (
              <div
                key={p.id}
                className="p-5 rounded-2xl border border-border/40 bg-card shadow-xs hover:border-indigo-500/40 transition-all group space-y-3 relative"
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
                      <Phone className="h-3 w-3 text-emerald-500" />
                      <span>{p.phone}</span>
                    </div>
                  )}
                  {p.googleRating && (
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star className="h-3 w-3 fill-amber-500" />
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
        <div className="rounded-2xl border border-border/40 bg-card overflow-x-auto shadow-xs">
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
                          <div className="flex items-center gap-1 text-amber-500 text-xs">
                            <Star className="h-3.5 w-3.5 fill-amber-500" />
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
