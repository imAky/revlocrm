"use client";

import { useState, useMemo, useRef } from "react";
import {
  FileText,
  ImageIcon,
  Globe,
  ExternalLink,
  Plus,
  Trash2,
  Edit,
  Pin,
  Search,
  Copy,
  Check,
  Download,
  Eye,
  Layers,
  Sparkles,
  FolderOpen,
  Filter,
  FileCode2,
  Video,
  Share2,
  Calendar,
  User,
  LayoutGrid,
  Table as TableIcon,
  X,
  UploadCloud,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  createProspectMediaAction,
  updateProspectMediaAction,
  deleteProspectMediaAction,
  togglePinMediaAction,
  ProspectMediaItem,
} from "@/lib/actions/media";

export const MEDIA_CATEGORIES = [
  { value: "GENERAL", label: "General Resource", color: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20" },
  { value: "DESIGN", label: "Design & Mockup", color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20" },
  { value: "PROPOSAL", label: "Proposal & Pitch", color: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20" },
  { value: "AUDIT", label: "Audit & Analysis", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
  { value: "CONTRACT", label: "Contract & Legal", color: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20" },
  { value: "RESEARCH", label: "Competitor & Research", color: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20" },
  { value: "ASSET", label: "Brand Asset & Logo", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
];

export const RESOURCE_TYPES = [
  { value: "ALL", label: "All Items" },
  { value: "IMAGE", label: "Images & Screenshots" },
  { value: "PDF", label: "PDFs & Contracts" },
  { value: "DOCUMENT", label: "Documents" },
  { value: "FIGMA", label: "Figma Designs" },
  { value: "DRIVE", label: "Google Drive & Docs" },
  { value: "VIDEO", label: "Videos & Loom" },
  { value: "LINK", label: "Websites & Links" },
];

function formatBytes(bytes?: number | null): string {
  if (!bytes || bytes === 0) return "Cloud Link";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function getResourceBadge(type: string) {
  switch (type.toUpperCase()) {
    case "FIGMA":
      return { label: "Figma", color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30", icon: FileCode2 };
    case "DRIVE":
      return { label: "Google Drive", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30", icon: FolderOpen };
    case "PDF":
      return { label: "PDF Document", color: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30", icon: FileText };
    case "IMAGE":
      return { label: "Image", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30", icon: ImageIcon };
    case "VIDEO":
      return { label: "Video / Loom", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30", icon: Video };
    default:
      return { label: "External Link", color: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30", icon: Globe };
  }
}

export function ProspectMediaTab({
  prospectId,
  initialMedia,
}: {
  prospectId: string;
  initialMedia: ProspectMediaItem[];
}) {
  const [mediaList, setMediaList] = useState<ProspectMediaItem[]>(initialMedia);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("ALL");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [viewMode, setViewMode] = useState<"GRID" | "TABLE">("GRID");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addMode, setAddMode] = useState<"UPLOAD" | "LINK">("UPLOAD");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lightbox State
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [lightboxTitle, setLightboxTitle] = useState<string>("");

  // Edit Modal State
  const [editingItem, setEditingItem] = useState<ProspectMediaItem | null>(null);

  // Add Form State
  const [linkForm, setLinkForm] = useState({
    title: "",
    url: "",
    category: "GENERAL",
    description: "",
    isPinned: false,
  });

  const [uploadForm, setUploadForm] = useState({
    title: "",
    category: "GENERAL",
    description: "",
    isPinned: false,
    fileBase64: "",
    fileName: "",
    fileContentType: "",
    fileSize: 0,
    previewUrl: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = (event.target?.result as string).split(",")[1];
      const preview = URL.createObjectURL(file);
      setUploadForm({
        ...uploadForm,
        title: uploadForm.title || file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
        fileBase64: base64Data,
        fileName: file.name,
        fileContentType: file.type || "application/octet-stream",
        fileSize: file.size,
        previewUrl: preview,
      });
    };
    reader.readAsDataURL(file);
  };

  // Copy Link Handler
  const handleCopy = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Toggle Pin Action
  const handleTogglePin = async (id: string) => {
    const res = await togglePinMediaAction(id, prospectId);
    if (res.success) {
      setMediaList((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, isPinned: res.isPinned ?? !item.isPinned } : item
        )
      );
    }
  };

  // Delete Action
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this resource?")) return;
    const res = await deleteProspectMediaAction(id, prospectId);
    if (res.success) {
      setMediaList((prev) => prev.filter((item) => item.id !== id));
    }
  };

  // Save Link or Upload File
  const handleSaveResource = async () => {
    setIsSubmitting(true);
    try {
      if (addMode === "UPLOAD") {
        if (!uploadForm.fileBase64 || !uploadForm.fileName) {
          alert("Please choose a file to upload.");
          setIsSubmitting(false);
          return;
        }
        if (!uploadForm.title.trim()) {
          alert("Please enter a title.");
          setIsSubmitting(false);
          return;
        }

        const res = await createProspectMediaAction({
          prospectId,
          title: uploadForm.title,
          category: uploadForm.category,
          description: uploadForm.description,
          isPinned: uploadForm.isPinned,
          fileBase64: uploadForm.fileBase64,
          fileName: uploadForm.fileName,
          fileContentType: uploadForm.fileContentType,
        });

        if (res.success && res.mediaId) {
          const newItem: ProspectMediaItem = {
            id: res.mediaId,
            workspaceId: "",
            prospectId,
            userId: null,
            userName: "You",
            title: uploadForm.title,
            description: uploadForm.description,
            type: res.type || (uploadForm.fileContentType.startsWith("image/") ? "IMAGE" : "DOCUMENT"),
            url: res.url || uploadForm.previewUrl || "#",
            fileSize: res.fileSize ?? uploadForm.fileSize,
            mimeType: res.mimeType || uploadForm.fileContentType,
            category: res.category || uploadForm.category,
            isPinned: uploadForm.isPinned,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          setMediaList([newItem, ...mediaList]);
          setIsAddOpen(false);
          setUploadForm({
            title: "",
            category: "GENERAL",
            description: "",
            isPinned: false,
            fileBase64: "",
            fileName: "",
            fileContentType: "",
            fileSize: 0,
            previewUrl: "",
          });
        } else {
          alert(res.error || "Failed to upload file.");
        }
      } else {
        if (!linkForm.url.trim()) {
          alert("Please enter a valid URL.");
          setIsSubmitting(false);
          return;
        }
        if (!linkForm.title.trim()) {
          alert("Please enter a title.");
          setIsSubmitting(false);
          return;
        }

        const res = await createProspectMediaAction({
          prospectId,
          title: linkForm.title,
          category: linkForm.category,
          description: linkForm.description,
          isPinned: linkForm.isPinned,
          url: linkForm.url,
        });

        if (res.success && res.mediaId) {
          const newItem: ProspectMediaItem = {
            id: res.mediaId,
            workspaceId: "",
            prospectId,
            userId: null,
            userName: "You",
            title: linkForm.title,
            description: linkForm.description,
            type: linkForm.url.includes("figma.com")
              ? "FIGMA"
              : linkForm.url.includes("drive.google.com")
              ? "DRIVE"
              : "LINK",
            url: linkForm.url,
            category: linkForm.category,
            isPinned: linkForm.isPinned,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          setMediaList([newItem, ...mediaList]);
          setIsAddOpen(false);
          setLinkForm({
            title: "",
            url: "",
            category: "GENERAL",
            description: "",
            isPinned: false,
          });
        } else {
          alert(res.error || "Failed to save resource.");
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update Media
  const handleUpdate = async () => {
    if (!editingItem) return;
    setIsSubmitting(true);
    try {
      const res = await updateProspectMediaAction({
        id: editingItem.id,
        prospectId,
        title: editingItem.title,
        description: editingItem.description,
        category: editingItem.category,
        url: editingItem.url,
        isPinned: editingItem.isPinned,
      });

      if (res.success) {
        setMediaList((prev) =>
          prev.map((item) => (item.id === editingItem.id ? editingItem : item))
        );
        setEditingItem(null);
      } else {
        alert(res.error || "Failed to update resource.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered List
  const filteredList = useMemo(() => {
    return mediaList.filter((item) => {
      if (selectedType !== "ALL" && item.type.toUpperCase() !== selectedType) {
        return false;
      }
      if (selectedCategory !== "ALL" && item.category !== selectedCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchDesc = item.description?.toLowerCase().includes(q) || false;
        const matchUrl = item.url.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchUrl) return false;
      }
      return true;
    });
  }, [mediaList, selectedType, selectedCategory, searchQuery]);

  const pinnedItems = useMemo(() => {
    return mediaList.filter((item) => item.isPinned);
  }, [mediaList]);

  return (
    <div className="space-y-6">
      {/* 1. Header with Actions */}
      <div className="rounded-3xl border border-border/70 bg-card/80 dark:bg-zinc-900/80 backdrop-blur-xl p-5 sm:p-6 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-indigo-500" />
                <span>Media, Documents & Cloud Resources</span>
              </h2>
              <Badge variant="secondary" className="font-mono text-[10px]">
                {mediaList.length} {mediaList.length === 1 ? "Item" : "Items"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Centralized repository for design mockups, pitch decks, proposals, contracts, research notes, and live cloud links.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Button
              onClick={() => {
                setAddMode("UPLOAD");
                setIsAddOpen(true);
              }}
              size="sm"
              variant="gradient"
              className="gap-1.5 text-xs font-semibold rounded-xl shadow-xs cursor-pointer"
            >
              <UploadCloud className="h-4 w-4" />
              <span>Upload File</span>
            </Button>

            <Button
              onClick={() => {
                setAddMode("LINK");
                setIsAddOpen(true);
              }}
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs font-semibold rounded-xl border-border/80 cursor-pointer shadow-2xs"
            >
              <Plus className="h-4 w-4 text-indigo-500" />
              <span>Add Cloud Link</span>
            </Button>
          </div>
        </div>

        {/* Pinned Quick-Access Strip */}
        {pinnedItems.length > 0 && (
          <div className="pt-3 border-t border-border/40 space-y-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
              <Pin className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
              <span>Pinned Critical Assets ({pinnedItems.length})</span>
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {pinnedItems.map((pin) => {
                const badge = getResourceBadge(pin.type);
                const BadgeIcon = badge.icon;

                return (
                  <div
                    key={pin.id}
                    className="p-3 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-3 group hover:border-amber-500/40 transition-all shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 border ${badge.color}`}>
                        <BadgeIcon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">{pin.title}</p>
                        <span className="text-[10px] text-muted-foreground font-mono">{formatBytes(pin.fileSize)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <a
                        href={pin.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-card dark:bg-zinc-800 border border-border/60 text-foreground hover:text-primary transition-colors"
                        title="Open Resource"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleCopy(pin.id, pin.url)}
                        className="p-1.5 rounded-lg bg-card dark:bg-zinc-800 border border-border/60 text-foreground hover:text-primary transition-colors cursor-pointer"
                        title="Copy URL"
                      >
                        {copiedId === pin.id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 2. Filter, Search & View Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card/60 dark:bg-zinc-900/60 p-3 rounded-2xl border border-border/70 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search resources..."
              className="pl-8 text-xs h-8 rounded-xl bg-card dark:bg-zinc-950 border-border/70"
            />
          </div>

          {/* Type Filter Select */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="h-8 px-2.5 rounded-xl bg-card dark:bg-zinc-950 border border-border/70 text-xs text-foreground dark:text-zinc-100 font-medium focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-2xs"
          >
            {RESOURCE_TYPES.map((t) => (
              <option key={t.value} value={t.value} className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">
                {t.label}
              </option>
            ))}
          </select>

          {/* Category Filter Select */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-8 px-2.5 rounded-xl bg-card dark:bg-zinc-950 border border-border/70 text-xs text-foreground dark:text-zinc-100 font-medium focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-2xs"
          >
            <option value="ALL" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">
              All Categories
            </option>
            {MEDIA_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value} className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 self-end sm:self-auto bg-muted/40 p-1 rounded-xl border border-border/50">
          <button
            type="button"
            onClick={() => setViewMode("GRID")}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              viewMode === "GRID" ? "bg-card dark:bg-zinc-800 text-primary shadow-xs" : "text-muted-foreground hover:text-foreground"
            }`}
            title="Grid View"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("TABLE")}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              viewMode === "TABLE" ? "bg-card dark:bg-zinc-800 text-primary shadow-xs" : "text-muted-foreground hover:text-foreground"
            }`}
            title="Table View"
          >
            <TableIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 3. Media Items Display */}
      {filteredList.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border/70 bg-card/40 p-12 text-center space-y-3">
          <div className="h-12 w-12 rounded-2xl bg-muted/60 text-muted-foreground flex items-center justify-center mx-auto border border-border/40">
            <FolderOpen className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">No resources found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
              Upload design mockups, pitch decks, proposals, contracts, or save external links (Figma, Google Drive, Loom).
            </p>
          </div>
          <Button
            onClick={() => setIsAddOpen(true)}
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs font-semibold rounded-xl"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add First Resource</span>
          </Button>
        </div>
      ) : viewMode === "GRID" ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredList.map((item) => {
            const badge = getResourceBadge(item.type);
            const BadgeIcon = badge.icon;
            const cat = MEDIA_CATEGORIES.find((c) => c.value === item.category) || MEDIA_CATEGORIES[0];
            const isImage = item.type.toUpperCase() === "IMAGE" || item.mimeType?.startsWith("image/");

            return (
              <div
                key={item.id}
                className="rounded-3xl border border-border/70 bg-card/90 dark:bg-zinc-900/90 p-4 space-y-3 relative group hover:border-primary/50 transition-all shadow-xs flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  {/* Top Preview or Visual Icon Header */}
                  {isImage ? (
                    <div
                      onClick={() => {
                        setLightboxUrl(item.url);
                        setLightboxTitle(item.title);
                      }}
                      className="h-36 w-full rounded-2xl overflow-hidden bg-muted/40 relative cursor-pointer group/img border border-border/50"
                    >
                      <img
                        src={item.url}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <Eye className="h-5 w-5" />
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-2xl bg-muted/30 dark:bg-zinc-950/60 border border-border/50 flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 border ${badge.color}`}>
                        <BadgeIcon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <Badge variant="outline" className={`text-[9px] px-1.5 py-0 font-mono font-bold uppercase border ${badge.color}`}>
                          {badge.label}
                        </Badge>
                        <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{formatBytes(item.fileSize)}</p>
                      </div>
                    </div>
                  )}

                  {/* Title & Category */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-foreground truncate" title={item.title}>
                        {item.title}
                      </h4>
                      <button
                        type="button"
                        onClick={() => handleTogglePin(item.id)}
                        className={`p-1 rounded-lg transition-colors cursor-pointer ${
                          item.isPinned ? "text-amber-500" : "text-slate-400 hover:text-amber-500"
                        }`}
                        title={item.isPinned ? "Unpin item" : "Pin to top"}
                      >
                        <Pin className={`h-3.5 w-3.5 ${item.isPinned ? "fill-amber-500" : ""}`} />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant="outline" className={`text-[9px] px-1.5 py-0 border ${cat.color}`}>
                        {cat.label}
                      </Badge>
                    </div>

                    {item.description && (
                      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed pt-0.5">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="pt-2.5 border-t border-border/40 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleCopy(item.id, item.url)}
                      className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      title="Copy URL"
                    >
                      {copiedId === item.id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>

                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                      title="Open in new tab"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>

                    <button
                      type="button"
                      onClick={() => setEditingItem(item)}
                      className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      title="Edit"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="rounded-3xl border border-border/70 bg-card/90 dark:bg-zinc-900/90 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 border-b border-border/60 text-muted-foreground font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3">Resource</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Size</th>
                  <th className="px-4 py-3">Uploaded</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredList.map((item) => {
                  const badge = getResourceBadge(item.type);
                  const BadgeIcon = badge.icon;
                  const cat = MEDIA_CATEGORIES.find((c) => c.value === item.category) || MEDIA_CATEGORIES[0];

                  return (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-semibold text-foreground">
                        <div className="flex items-center gap-2.5 min-w-[200px]">
                          <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 border ${badge.color}`}>
                            <BadgeIcon className="h-3.5 w-3.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-bold text-foreground">{item.title}</p>
                            {item.description && <p className="text-[10px] text-muted-foreground truncate">{item.description}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono">
                        <Badge variant="outline" className={`text-[9px] px-1.5 py-0 border ${badge.color}`}>
                          {badge.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={`text-[9px] px-1.5 py-0 border ${cat.color}`}>
                          {cat.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-mono text-muted-foreground text-[11px]">{formatBytes(item.fileSize)}</td>
                      <td className="px-4 py-3 text-muted-foreground text-[11px]">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleTogglePin(item.id)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              item.isPinned ? "text-amber-500" : "text-muted-foreground hover:text-amber-500"
                            }`}
                            title={item.isPinned ? "Unpin" : "Pin"}
                          >
                            <Pin className={`h-3.5 w-3.5 ${item.isPinned ? "fill-amber-500" : ""}`} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopy(item.id, item.url)}
                            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                            title="Copy URL"
                          >
                            {copiedId === item.id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors"
                            title="Open Link"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                          <button
                            type="button"
                            onClick={() => setEditingItem(item)}
                            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 rounded-lg hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 transition-colors cursor-pointer"
                            title="Delete"
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
        </div>
      )}

      {/* 4. Add Resource Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md rounded-3xl bg-white dark:bg-[#121218] border-slate-200/90 dark:border-zinc-800 p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <FolderOpen className="h-4.5 w-4.5 text-primary" />
              <span>Add Prospect Resource</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Upload local files or link cloud projects (Figma, Google Drive, Loom, Pitch Decks).
            </DialogDescription>
          </DialogHeader>

          {/* Mode Switch Pills */}
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-muted/60 border border-border/60">
            <button
              type="button"
              onClick={() => setAddMode("UPLOAD")}
              className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                addMode === "UPLOAD" ? "bg-white dark:bg-zinc-800 text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Upload Local File
            </button>
            <button
              type="button"
              onClick={() => setAddMode("LINK")}
              className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                addMode === "LINK" ? "bg-white dark:bg-zinc-800 text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              External Cloud Link
            </button>
          </div>

          <div className="space-y-3.5 py-1">
            {addMode === "UPLOAD" ? (
              /* UPLOAD FORM */
              <div className="space-y-3">
                {/* File Dropzone */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border/80 hover:border-primary/60 rounded-2xl p-4 text-center cursor-pointer transition-colors bg-muted/20"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {uploadForm.previewUrl ? (
                    <div className="space-y-2">
                      {uploadForm.fileContentType.startsWith("image/") ? (
                        <img
                          src={uploadForm.previewUrl}
                          alt="Preview"
                          className="h-28 mx-auto object-contain rounded-xl border border-border/50"
                        />
                      ) : (
                        <div className="h-16 w-16 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                          <FileText className="h-8 w-8" />
                        </div>
                      )}
                      <p className="text-xs font-bold text-foreground truncate max-w-[200px] mx-auto">
                        {uploadForm.fileName}
                      </p>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {formatBytes(uploadForm.fileSize)} • Click to change
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-1 py-3">
                      <UploadCloud className="h-8 w-8 mx-auto text-primary" />
                      <p className="text-xs font-bold text-foreground">Click to select file</p>
                      <p className="text-[10px] text-muted-foreground">PNG, JPG, WebP, PDF, Word or Excel</p>
                    </div>
                  )}
                </div>

                {/* Title */}
                <div>
                  <label className="text-[11px] font-bold text-foreground block mb-1">Resource Title *</label>
                  <Input
                    value={uploadForm.title}
                    onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                    placeholder="e.g. Master Proposal Deck 2026"
                    className="text-xs h-8.5 rounded-xl"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="text-[11px] font-bold text-foreground block mb-1">Category</label>
                  <select
                    value={uploadForm.category}
                    onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                    className="w-full h-8.5 px-3 rounded-xl bg-card dark:bg-zinc-900 border border-border/80 text-xs text-foreground dark:text-zinc-100 font-medium focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-2xs"
                  >
                    {MEDIA_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value} className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="text-[11px] font-bold text-foreground block mb-1">Notes / Description (Optional)</label>
                  <Textarea
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                    placeholder="Brief discovery notes or key takeaways..."
                    rows={2}
                    className="text-xs rounded-xl"
                  />
                </div>

                {/* Pin Toggle */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="pinToggleUpload"
                    checked={uploadForm.isPinned}
                    onChange={(e) => setUploadForm({ ...uploadForm, isPinned: e.target.checked })}
                    className="h-4 w-4 rounded accent-primary cursor-pointer"
                  />
                  <label htmlFor="pinToggleUpload" className="text-xs font-semibold text-foreground cursor-pointer">
                    Pin this resource to the top of the prospect overview
                  </label>
                </div>
              </div>
            ) : (
              /* LINK FORM */
              <div className="space-y-3">
                {/* URL */}
                <div>
                  <label className="text-[11px] font-bold text-foreground block mb-1">Resource URL / Link *</label>
                  <Input
                    value={linkForm.url}
                    onChange={(e) => setLinkForm({ ...linkForm, url: e.target.value })}
                    placeholder="https://figma.com/file/... or https://drive.google.com/..."
                    className="text-xs h-8.5 rounded-xl"
                  />
                </div>

                {/* Title */}
                <div>
                  <label className="text-[11px] font-bold text-foreground block mb-1">Title *</label>
                  <Input
                    value={linkForm.title}
                    onChange={(e) => setLinkForm({ ...linkForm, title: e.target.value })}
                    placeholder="e.g. Website Redesign Prototype V1"
                    className="text-xs h-8.5 rounded-xl"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="text-[11px] font-bold text-foreground block mb-1">Category</label>
                  <select
                    value={linkForm.category}
                    onChange={(e) => setLinkForm({ ...linkForm, category: e.target.value })}
                    className="w-full h-8.5 px-3 rounded-xl bg-card dark:bg-zinc-900 border border-border/80 text-xs text-foreground dark:text-zinc-100 font-medium focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-2xs"
                  >
                    {MEDIA_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value} className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="text-[11px] font-bold text-foreground block mb-1">Notes / Description (Optional)</label>
                  <Textarea
                    value={linkForm.description}
                    onChange={(e) => setLinkForm({ ...linkForm, description: e.target.value })}
                    placeholder="Provide context or client access notes..."
                    rows={2}
                    className="text-xs rounded-xl"
                  />
                </div>

                {/* Pin Toggle */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="pinToggleLink"
                    checked={linkForm.isPinned}
                    onChange={(e) => setLinkForm({ ...linkForm, isPinned: e.target.checked })}
                    className="h-4 w-4 rounded accent-primary cursor-pointer"
                  />
                  <label htmlFor="pinToggleLink" className="text-xs font-semibold text-foreground cursor-pointer">
                    Pin this resource to the top of the prospect overview
                  </label>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddOpen(false)}
              className="text-xs h-8.5 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="gradient"
              disabled={isSubmitting}
              onClick={handleSaveResource}
              className="text-xs h-8.5 rounded-xl font-semibold shadow-xs"
            >
              {isSubmitting ? "Saving..." : "Save Resource"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 5. Edit Resource Modal */}
      {editingItem && (
        <Dialog open={Boolean(editingItem)} onOpenChange={() => setEditingItem(null)}>
          <DialogContent className="max-w-md rounded-3xl bg-white dark:bg-[#121218] border-slate-200/90 dark:border-zinc-800 p-6 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <Edit className="h-4.5 w-4.5 text-primary" />
                <span>Edit Resource</span>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 py-1">
              <div>
                <label className="text-[11px] font-bold text-foreground block mb-1">Title *</label>
                <Input
                  value={editingItem.title}
                  onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                  className="text-xs h-8.5 rounded-xl"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-foreground block mb-1">URL / Link *</label>
                <Input
                  value={editingItem.url}
                  onChange={(e) => setEditingItem({ ...editingItem, url: e.target.value })}
                  className="text-xs h-8.5 rounded-xl"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-foreground block mb-1">Category</label>
                <select
                  value={editingItem.category}
                  onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                  className="w-full h-8.5 px-3 rounded-xl bg-card dark:bg-zinc-900 border border-border/80 text-xs text-foreground dark:text-zinc-100 font-medium focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-2xs"
                >
                  {MEDIA_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value} className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-foreground block mb-1">Notes / Description</label>
                <Textarea
                  value={editingItem.description || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  rows={2}
                  className="text-xs rounded-xl"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editPinToggle"
                  checked={editingItem.isPinned}
                  onChange={(e) => setEditingItem({ ...editingItem, isPinned: e.target.checked })}
                  className="h-4 w-4 rounded accent-primary cursor-pointer"
                />
                <label htmlFor="editPinToggle" className="text-xs font-semibold text-foreground cursor-pointer">
                  Pin this resource to the top
                </label>
              </div>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingItem(null)}
                className="text-xs h-8.5 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="gradient"
                disabled={isSubmitting}
                onClick={handleUpdate}
                className="text-xs h-8.5 rounded-xl font-semibold shadow-xs"
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* 6. Image Lightbox Modal */}
      {lightboxUrl && (
        <div
          onClick={() => setLightboxUrl(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[90vh] bg-card dark:bg-zinc-900 rounded-3xl p-4 border border-border/80 shadow-2xl flex flex-col items-center gap-3"
          >
            <div className="w-full flex items-center justify-between border-b border-border/60 pb-2">
              <h4 className="text-xs font-bold text-foreground truncate">{lightboxTitle}</h4>
              <div className="flex items-center gap-2">
                <a
                  href={lightboxUrl}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  title="Open Full Image"
                >
                  <Download className="h-4 w-4" />
                </a>
                <button
                  type="button"
                  onClick={() => setLightboxUrl(null)}
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <img
              src={lightboxUrl}
              alt={lightboxTitle}
              className="max-h-[75vh] w-auto object-contain rounded-2xl border border-border/40"
            />
          </div>
        </div>
      )}
    </div>
  );
}
