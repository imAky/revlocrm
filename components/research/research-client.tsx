"use client";

import { useState, useMemo } from "react";
import confetti from "canvas-confetti";
import {
  Compass,
  Search,
  MapPin,
  Sparkles,
  Layers,
  UploadCloud,
  Plus,
  CheckCircle2,
  Clock,
  ExternalLink,
  Copy,
  Check,
  Star,
  Trash2,
  Edit,
  Filter,
  Building2,
  Flame,
  ArrowUpRight,
  RefreshCw,
  Globe,
  Share2,
  FileSpreadsheet,
  BarChart3,
  CheckSquare,
  Square,
  User,
  Tag,
  AlertTriangle,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { KeywordGeneratorModal } from "./keyword-generator-modal";
import { BulkImportModal } from "./bulk-import-modal";
import {
  ResearchKeywordItem,
  createKeywordAction,
  updateKeywordStatusAction,
  recordKeywordSearchAction,
  updateKeywordAction,
  deleteKeywordAction,
  bulkDeleteKeywordsAction,
  bulkUpdateKeywordsStatusAction,
  incrementKeywordProspectCountAction,
  linkExistingProspectToKeywordAction,
} from "@/lib/actions/research";
import { createProspectAction } from "@/lib/actions/prospects";

export interface ExistingProspectOption {
  id: string;
  name: string;
  niche?: string | null;
  city?: string | null;
  state?: string | null;
  phone?: string | null;
  website?: string | null;
  leadSource?: string | null;
}

interface ResearchClientProps {
  initialKeywords: ResearchKeywordItem[];
  existingProspects?: ExistingProspectOption[];
  workspaceId: string;
  currentUserId: string;
}

export function ResearchClient({
  initialKeywords = [],
  existingProspects = [],
  workspaceId,
  currentUserId,
}: ResearchClientProps) {
  const [keywords, setKeywords] = useState<ResearchKeywordItem[]>(initialKeywords);

  // Filter & Sort States
  const [activeTab, setActiveTab] = useState<"ALL" | "PENDING" | "SEARCHED" | "FAVORITE">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNiche, setSelectedNiche] = useState("ALL");
  const [selectedEngine, setSelectedEngine] = useState("ALL");
  const [leadsFilter, setLeadsFilter] = useState<"ALL" | "HAS_LEADS" | "NO_LEADS" | "HIGH_YIELD">("ALL");
  const [sortOption, setSortOption] = useState<"MOST_LEADS" | "LEAST_LEADS" | "NEWEST" | "LAST_SEARCHED" | "ALPHABETICAL">("NEWEST");

  // Selection for bulk operations
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal States
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isSingleAddOpen, setIsSingleAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isQuickLeadOpen, setIsQuickLeadOpen] = useState(false);

  // Forms
  const [singleForm, setSingleForm] = useState({
    keyword: "",
    niche: "",
    city: "",
    state: "",
    searchEngine: "GOOGLE_MAPS",
    notes: "",
  });

  const [editingKeyword, setEditingKeyword] = useState<ResearchKeywordItem | null>(null);
  const [editForm, setEditForm] = useState({
    keyword: "",
    niche: "",
    city: "",
    state: "",
    searchEngine: "GOOGLE_MAPS",
    notes: "",
  });

  // Quick Lead / Associate Modal States
  const [activeLeadKeyword, setActiveLeadKeyword] = useState<ResearchKeywordItem | null>(null);
  const [leadModalTab, setLeadModalTab] = useState<"LINK" | "CREATE">("LINK");
  const [prospectSearchQuery, setProspectSearchQuery] = useState("");
  const [selectedProspectId, setSelectedProspectId] = useState<string | null>(null);

  const [quickLeadForm, setQuickLeadForm] = useState({
    name: "",
    niche: "",
    city: "",
    state: "",
    phone: "",
    websiteUrl: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Copy Feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Dynamic statistics
  const stats = useMemo(() => {
    const total = keywords.length;
    const pending = keywords.filter((k) => k.status === "PENDING").length;
    const searched = keywords.filter((k) => k.status === "SEARCHED").length;
    const favorite = keywords.filter((k) => k.status === "FAVORITE").length;
    const withLeads = keywords.filter((k) => (k.prospectsFoundCount || 0) > 0).length;
    const totalLeadsFound = keywords.reduce((acc, k) => acc + (k.prospectsFoundCount || 0), 0);
    const completionRate = total > 0 ? Math.round((searched / total) * 100) : 0;

    return { total, pending, searched, favorite, withLeads, totalLeadsFound, completionRate };
  }, [keywords]);

  // Unique Niches for Filter Pills
  const availableNiches = useMemo(() => {
    const set = new Set<string>();
    keywords.forEach((k) => {
      if (k.niche) set.add(k.niche);
    });
    return Array.from(set).sort();
  }, [keywords]);

  // Filtered and Sorted List
  const filteredKeywords = useMemo(() => {
    const list = keywords.filter((item) => {
      // Tab filter
      if (activeTab === "PENDING" && item.status !== "PENDING") return false;
      if (activeTab === "SEARCHED" && item.status !== "SEARCHED") return false;
      if (activeTab === "FAVORITE" && item.status !== "FAVORITE") return false;

      // Leads count filter
      const leadCount = item.prospectsFoundCount || 0;
      if (leadsFilter === "HAS_LEADS" && leadCount === 0) return false;
      if (leadsFilter === "NO_LEADS" && leadCount > 0) return false;
      if (leadsFilter === "HIGH_YIELD" && leadCount < 3) return false;

      // Niche filter
      if (selectedNiche !== "ALL" && item.niche?.toLowerCase() !== selectedNiche.toLowerCase()) {
        return false;
      }

      // Search engine filter
      if (selectedEngine !== "ALL" && item.searchEngine !== selectedEngine) {
        return false;
      }

      // Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchKeyword = item.keyword.toLowerCase().includes(q);
        const matchNiche = item.niche?.toLowerCase().includes(q);
        const matchCity = item.city?.toLowerCase().includes(q);
        const matchNotes = item.notes?.toLowerCase().includes(q);
        if (!matchKeyword && !matchNiche && !matchCity && !matchNotes) {
          return false;
        }
      }

      return true;
    });

    // Sorting
    return list.sort((a, b) => {
      if (sortOption === "MOST_LEADS") {
        return (b.prospectsFoundCount || 0) - (a.prospectsFoundCount || 0);
      }
      if (sortOption === "LEAST_LEADS") {
        return (a.prospectsFoundCount || 0) - (b.prospectsFoundCount || 0);
      }
      if (sortOption === "LAST_SEARCHED") {
        const timeA = a.lastSearchedAt ? new Date(a.lastSearchedAt).getTime() : 0;
        const timeB = b.lastSearchedAt ? new Date(b.lastSearchedAt).getTime() : 0;
        return timeB - timeA;
      }
      if (sortOption === "ALPHABETICAL") {
        return a.keyword.localeCompare(b.keyword);
      }
      // Default: NEWEST
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [keywords, activeTab, selectedNiche, selectedEngine, leadsFilter, searchQuery, sortOption]);

  // 1-Click Launchers (opens search and records lastSearchedAt without forcing status to done)
  const handleLaunchGoogleMaps = async (item: ResearchKeywordItem) => {
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.keyword)}`;
    window.open(mapsUrl, "_blank", "noopener,noreferrer");

    setKeywords((prev) =>
      prev.map((k) =>
        k.id === item.id
          ? { ...k, lastSearchedAt: new Date() }
          : k
      )
    );
  };

  const handleLaunchGoogleSearch = async (item: ResearchKeywordItem) => {
    const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(item.keyword)}`;
    window.open(googleUrl, "_blank", "noopener,noreferrer");

    setKeywords((prev) =>
      prev.map((k) =>
        k.id === item.id
          ? { ...k, lastSearchedAt: new Date() }
          : k
      )
    );
  };

  const handleLaunchYelp = (item: ResearchKeywordItem) => {
    const yelpUrl = `https://www.yelp.com/search?find_desc=${encodeURIComponent(item.keyword)}`;
    window.open(yelpUrl, "_blank", "noopener,noreferrer");
  };

  // Status Toggles
  const handleToggleStatus = async (item: ResearchKeywordItem) => {
    const nextStatus = item.status === "SEARCHED" ? "PENDING" : "SEARCHED";
    if (nextStatus === "SEARCHED") {
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.8 } });
    }

    setKeywords((prev) =>
      prev.map((k) =>
        k.id === item.id
          ? {
              ...k,
              status: nextStatus,
              lastSearchedAt: nextStatus === "SEARCHED" ? new Date() : k.lastSearchedAt,
            }
          : k
      )
    );

    await updateKeywordStatusAction(item.id, nextStatus);
  };

  const handleToggleFavorite = async (item: ResearchKeywordItem) => {
    const nextStatus = item.status === "FAVORITE" ? "PENDING" : "FAVORITE";
    setKeywords((prev) =>
      prev.map((k) => (k.id === item.id ? { ...k, status: nextStatus } : k))
    );
    await updateKeywordStatusAction(item.id, nextStatus);
  };

  const handleCopyKeyword = (item: ResearchKeywordItem) => {
    navigator.clipboard.writeText(item.keyword);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Single Add Submit
  const handleSingleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleForm.keyword.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await createKeywordAction({
        keyword: singleForm.keyword,
        niche: singleForm.niche || undefined,
        city: singleForm.city || undefined,
        state: singleForm.state || undefined,
        searchEngine: singleForm.searchEngine,
        notes: singleForm.notes || undefined,
        status: "PENDING",
      });

      if (res.success && res.id) {
        const newItem: ResearchKeywordItem = {
          id: res.id,
          workspaceId,
          userId: currentUserId,
          userName: "You",
          keyword: singleForm.keyword.trim(),
          normalizedKeyword: singleForm.keyword.trim().toLowerCase(),
          niche: singleForm.niche.trim() || null,
          city: singleForm.city.trim() || null,
          state: singleForm.state.trim() || null,
          country: "US",
          status: "PENDING",
          searchEngine: singleForm.searchEngine,
          prospectsFoundCount: 0,
          notes: singleForm.notes.trim() || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setKeywords([newItem, ...keywords]);
        setIsSingleAddOpen(false);
        setSingleForm({
          keyword: "",
          niche: "",
          city: "",
          state: "",
          searchEngine: "GOOGLE_MAPS",
          notes: "",
        });
      } else {
        alert(res.error || "Failed to create keyword");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit Submit
  const handleOpenEdit = (item: ResearchKeywordItem) => {
    setEditingKeyword(item);
    setEditForm({
      keyword: item.keyword,
      niche: item.niche || "",
      city: item.city || "",
      state: item.state || "",
      searchEngine: item.searchEngine,
      notes: item.notes || "",
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingKeyword || !editForm.keyword.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await updateKeywordAction({
        id: editingKeyword.id,
        keyword: editForm.keyword,
        niche: editForm.niche,
        city: editForm.city,
        state: editForm.state,
        searchEngine: editForm.searchEngine,
        notes: editForm.notes,
      });

      if (res.success) {
        setKeywords((prev) =>
          prev.map((k) =>
            k.id === editingKeyword.id
              ? {
                  ...k,
                  keyword: editForm.keyword.trim(),
                  niche: editForm.niche.trim() || null,
                  city: editForm.city.trim() || null,
                  state: editForm.state.trim() || null,
                  searchEngine: editForm.searchEngine,
                  notes: editForm.notes.trim() || null,
                  updatedAt: new Date(),
                }
              : k
          )
        );
        setIsEditOpen(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Keyword
  const handleDeleteKeyword = async (id: string, name: string) => {
    if (!confirm(`Delete keyword target "${name}"?`)) return;
    setKeywords((prev) => prev.filter((k) => k.id !== id));
    await deleteKeywordAction(id);
  };

  // Bulk Operations
  const handleSelectAll = () => {
    if (selectedIds.size === filteredKeywords.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredKeywords.map((k) => k.id)));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkMarkSearched = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    setKeywords((prev) =>
      prev.map((k) =>
        selectedIds.has(k.id)
          ? { ...k, status: "SEARCHED", lastSearchedAt: new Date() }
          : k
      )
    );
    setSelectedIds(new Set());
    await bulkUpdateKeywordsStatusAction(ids, "SEARCHED");
  };

  const handleBulkMarkPending = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    setKeywords((prev) =>
      prev.map((k) => (selectedIds.has(k.id) ? { ...k, status: "PENDING" } : k))
    );
    setSelectedIds(new Set());
    await bulkUpdateKeywordsStatusAction(ids, "PENDING");
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (!confirm(`Delete ${ids.length} selected keywords?`)) return;

    setKeywords((prev) => prev.filter((k) => !selectedIds.has(k.id)));
    setSelectedIds(new Set());
    await bulkDeleteKeywordsAction(ids);
  };

  // Filter existing prospects for quick link search
  const filteredExistingProspects = useMemo(() => {
    if (!prospectSearchQuery.trim()) return existingProspects;
    const q = prospectSearchQuery.toLowerCase();
    return existingProspects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.city && p.city.toLowerCase().includes(q)) ||
        (p.niche && p.niche.toLowerCase().includes(q)) ||
        (p.state && p.state.toLowerCase().includes(q))
    );
  }, [existingProspects, prospectSearchQuery]);

  // Quick Lead Modal
  const handleOpenQuickLead = (item: ResearchKeywordItem) => {
    setActiveLeadKeyword(item);
    setLeadModalTab(existingProspects.length > 0 ? "LINK" : "CREATE");
    setProspectSearchQuery("");
    setSelectedProspectId(existingProspects.length > 0 ? existingProspects[0].id : null);
    setQuickLeadForm({
      name: "",
      niche: item.niche || "",
      city: item.city || "",
      state: item.state || "",
      phone: "",
      websiteUrl: "",
    });
    setIsQuickLeadOpen(true);
  };

  // Link Existing Prospect Action
  const handleLinkExistingProspectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProspectId || !activeLeadKeyword) return;

    setIsSubmitting(true);
    try {
      const res = await linkExistingProspectToKeywordAction({
        keywordId: activeLeadKeyword.id,
        prospectId: selectedProspectId,
      });

      if (res.success) {
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
        setKeywords((prev) =>
          prev.map((k) =>
            k.id === activeLeadKeyword.id
              ? {
                  ...k,
                  lastSearchedAt: new Date(),
                  prospectsFoundCount: (k.prospectsFoundCount || 0) + 1,
                }
              : k
          )
        );
        setIsQuickLeadOpen(false);
      } else {
        alert(res.error || "Failed to link prospect");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create Brand New Prospect Action
  const handleQuickLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickLeadForm.name.trim() || !activeLeadKeyword) return;

    setIsSubmitting(true);
    try {
      const res = await createProspectAction({
        name: quickLeadForm.name.trim(),
        niche: quickLeadForm.niche.trim() || undefined,
        city: quickLeadForm.city.trim() || undefined,
        state: quickLeadForm.state.trim() || undefined,
        phone: quickLeadForm.phone.trim() || undefined,
        website: quickLeadForm.websiteUrl.trim() || undefined,
        leadSource: `Market Research: ${activeLeadKeyword.keyword}`,
      });

      if (res.success) {
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
        // Increment discovery counter
        await incrementKeywordProspectCountAction(activeLeadKeyword.id);
        setKeywords((prev) =>
          prev.map((k) =>
            k.id === activeLeadKeyword.id
              ? {
                  ...k,
                  lastSearchedAt: new Date(),
                  prospectsFoundCount: (k.prospectsFoundCount || 0) + 1,
                }
              : k
          )
        );
        setIsQuickLeadOpen(false);
      } else {
        alert(res.error || "Failed to save prospect");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-full pb-16">
      {/* 1. Header Command Center */}
      <div className="rounded-3xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#121218] p-5 sm:p-7 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-indigo-500/10 via-violet-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-sky-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
                <Compass className="h-5 w-5 animate-spin-slow" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                  <span>Market Research & Target Keywords</span>
                  <Badge variant="purple" className="text-[10px] uppercase font-mono">
                    Discovery Radar
                  </Badge>
                </h1>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Generate combinatorial local search targets, launch 1-click Google Maps / Web searches, and track research coverage.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsBulkImportOpen(true)}
              className="gap-1.5 text-xs font-semibold rounded-xl border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer shadow-2xs"
            >
              <UploadCloud className="h-4 w-4 text-sky-500" />
              <span>Bulk AI / Comma Paste</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsSingleAddOpen(true)}
              className="gap-1.5 text-xs font-semibold rounded-xl border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer shadow-2xs"
            >
              <Plus className="h-4 w-4 text-primary" />
              <span>Single Keyword</span>
            </Button>

            <Button
              size="sm"
              variant="gradient"
              onClick={() => setIsGeneratorOpen(true)}
              className="gap-1.5 text-xs font-bold rounded-xl shadow-md cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              <span>Matrix Generator</span>
            </Button>
          </div>
        </div>

        {/* 2. Executive Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-slate-100 dark:border-zinc-800/80">
          {/* Total Keywords */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/60 dark:border-zinc-800">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span className="font-semibold text-foreground/80">Total Targets</span>
              <Compass className="h-3.5 w-3.5 text-indigo-500" />
            </div>
            <div className="text-xl font-bold text-foreground">{stats.total}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Tracked keywords</div>
          </div>

          {/* Research Queue (Pending) */}
          <div
            onClick={() => setActiveTab("PENDING")}
            className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20 hover:border-amber-500/40 transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between text-xs text-amber-600 dark:text-amber-400 mb-1">
              <span className="font-semibold">Research Queue</span>
              <Clock className="h-3.5 w-3.5 text-amber-500" />
            </div>
            <div className="text-xl font-bold text-amber-600 dark:text-amber-400">{stats.pending}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Need to search next</div>
          </div>

          {/* Searched & Completed */}
          <div
            onClick={() => setActiveTab("SEARCHED")}
            className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 hover:border-emerald-500/40 transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 mb-1">
              <span className="font-semibold">Completed Searches</span>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            </div>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
              {stats.searched}{" "}
              <span className="text-xs font-normal text-muted-foreground">({stats.completionRate}%)</span>
            </div>
            <div className="w-full bg-emerald-500/20 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all"
                style={{ width: `${stats.completionRate}%` }}
              />
            </div>
          </div>

          {/* Discovered Leads */}
          <div className="p-3.5 rounded-2xl bg-violet-500/5 border border-violet-500/20">
            <div className="flex items-center justify-between text-xs text-violet-600 dark:text-violet-400 mb-1">
              <span className="font-semibold">Leads Discovered</span>
              <Building2 className="h-3.5 w-3.5 text-violet-500" />
            </div>
            <div className="text-xl font-bold text-violet-600 dark:text-violet-400">{stats.totalLeadsFound}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Added to CRM Pipeline</div>
          </div>
        </div>
      </div>

      {/* 3. Filter Navigation & Search Toolbar */}
      <div className="p-4 rounded-3xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#121218] shadow-xs space-y-4">
        {/* Navigation Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-muted/60 dark:bg-zinc-900 border border-border/80 text-xs overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab("ALL")}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "ALL"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All Targets ({stats.total})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("PENDING")}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "PENDING"
                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Need to Search ({stats.pending})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("SEARCHED")}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "SEARCHED"
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Searched / Done ({stats.searched})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("FAVORITE")}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "FAVORITE"
                  ? "bg-amber-500 text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              High Yield ({stats.favorite})
            </button>
          </div>

          {/* Search Engine & Sorting Selectors */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Sort Selector Dropdown */}
            <div className="flex items-center gap-1.5">
              <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground hidden sm:block" />
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as any)}
                className="h-8 px-2.5 rounded-xl bg-card dark:bg-zinc-900 border border-border/80 text-xs text-foreground dark:text-zinc-100 shadow-2xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="MOST_LEADS">🔥 Most Leads Discovered</option>
                <option value="LEAST_LEADS">🌱 Least Leads (0 to High)</option>
                <option value="LAST_SEARCHED">⏱️ Recently Searched</option>
                <option value="NEWEST">✨ Newest Targets First</option>
                <option value="ALPHABETICAL">🔤 Alphabetical (A - Z)</option>
              </select>
            </div>

            {/* Search Engine Selector */}
            <select
              value={selectedEngine}
              onChange={(e) => setSelectedEngine(e.target.value)}
              className="h-8 px-2.5 rounded-xl bg-card dark:bg-zinc-900 border border-border/80 text-xs text-foreground dark:text-zinc-100 shadow-2xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="ALL">All Search Engines</option>
              <option value="GOOGLE_MAPS">Google Maps</option>
              <option value="GOOGLE_SEARCH">Google Search</option>
              <option value="YELP">Yelp</option>
              <option value="LINKEDIN">LinkedIn</option>
            </select>
          </div>
        </div>

        {/* Leads Count Filter Strip & Search Toolbar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-1 border-t border-border/40">
          {/* Leads Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[11px] font-semibold text-muted-foreground mr-1 hidden sm:inline">
              Leads:
            </span>
            <button
              type="button"
              onClick={() => setLeadsFilter("ALL")}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-medium border transition-all cursor-pointer whitespace-nowrap ${
                leadsFilter === "ALL"
                  ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                  : "bg-muted/50 dark:bg-zinc-900/60 border-border/80 text-muted-foreground hover:text-foreground"
              }`}
            >
              All Targets
            </button>

            <button
              type="button"
              onClick={() => setLeadsFilter("HAS_LEADS")}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-medium border transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                leadsFilter === "HAS_LEADS"
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                  : "bg-muted/50 dark:bg-zinc-900/60 border-border/80 text-emerald-600 dark:text-emerald-400 hover:text-foreground"
              }`}
            >
              <span>With Leads</span>
              <span className="text-[10px] opacity-80">({stats.withLeads})</span>
            </button>

            <button
              type="button"
              onClick={() => setLeadsFilter("HIGH_YIELD")}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-medium border transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                leadsFilter === "HIGH_YIELD"
                  ? "bg-violet-600 text-white border-violet-600 shadow-2xs"
                  : "bg-muted/50 dark:bg-zinc-900/60 border-border/80 text-violet-600 dark:text-violet-400 hover:text-foreground"
              }`}
            >
              <span>High Yield (≥3)</span>
            </button>

            <button
              type="button"
              onClick={() => setLeadsFilter("NO_LEADS")}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-medium border transition-all cursor-pointer whitespace-nowrap ${
                leadsFilter === "NO_LEADS"
                  ? "bg-amber-600 text-white border-amber-600 shadow-2xs"
                  : "bg-muted/50 dark:bg-zinc-900/60 border-border/80 text-muted-foreground hover:text-foreground"
              }`}
            >
              Untapped (0 Leads)
            </button>
          </div>

          {/* Niche Pills */}
          {availableNiches.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none max-w-full">
              <button
                type="button"
                onClick={() => setSelectedNiche("ALL")}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-medium border transition-all cursor-pointer whitespace-nowrap ${
                  selectedNiche === "ALL"
                    ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                    : "bg-muted/50 dark:bg-zinc-900/60 border-border/80 text-muted-foreground hover:text-foreground"
                }`}
              >
                All Niches
              </button>
              {availableNiches.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setSelectedNiche(n)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-medium border transition-all cursor-pointer whitespace-nowrap ${
                    selectedNiche.toLowerCase() === n.toLowerCase()
                      ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                      : "bg-muted/50 dark:bg-zinc-900/60 border-border/80 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search keyword target, city, or niche notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs bg-background/90 dark:bg-zinc-950/90 rounded-xl"
          />
        </div>

        {/* Bulk Action Controls Bar (shown when items are selected) */}
        {selectedIds.size > 0 && (
          <div className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 animate-in fade-in duration-200">
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              {selectedIds.size} keyword targets selected
            </span>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleBulkMarkSearched}
                className="h-7 text-xs gap-1 rounded-lg border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
              >
                <CheckCircle2 className="h-3 w-3" />
                <span>Mark as Searched</span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={handleBulkMarkPending}
                className="h-7 text-xs gap-1 rounded-lg border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
              >
                <Clock className="h-3 w-3" />
                <span>Reset to Queue</span>
              </Button>

              <Button
                size="sm"
                variant="ghost"
                onClick={handleBulkDelete}
                className="h-7 text-xs gap-1 rounded-lg text-rose-500 hover:bg-rose-500/10"
              >
                <Trash2 className="h-3 w-3" />
                <span>Delete</span>
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Keywords Target List Table */}
      <div className="rounded-3xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-[#121218] overflow-hidden shadow-xs">
        {filteredKeywords.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="h-12 w-12 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <Compass className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">No keyword targets match your search</p>
              <p className="text-xs text-muted-foreground pt-0.5">
                {keywords.length === 0
                  ? "Generate your first combinatorial search matrix or paste a list of keywords to start prospecting."
                  : "Try switching tabs or clearing your search filter."}
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                size="sm"
                variant="gradient"
                onClick={() => setIsGeneratorOpen(true)}
                className="text-xs gap-1.5 rounded-xl cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Generate Variations</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-900/60 text-slate-500 dark:text-zinc-400 font-semibold">
                  <th className="py-3.5 pl-4 pr-2 w-8">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="cursor-pointer text-muted-foreground hover:text-foreground"
                    >
                      {selectedIds.size === filteredKeywords.length && filteredKeywords.length > 0 ? (
                        <CheckSquare className="h-4 w-4 text-primary" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                  </th>
                  <th className="py-3.5 px-3">
                    <button
                      type="button"
                      onClick={() => setSortOption((prev) => (prev === "ALPHABETICAL" ? "NEWEST" : "ALPHABETICAL"))}
                      className="cursor-pointer flex items-center gap-1.5 hover:text-foreground transition-colors group"
                    >
                      <span>Keyword Query Target</span>
                      {sortOption === "ALPHABETICAL" ? (
                        <ChevronUp className="h-3.5 w-3.5 text-primary" />
                      ) : (
                        <ArrowUpDown className="h-3 w-3 text-muted-foreground/60 group-hover:text-foreground" />
                      )}
                    </button>
                  </th>
                  <th className="py-3.5 px-3">Niche / Industry</th>
                  <th className="py-3.5 px-3">Status & Workflow</th>
                  <th className="py-3.5 px-3">
                    <button
                      type="button"
                      onClick={() =>
                        setSortOption((prev) => (prev === "MOST_LEADS" ? "LEAST_LEADS" : "MOST_LEADS"))
                      }
                      className="cursor-pointer flex items-center gap-1.5 hover:text-foreground transition-colors group"
                    >
                      <span>Leads Discovered</span>
                      {sortOption === "MOST_LEADS" ? (
                        <ChevronDown className="h-3.5 w-3.5 text-emerald-500" />
                      ) : sortOption === "LEAST_LEADS" ? (
                        <ChevronUp className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <ArrowUpDown className="h-3 w-3 text-muted-foreground/60 group-hover:text-foreground" />
                      )}
                    </button>
                  </th>
                  <th className="py-3.5 px-3 text-center">1-Click Launchers</th>
                  <th className="py-3.5 pr-4 pl-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                {filteredKeywords.map((item) => {
                  const isSelected = selectedIds.has(item.id);
                  const isSearched = item.status === "SEARCHED";
                  const isFavorite = item.status === "FAVORITE";
                  const isItemCopied = copiedId === item.id;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/70 dark:hover:bg-zinc-900/40 transition-colors ${
                        isSelected ? "bg-indigo-500/5 dark:bg-indigo-500/10" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 pl-4 pr-2">
                        <button
                          type="button"
                          onClick={() => handleToggleSelect(item.id)}
                          className="cursor-pointer text-muted-foreground hover:text-foreground"
                        >
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-primary" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                      </td>

                      {/* Keyword Title & Notes */}
                      <td className="py-3 px-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-zinc-100 text-xs sm:text-sm tracking-tight">
                              {item.keyword}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyKeyword(item)}
                              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 cursor-pointer"
                              title="Copy Keyword"
                            >
                              {isItemCopied ? (
                                <Check className="h-3 w-3 text-emerald-500" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </button>
                          </div>

                          {item.notes && (
                            <p className="text-[11px] text-muted-foreground line-clamp-1">
                              {item.notes}
                            </p>
                          )}

                          {item.lastSearchedAt && (
                            <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Clock className="h-2.5 w-2.5" />
                              <span>Last Searched: {new Date(item.lastSearchedAt).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Niche Tag */}
                      <td className="py-3 px-3">
                        {item.niche ? (
                          <Badge
                            variant="secondary"
                            className="text-[10px] font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20"
                          >
                            {item.niche}
                          </Badge>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* Status Toggle Badge */}
                      <td className="py-3 px-3">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(item)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                            isSearched
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                              : isFavorite
                              ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/25"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20"
                          }`}
                          title="Click to toggle status"
                        >
                          {isSearched ? (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Searched / Done</span>
                            </>
                          ) : (
                            <>
                              <Clock className="h-3.5 w-3.5" />
                              <span>In Queue</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Leads Discovered Counter */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-mono font-bold text-xs ${
                              item.prospectsFoundCount > 0
                                ? "text-violet-600 dark:text-violet-400"
                                : "text-muted-foreground"
                            }`}
                          >
                            {item.prospectsFoundCount || 0} leads
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenQuickLead(item)}
                            className="p-1 rounded-md text-primary hover:bg-primary/10 cursor-pointer"
                            title="Add Found Lead"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* 1-Click Launchers */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Google Maps Button */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleLaunchGoogleMaps(item)}
                            className="h-7 px-2 text-[11px] font-semibold gap-1 rounded-lg border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/5 hover:bg-rose-500/15 cursor-pointer shadow-2xs"
                            title="Open in Google Maps"
                          >
                            <MapPin className="h-3 w-3" />
                            <span>Maps</span>
                            <ArrowUpRight className="h-2.5 w-2.5 opacity-60" />
                          </Button>

                          {/* Google Search Button */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleLaunchGoogleSearch(item)}
                            className="h-7 px-2 text-[11px] font-semibold gap-1 rounded-lg border-sky-500/30 text-sky-600 dark:text-sky-400 bg-sky-500/5 hover:bg-sky-500/15 cursor-pointer shadow-2xs"
                            title="Search Google"
                          >
                            <Search className="h-3 w-3" />
                            <span>Google</span>
                            <ArrowUpRight className="h-2.5 w-2.5 opacity-60" />
                          </Button>

                          {/* Yelp Button */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleLaunchYelp(item)}
                            className="h-7 w-7 p-0 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 rounded-lg cursor-pointer"
                            title="Search Yelp"
                          >
                            <Globe className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>

                      {/* Actions: Star, Edit, Delete */}
                      <td className="py-3 pr-4 pl-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleToggleFavorite(item)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              isFavorite
                                ? "text-amber-500 bg-amber-500/10"
                                : "text-muted-foreground hover:text-amber-500 hover:bg-muted"
                            }`}
                            title={isFavorite ? "Remove from Starred" : "Star as High-Yield"}
                          >
                            <Star className={`h-3.5 w-3.5 ${isFavorite ? "fill-amber-500" : ""}`} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted cursor-pointer transition-colors"
                            title="Edit Target"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteKeyword(item.id, item.keyword)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer transition-colors"
                            title="Delete Target"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5. MODAL: COMBINATORIAL MATRIX GENERATOR                                   */}
      {/* ========================================================================= */}
      <KeywordGeneratorModal
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
        onSuccess={(added, dupes) => {
          confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
          window.location.reload();
        }}
      />

      {/* ========================================================================= */}
      {/* 6. MODAL: BULK AI & COMMA IMPORTER                                        */}
      {/* ========================================================================= */}
      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        onSuccess={(added, dupes) => {
          confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
          window.location.reload();
        }}
      />

      {/* ========================================================================= */}
      {/* 7. MODAL: ADD SINGLE KEYWORD                                              */}
      {/* ========================================================================= */}
      <Dialog open={isSingleAddOpen} onOpenChange={setIsSingleAddOpen}>
        <DialogContent className="w-[95vw] sm:max-w-md p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#121218] text-foreground dark:text-zinc-100 border border-slate-200/90 dark:border-zinc-800 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg font-bold text-foreground dark:text-zinc-100">
              Add Single Target Keyword
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Add an individual search query to your research database.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSingleAdd} className="space-y-3.5 text-xs">
            <div>
              <label className="block mb-1 font-semibold text-foreground">
                Keyword Query *
              </label>
              <Input
                required
                placeholder="e.g. emergency roofing contractor Dallas TX"
                value={singleForm.keyword}
                onChange={(e) => setSingleForm({ ...singleForm, keyword: e.target.value })}
                className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block mb-1 font-semibold text-foreground">
                  Niche / Industry
                </label>
                <Input
                  placeholder="e.g. Roofing"
                  value={singleForm.niche}
                  onChange={(e) => setSingleForm({ ...singleForm, niche: e.target.value })}
                  className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold text-foreground">
                  Target Engine
                </label>
                <select
                  value={singleForm.searchEngine}
                  onChange={(e) => setSingleForm({ ...singleForm, searchEngine: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl bg-background/90 dark:bg-zinc-950/90 border border-border/80 text-xs text-foreground dark:text-zinc-100 shadow-2xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="GOOGLE_MAPS">Google Maps</option>
                  <option value="GOOGLE_SEARCH">Google Search</option>
                  <option value="YELP">Yelp</option>
                  <option value="LINKEDIN">LinkedIn</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block mb-1 font-semibold text-foreground">Notes</label>
              <Input
                placeholder="Target criteria, competitor notes, etc."
                value={singleForm.notes}
                onChange={(e) => setSingleForm({ ...singleForm, notes: e.target.value })}
                className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsSingleAddOpen(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="gradient"
                disabled={isSubmitting}
                className="rounded-xl shadow-sm"
              >
                Add Target
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* 8. MODAL: EDIT KEYWORD                                                    */}
      {/* ========================================================================= */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="w-[95vw] sm:max-w-md p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#121218] text-foreground dark:text-zinc-100 border border-slate-200/90 dark:border-zinc-800 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg font-bold text-foreground dark:text-zinc-100">
              Edit Keyword Target
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Update keyword text, niche category, and notes.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block mb-1 font-semibold text-foreground">
                Keyword Query *
              </label>
              <Input
                required
                value={editForm.keyword}
                onChange={(e) => setEditForm({ ...editForm, keyword: e.target.value })}
                className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block mb-1 font-semibold text-foreground">
                  Niche / Industry
                </label>
                <Input
                  value={editForm.niche}
                  onChange={(e) => setEditForm({ ...editForm, niche: e.target.value })}
                  className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                />
              </div>

              <div>
                <label className="block mb-1 font-semibold text-foreground">
                  Target Engine
                </label>
                <select
                  value={editForm.searchEngine}
                  onChange={(e) => setEditForm({ ...editForm, searchEngine: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl bg-background/90 dark:bg-zinc-950/90 border border-border/80 text-xs text-foreground dark:text-zinc-100 shadow-2xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="GOOGLE_MAPS">Google Maps</option>
                  <option value="GOOGLE_SEARCH">Google Search</option>
                  <option value="YELP">Yelp</option>
                  <option value="LINKEDIN">LinkedIn</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block mb-1 font-semibold text-foreground">Notes</label>
              <Input
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="gradient"
                disabled={isSubmitting}
                className="rounded-xl shadow-sm"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* 9. MODAL: QUICK ADD / ASSOCIATE PROSPECT FOUND FROM KEYWORD                */}
      {/* ========================================================================= */}
      <Dialog open={isQuickLeadOpen} onOpenChange={setIsQuickLeadOpen}>
        <DialogContent className="w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#121218] text-foreground dark:text-zinc-100 border border-slate-200/90 dark:border-zinc-800 shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3 pb-2 border-b border-border/60">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-primary text-white flex items-center justify-center shadow-md shadow-primary/20 shrink-0">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold text-foreground dark:text-zinc-100">
                  Associate Found Lead
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Keyword Target: <strong className="text-foreground">{activeLeadKeyword?.keyword}</strong>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-muted/60 dark:bg-zinc-900 border border-border/80 text-xs">
            <button
              type="button"
              onClick={() => setLeadModalTab("LINK")}
              className={`py-2 px-3 rounded-xl font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                leadModalTab === "LINK"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Building2 className="h-3.5 w-3.5 text-primary" />
              <span>Select Existing ({existingProspects.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setLeadModalTab("CREATE")}
              className={`py-2 px-3 rounded-xl font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                leadModalTab === "CREATE"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Plus className="h-3.5 w-3.5 text-emerald-500" />
              <span>Create New Company</span>
            </button>
          </div>

          {/* TAB 1: LINK EXISTING PROSPECT */}
          {leadModalTab === "LINK" && (
            <form onSubmit={handleLinkExistingProspectSubmit} className="space-y-3.5 text-xs pt-1">
              {/* Search Box */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search existing companies by name, city, or niche..."
                  value={prospectSearchQuery}
                  onChange={(e) => setProspectSearchQuery(e.target.value)}
                  className="pl-8 h-9 text-xs bg-background/90 dark:bg-zinc-950/90 rounded-xl"
                />
              </div>

              {/* Scrollable List of Existing Prospects */}
              <div className="max-h-56 overflow-y-auto space-y-1.5 p-1 rounded-2xl border border-border/80 bg-muted/20 dark:bg-zinc-950/60">
                {filteredExistingProspects.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground space-y-2">
                    <p className="text-xs font-medium">No existing companies matched your search.</p>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setLeadModalTab("CREATE");
                        setQuickLeadForm((prev) => ({ ...prev, name: prospectSearchQuery }));
                      }}
                      className="text-xs gap-1 rounded-xl"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Create "{prospectSearchQuery}" as New Prospect</span>
                    </Button>
                  </div>
                ) : (
                  filteredExistingProspects.map((p) => {
                    const isSelected = selectedProspectId === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedProspectId(p.id)}
                        className={`p-2.5 rounded-xl border text-xs transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? "bg-primary/10 border-primary shadow-xs ring-1 ring-primary/40"
                            : "bg-card dark:bg-zinc-900 border-border/60 hover:border-border hover:bg-muted/40"
                        }`}
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground truncate">{p.name}</span>
                            {p.niche && (
                              <Badge variant="secondary" className="text-[9px] px-1.5 py-0 font-normal">
                                {p.niche}
                              </Badge>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
                            {(p.city || p.state) && (
                              <span className="inline-flex items-center gap-0.5">
                                <MapPin className="h-2.5 w-2.5 text-rose-400" />
                                <span>{[p.city, p.state].filter(Boolean).join(", ")}</span>
                              </span>
                            )}
                            {p.phone && <span>• {p.phone}</span>}
                            {p.leadSource && (
                              <span className="truncate max-w-[140px] text-primary/80">
                                Source: {p.leadSource}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0">
                          <span
                            className={`h-5 w-5 rounded-full flex items-center justify-center border text-[10px] ${
                              isSelected
                                ? "bg-primary text-white border-primary"
                                : "border-border text-transparent"
                            }`}
                          >
                            ✓
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <DialogFooter className="pt-2 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsQuickLeadOpen(false)}
                  className="rounded-xl cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="gradient"
                  disabled={isSubmitting || !selectedProspectId}
                  className="gap-1.5 rounded-xl shadow-md cursor-pointer"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>
                    {isSubmitting ? "Linking..." : "Associate Lead to Keyword"}
                  </span>
                </Button>
              </DialogFooter>
            </form>
          )}

          {/* TAB 2: CREATE BRAND NEW PROSPECT */}
          {leadModalTab === "CREATE" && (
            <form onSubmit={handleQuickLeadSubmit} className="space-y-3.5 text-xs pt-1">
              <div>
                <label className="block mb-1 font-semibold text-foreground">
                  Company Name <span className="text-rose-500">*</span>
                </label>
                <Input
                  required
                  placeholder="e.g. Apex Premier Roofing LLC"
                  value={quickLeadForm.name}
                  onChange={(e) => setQuickLeadForm({ ...quickLeadForm, name: e.target.value })}
                  className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-semibold text-foreground">Industry</label>
                  <Input
                    value={quickLeadForm.niche}
                    onChange={(e) => setQuickLeadForm({ ...quickLeadForm, niche: e.target.value })}
                    className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block mb-1 font-semibold text-foreground">City</label>
                  <Input
                    value={quickLeadForm.city}
                    onChange={(e) => setQuickLeadForm({ ...quickLeadForm, city: e.target.value })}
                    className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 font-semibold text-foreground">Phone</label>
                  <Input
                    placeholder="e.g. +1 (214) 555-0199"
                    value={quickLeadForm.phone}
                    onChange={(e) => setQuickLeadForm({ ...quickLeadForm, phone: e.target.value })}
                    className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block mb-1 font-semibold text-foreground">Website</label>
                  <Input
                    placeholder="https://..."
                    value={quickLeadForm.websiteUrl}
                    onChange={(e) => setQuickLeadForm({ ...quickLeadForm, websiteUrl: e.target.value })}
                    className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                  />
                </div>
              </div>

              <DialogFooter className="pt-2 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsQuickLeadOpen(false)}
                  className="rounded-xl cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="gradient"
                  disabled={isSubmitting || !quickLeadForm.name.trim()}
                  className="gap-1.5 rounded-xl shadow-md cursor-pointer"
                >
                  <Building2 className="h-4 w-4" />
                  <span>
                    {isSubmitting ? "Saving..." : "Save & Add to CRM Pipeline"}
                  </span>
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
