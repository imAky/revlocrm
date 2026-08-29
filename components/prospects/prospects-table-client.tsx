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
  Globe,
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
import { ProspectAiDossierModal } from "./prospect-ai-dossier-modal";
import { LeadScoreBreakdownPopover } from "@/components/scoring/lead-score-breakdown-popover";
import { ScoringMethodologyModal } from "@/components/scoring/scoring-methodology-modal";

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
  const [dossierProspect, setDossierProspect] = useState<any | null>(null);
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);

  // Distinct Filter Options
  const niches = useMemo(() => {
    const set = new Set<string>();
    initialProspects.forEach((p) => {
      if (p.niche) set.add(p.niche.trim());
      if (p.category) set.add(p.category.trim());
    });
    return Array.from(set).filter(Boolean);
  }, [initialProspects]);

  const countries = useMemo(() => {
    const set = new Set<string>();
    initialProspects.forEach((p) => {
      if (p.country) set.add(p.country.trim());
    });
    return Array.from(set).filter(Boolean);
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
            // ALL search
            const matchName = p.name.toLowerCase().includes(q);
            const matchLegal = p.legalName?.toLowerCase().includes(q) || false;
            const matchNiche = p.niche?.toLowerCase().includes(q) || false;
            const matchCategory = p.category?.toLowerCase().includes(q) || false;
            const matchCity = p.city?.toLowerCase().includes(q) || false;
            const matchState = p.state?.toLowerCase().includes(q) || false;
            const matchCountry = p.country?.toLowerCase().includes(q) || false;
            const matchPhone = p.phone?.toLowerCase().includes(q) || false;
            const matchEmail = p.email?.toLowerCase().includes(q) || false;
            const matchOpp = p.mainOpportunity?.toLowerCase().includes(q) || false;
            const matchWebsite = p.website?.toLowerCase().includes(q) || false;

            if (
              !matchName &&
              !matchLegal &&
              !matchNiche &&
              !matchCategory &&
              !matchCity &&
              !matchState &&
              !matchCountry &&
              !matchPhone &&
              !matchEmail &&
              !matchOpp &&
              !matchWebsite
            ) {
              return false;
            }
          }
        }

        // 2. Filter: Niche / Industry
        if (selectedNiche !== "ALL") {
          if (p.niche !== selectedNiche && p.category !== selectedNiche) return false;
        }

        // 3. Filter: Stage
        if (selectedStage !== "ALL" && p.stageId !== selectedStage) return false;

        // 4. Filter: Lead Grade
        if (selectedGrade !== "ALL" && p.leadGrade !== selectedGrade) return false;

        // 5. Filter: ICP Fit
        if (selectedIcp !== "ALL" && p.icpFit !== selectedIcp) return false;

        // 6. Filter: Urgency
        if (selectedUrgency !== "ALL" && p.urgency !== selectedUrgency) return false;

        // 7. Filter: Status
        if (selectedStatus !== "ALL" && p.businessStatus !== selectedStatus) return false;

        // 8. Filter: Assignee
        if (selectedAssignee !== "ALL" && p.assignedToId !== selectedAssignee) return false;

        // 9. Filter: Minimum Lead Score
        if (minScore > 0 && p.leadScore < minScore) return false;

        // 10. Filter: Minimum Deal Value
        if (minValue > 0 && (Number(p.dealValue) || 0) < minValue) return false;

        // 11. Filter: Require Phone/Email
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
      <div className="rounded-2xl border border-border/80 bg-card/90 dark:bg-zinc-900/90 p-4 sm:p-5 shadow-xs backdrop-blur-xl space-y-3.5">
        {/* Row 1: Compound Search Bar with Target Field & Actions */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 min-w-0">
          {/* Compound Search Bar */}
          <div className="flex items-center flex-1 min-w-0 gap-2 w-full">
            {/* Target Field Selector */}
            <select
              value={searchTargetField}
              onChange={(e) => setSearchTargetField(e.target.value as any)}
              className="h-10 px-2.5 sm:px-3 rounded-xl bg-card dark:bg-zinc-900 border border-border/80 text-xs text-foreground dark:text-zinc-100 font-medium shrink-0 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-2xs max-w-[120px] sm:max-w-[150px]"
            >
              <option value="ALL" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">All Fields</option>
              <option value="name" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Company Name</option>
              <option value="niche" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Industry / Niche</option>
              <option value="location" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">City / State / Country</option>
              <option value="contact" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Phone or Email</option>
              <option value="opportunity" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Opportunity / Signals</option>
            </select>

            {/* Live Search Input */}
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/80" />
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
                className="pl-10 pr-9 text-xs h-10 bg-background/90 dark:bg-zinc-950/90 border-border/80 placeholder:text-muted-foreground/75 dark:placeholder:text-zinc-400 rounded-xl w-full"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap justify-start lg:justify-end">
            {/* Advanced Filters Drawer Toggle */}
            <Button
              size="sm"
              variant={isAdvancedFiltersOpen || activeFilterCount > 0 ? "secondary" : "outline"}
              onClick={() => setIsAdvancedFiltersOpen(!isAdvancedFiltersOpen)}
              className="text-xs gap-1.5 h-10 px-3 sm:px-3.5 font-semibold rounded-xl cursor-pointer"
            >
              <Filter className="h-3.5 w-3.5 text-primary" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="h-4.5 w-4.5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
                  {activeFilterCount}
                </span>
              )}
            </Button>

            {/* ICP Scoring Formula Methodology Button */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsMethodologyOpen(true)}
              className="text-xs gap-1.5 h-10 px-2.5 sm:px-3 font-semibold rounded-xl text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/10 cursor-pointer shadow-2xs"
              title="View full ICP Lead Scoring Formula & Weighting Matrix"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span className="hidden sm:inline">ICP Formula</span>
              <span className="sm:hidden">Formula</span>
            </Button>

            {/* Add Prospect Modal Button */}
            <Button
              size="sm"
              variant="gradient"
              onClick={() => setIsCreateOpen(true)}
              className="text-xs font-bold gap-1.5 shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 active:scale-95 transition-all h-10 px-3.5 sm:px-4 rounded-xl cursor-pointer shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>Add Prospect</span>
            </Button>
          </div>
        </div>

        {/* Row 2: Collapsible Advanced Multi-Facet Filter Bar */}
        {isAdvancedFiltersOpen && (
          <div className="pt-3 border-t border-border/40 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 text-xs animate-in fade-in duration-150">
            {/* 1. Industry / Niche */}
            <div>
              <label className="block mb-1.5 text-[11px] font-semibold text-foreground/80">Industry / Niche</label>
              <select
                value={selectedNiche}
                onChange={(e) => setSelectedNiche(e.target.value)}
                className="w-full h-9 px-2.5 rounded-xl bg-card dark:bg-zinc-900 border border-border/80 text-xs text-foreground dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-2xs"
              >
                <option value="ALL" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">All Industries</option>
                {niches.map((n) => (
                  <option key={n} value={n} className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">
                    {n}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Pipeline Stage */}
            <div>
              <label className="block mb-1.5 text-[11px] font-semibold text-foreground/80">Pipeline Stage</label>
              <select
                value={selectedStage}
                onChange={(e) => setSelectedStage(e.target.value)}
                className="w-full h-9 px-2.5 rounded-xl bg-card dark:bg-zinc-900 border border-border/80 text-xs text-foreground dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-2xs"
              >
                <option value="ALL" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">All Stages</option>
                {stages.map((s) => (
                  <option key={s.id} value={s.id} className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Lead Tier Grade */}
            <div>
              <label className="block mb-1.5 text-[11px] font-semibold text-foreground/80">Lead Grade Tier</label>
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="w-full h-9 px-2.5 rounded-xl bg-card dark:bg-zinc-900 border border-border/80 text-xs text-foreground dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-2xs"
              >
                <option value="ALL" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">All Grades</option>
                <option value="A+" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">A+ Tier (Top Priority)</option>
                <option value="A" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">A Tier</option>
                <option value="B" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">B Tier</option>
                <option value="C" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">C Tier</option>
                <option value="D" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">D Tier</option>
              </select>
            </div>

            {/* 4. ICP Fit Level */}
            <div>
              <label className="block mb-1.5 text-[11px] font-semibold text-foreground/80">ICP Commercial Fit</label>
              <select
                value={selectedIcp}
                onChange={(e) => setSelectedIcp(e.target.value)}
                className="w-full h-9 px-2.5 rounded-xl bg-card dark:bg-zinc-900 border border-border/80 text-xs text-foreground dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-2xs"
              >
                <option value="ALL" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">All ICP Levels</option>
                <option value="HIGH" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">High Fit</option>
                <option value="MEDIUM" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Medium Fit</option>
                <option value="LOW" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Low Fit</option>
              </select>
            </div>

            {/* 5. Minimum Score Threshold */}
            <div>
              <label className="block mb-1.5 text-[11px] font-semibold text-foreground/80">Min Lead Score</label>
              <select
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
                className="w-full h-9 px-2.5 rounded-xl bg-card dark:bg-zinc-900 border border-border/80 text-xs text-foreground dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-2xs"
              >
                <option value={0} className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Any Score (0+)</option>
                <option value={60} className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Score ≥ 60</option>
                <option value={75} className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Score ≥ 75</option>
                <option value={85} className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Score ≥ 85 (High Priority)</option>
                <option value={90} className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Score ≥ 90 (A+ Only)</option>
              </select>
            </div>

            {/* 6. Minimum Deal Value */}
            <div>
              <label className="block mb-1.5 text-[11px] font-semibold text-foreground/80">Min Deal Size</label>
              <select
                value={minValue}
                onChange={(e) => setMinValue(Number(e.target.value))}
                className="w-full h-9 px-2.5 rounded-xl bg-card dark:bg-zinc-900 border border-border/80 text-xs text-foreground dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-2xs"
              >
                <option value={0} className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Any Value</option>
                <option value={10000} className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">$10,000+</option>
                <option value={20000} className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">$20,000+</option>
                <option value={30000} className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">$30,000+</option>
              </select>
            </div>
          </div>
        )}

        {/* Row 3: Active Filters Chips Bar & Sort Console */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/40 text-xs">
          {/* Active Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-medium text-muted-foreground mr-1">
              Showing <span className="font-bold text-foreground">{filteredProspects.length}</span> of {initialProspects.length} prospects
            </span>

            {search && (
              <Badge variant="secondary" className="gap-1 text-[10px] pl-2.5 pr-1.5 py-0.5 rounded-lg border border-border/60">
                <span>Search: &quot;{search}&quot;</span>
                <button onClick={() => setSearch("")} className="hover:text-destructive cursor-pointer">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}

            {selectedNiche !== "ALL" && (
              <Badge variant="secondary" className="gap-1 text-[10px] pl-2.5 pr-1.5 py-0.5 rounded-lg border border-border/60">
                <span>Industry: {selectedNiche}</span>
                <button onClick={() => setSelectedNiche("ALL")} className="hover:text-destructive cursor-pointer">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}

            {selectedStage !== "ALL" && (
              <Badge variant="secondary" className="gap-1 text-[10px] pl-2.5 pr-1.5 py-0.5 rounded-lg border border-border/60">
                <span>Stage: {stages.find((s) => s.id === selectedStage)?.name || selectedStage}</span>
                <button onClick={() => setSelectedStage("ALL")} className="hover:text-destructive cursor-pointer">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}

            {selectedGrade !== "ALL" && (
              <Badge variant="secondary" className="gap-1 text-[10px] pl-2.5 pr-1.5 py-0.5 rounded-lg border border-border/60">
                <span>Grade: {selectedGrade}</span>
                <button onClick={() => setSelectedGrade("ALL")} className="hover:text-destructive cursor-pointer">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}

            {minScore > 0 && (
              <Badge variant="secondary" className="gap-1 text-[10px] pl-2.5 pr-1.5 py-0.5 rounded-lg border border-border/60">
                <span>Score ≥ {minScore}</span>
                <button onClick={() => setMinScore(0)} className="hover:text-destructive cursor-pointer">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}

            {activeFilterCount > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={resetFilters}
                className="h-6 px-2 text-[11px] text-primary hover:underline font-semibold cursor-pointer"
              >
                Clear all
              </Button>
            )}
          </div>

          {/* Right: Sort & View Mode Switcher */}
          <div className="flex items-center gap-2">
            {/* Sort Selector */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="h-9 px-3 rounded-xl bg-card dark:bg-zinc-900 border border-border/80 text-xs text-foreground dark:text-zinc-100 font-medium focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-2xs"
            >
              <option value="score" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Sort by Lead Score</option>
              <option value="value" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Sort by Deal Value</option>
              <option value="rating" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Sort by Google Rating</option>
              <option value="name" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Sort by Company Name</option>
              <option value="date" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Sort by Date Added</option>
            </select>

            {/* Asc / Desc Toggle */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
              className="h-9 w-9 p-0 text-xs rounded-xl"
              title={sortOrder === "asc" ? "Ascending order" : "Descending order"}
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
            </Button>

            {/* View Mode Toggle */}
            <div className="flex items-center p-1 rounded-xl bg-muted/60 dark:bg-zinc-950/60 border border-border/60">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  viewMode === "table"
                    ? "bg-card text-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Table View"
              >
                <List className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
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
          <div className="flex flex-wrap items-center justify-between p-3 rounded-2xl bg-primary/10 border border-primary/20 animate-in fade-in text-xs gap-2">
            <div className="flex items-center gap-2 font-semibold text-foreground">
              <CheckSquare className="h-4 w-4 text-primary" />
              <span>{selectedIds.length} prospects selected</span>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={bulkStageId}
                onChange={(e) => setBulkStageId(e.target.value)}
                className="h-9 px-3 rounded-xl bg-card dark:bg-zinc-900 border border-border text-xs text-foreground dark:text-zinc-100"
              >
                <option value="" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Move to Stage...</option>
                {stages.map((s) => (
                  <option key={s.id} value={s.id} className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">
                    {s.name}
                  </option>
                ))}
              </select>

              <Button
                size="sm"
                variant="secondary"
                onClick={handleBulkStageChange}
                disabled={!bulkStageId || isProcessing}
                className="h-9 text-xs font-semibold rounded-xl"
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
            <div className="col-span-3 text-center py-16 px-6 rounded-3xl border border-dashed border-border/80 bg-card/60 dark:bg-zinc-900/60 backdrop-blur-md text-xs text-muted-foreground">
              No prospects matching the search criteria. Try clearing some filters.
            </div>
          ) : (
            filteredProspects.map((p) => (
              <div
                key={p.id}
                className="p-5 rounded-2xl border border-border/80 bg-card/90 dark:bg-zinc-900/90 shadow-xs hover:border-primary/50 transition-all group space-y-3.5 relative backdrop-blur-xl"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0">
                    <Link
                      href={`/prospects/${p.id}`}
                      className="font-bold text-sm text-foreground group-hover:text-primary transition-colors block truncate"
                    >
                      {p.name}
                    </Link>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="truncate">{p.niche || "—"}</span>
                      {p.businessStatus && (
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-muted/60 dark:bg-zinc-800 text-muted-foreground shrink-0">
                          {p.businessStatus}
                        </span>
                      )}
                    </div>
                  </div>
                  <LeadScoreBreakdownPopover
                    score={p.leadScore}
                    grade={p.leadGrade}
                    prospectName={p.name}
                    scoringInput={p as any}
                    showLabel
                  />
                </div>

                <div className="text-xs space-y-1.5 text-muted-foreground pt-0.5">
                  {/* Location with Google Maps link */}
                  {p.city && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        `${p.name} ${p.city} ${p.state || p.country || ""}`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 hover:text-sky-500 hover:underline transition-colors truncate"
                      title="Open Google Maps location"
                    >
                      <MapPin className="h-3.5 w-3.5 text-sky-500 shrink-0" />
                      <span className="truncate">{p.city}, {p.state || p.country}</span>
                    </a>
                  )}

                  {/* Phone with Click-to-Dial */}
                  {p.phone && (
                    <a
                      href={`tel:${p.phone}`}
                      className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 hover:underline font-medium transition-colors"
                      title="Click to dial on phone"
                    >
                      <Phone className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span>{p.phone}</span>
                    </a>
                  )}

                  {/* Email with Click-to-Mail */}
                  {p.email && (
                    <a
                      href={`mailto:${p.email}`}
                      className="flex items-center gap-1.5 text-primary hover:underline transition-colors truncate"
                      title="Click to send email"
                    >
                      <Mail className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="truncate">{p.email}</span>
                    </a>
                  )}

                  {p.googleRating && (
                    <div className="flex items-center gap-1.5 text-amber-500">
                      <Star className="h-3.5 w-3.5 fill-amber-500 shrink-0" />
                      <span className="font-semibold text-foreground">{p.googleRating}</span>
                      <span className="text-[10px] text-muted-foreground">
                        ({p.reviewCount || 0} reviews)
                      </span>
                    </div>
                  )}

                  {p.mainOpportunity && (
                    <p className="text-foreground/85 line-clamp-2 pt-1 text-[11px] leading-relaxed">
                      💡 {p.mainOpportunity}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2.5 border-t border-border/50 text-xs">
                  <Badge variant="outline" className="text-[10px]">
                    {p.stageName || "Researching"}
                  </Badge>

                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">
                      {p.dealValue ? `$${Number(p.dealValue).toLocaleString()}` : "—"}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDossierProspect(p)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl"
                        title="AI Prompt Summary & Dossier (.MD)"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                      </Button>
                      <Link href={`/prospects/${p.id}`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2.5 text-xs font-semibold gap-1 rounded-xl border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground transition-all shadow-2xs"
                        >
                          <span>View</span>
                          <ChevronRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Luxury Spreadsheet Data Table */
        <div className="rounded-2xl border border-border/80 bg-card/90 dark:bg-zinc-900/90 overflow-x-auto shadow-xs backdrop-blur-xl">
          <Table>
            <TableHeader className="bg-muted/40 dark:bg-zinc-950/60 border-b border-border/60">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      filteredProspects.length > 0 &&
                      selectedIds.length === filteredProspects.length
                    }
                    onChange={toggleSelectAll}
                    className="rounded border-border cursor-pointer h-4 w-4"
                  />
                </TableHead>
                <TableHead className="font-bold text-xs">Company</TableHead>
                <TableHead className="font-bold text-xs">Industry / Status</TableHead>
                <TableHead className="font-bold text-xs">Location</TableHead>
                <TableHead className="font-bold text-xs">Phone / Email</TableHead>
                <TableHead className="font-bold text-xs">Google Rating</TableHead>
                <TableHead className="font-bold text-xs">Lead Score</TableHead>
                <TableHead className="font-bold text-xs">ICP Fit</TableHead>
                <TableHead className="font-bold text-xs">Stage</TableHead>
                <TableHead className="font-bold text-xs">Deal Value</TableHead>
                <TableHead className="text-right font-bold text-xs">Action</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredProspects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-16 text-xs text-muted-foreground">
                    No matching prospects found. Try adjusting your filters or search query.
                  </TableCell>
                </TableRow>
              ) : (
                filteredProspects.map((p) => {
                  const isSelected = selectedIds.includes(p.id);

                  return (
                    <TableRow
                      key={p.id}
                      className={`transition-colors hover:bg-muted/40 dark:hover:bg-zinc-800/40 border-b border-border/40 ${
                        isSelected ? "bg-primary/5 dark:bg-primary/10" : ""
                      }`}
                    >
                      <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(p.id)}
                          className="rounded border-border cursor-pointer h-4 w-4"
                        />
                      </TableCell>

                      {/* Company Name & Website */}
                      <TableCell>
                        <Link href={`/prospects/${p.id}`} className="block group">
                          <div className="font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                            <span>{p.name}</span>
                            <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                          </div>
                          {p.website && (
                            <span className="text-[11px] text-muted-foreground hover:underline flex items-center gap-1">
                              {p.website.replace(/^https?:\/\//, "")}
                            </span>
                          )}
                        </Link>
                      </TableCell>

                      {/* Industry / Status */}
                      <TableCell>
                        <div className="space-y-0.5">
                          <div className="text-xs text-foreground font-medium truncate max-w-[140px]">
                            {p.niche || p.category || "—"}
                          </div>
                          {p.businessStatus && (
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 uppercase font-mono">
                              {p.businessStatus}
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      {/* Location with Google Maps link */}
                      <TableCell>
                        {p.city ? (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                              `${p.name} ${p.city} ${p.state || p.country || ""}`
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-muted-foreground hover:text-sky-500 hover:underline flex items-center gap-1 truncate max-w-[130px]"
                            title="Open Google Maps"
                          >
                            <MapPin className="h-3 w-3 text-sky-500 shrink-0" />
                            <span className="truncate">{p.city}, {p.state || p.country || ""}</span>
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>

                      {/* Phone with Click-to-Dial & Email */}
                      <TableCell>
                        <div className="text-xs space-y-0.5">
                          {p.phone && (
                            <a
                              href={`tel:${p.phone}`}
                              className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium flex items-center gap-1"
                              title="Click to call on phone dialer"
                            >
                              <Phone className="h-3 w-3 text-emerald-500 shrink-0" />
                              <span>{p.phone}</span>
                            </a>
                          )}
                          {p.email && (
                            <a
                              href={`mailto:${p.email}`}
                              className="text-primary hover:underline text-[11px] truncate max-w-[130px] flex items-center gap-1"
                              title="Click to send email"
                            >
                              <Mail className="h-3 w-3 text-primary shrink-0" />
                              <span className="truncate">{p.email}</span>
                            </a>
                          )}
                          {!p.phone && !p.email && (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </div>
                      </TableCell>

                      {/* Google Rating */}
                      <TableCell>
                        {p.googleRating ? (
                          <div className="flex items-center gap-1 text-amber-500 text-xs">
                            <Star className="h-3.5 w-3.5 fill-amber-500 shrink-0" />
                            <span className="font-semibold text-foreground">
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

                      {/* Lead Score & Grade with Interactive Breakdown */}
                      <TableCell>
                        <LeadScoreBreakdownPopover
                          score={p.leadScore}
                          grade={p.leadGrade}
                          prospectName={p.name}
                          scoringInput={p as any}
                        />
                      </TableCell>

                      {/* ICP Fit */}
                      <TableCell>
                        <Badge
                          variant={p.icpFit === "HIGH" ? "success" : "secondary"}
                          className="text-[10px] px-2 py-0.5"
                        >
                          {p.icpFit || "MEDIUM"}
                        </Badge>
                      </TableCell>

                      {/* Stage */}
                      <TableCell>
                        <Badge variant="outline" className="text-[11px] capitalize px-2 py-0.5">
                          {p.stageName || "Researching"}
                        </Badge>
                      </TableCell>

                      {/* Deal Value */}
                      <TableCell>
                        <span className="font-bold text-xs text-foreground">
                          {p.dealValue
                            ? `$${Number(p.dealValue).toLocaleString()}`
                            : "—"}
                        </span>
                      </TableCell>

                      {/* Distinct Actions Button */}
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDossierProspect(p)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10 cursor-pointer rounded-xl"
                            title="AI Prompt Summary & Dossier (.MD)"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                          </Button>
                          <Link href={`/prospects/${p.id}`}>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-3 text-xs font-semibold gap-1.5 rounded-xl border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground transition-all shadow-2xs cursor-pointer"
                            >
                              <span>View</span>
                              <ChevronRight className="h-3 w-3" />
                            </Button>
                          </Link>
                          {canDelete && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(p.id, p.name)}
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer rounded-xl"
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
        existingNiches={niches}
        existingCountries={countries}
      />

      {/* Quick AI Dossier Modal from Table/Card view */}
      {dossierProspect && (
        <ProspectAiDossierModal
          isOpen={Boolean(dossierProspect)}
          onClose={() => setDossierProspect(null)}
          prospect={dossierProspect}
          stageName={dossierProspect.stageName || stages.find((s) => s.id === dossierProspect.stageId)?.name}
        />
      )}

      {/* Global Scoring Methodology Explainer Modal */}
      <ScoringMethodologyModal
        open={isMethodologyOpen}
        onOpenChange={setIsMethodologyOpen}
      />
    </div>
  );
}
