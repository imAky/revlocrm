"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  MessageSquare,
  Mail,
  Phone,
  Send,
  Calendar,
  Search,
  Sparkles,
  FileText,
  Clock,
  Plus,
  Trash2,
  X,
  UploadCloud,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Eye,
  CheckCircle2,
  CheckCheck,
  User,
  ArrowRight,
  Filter,
  Pencil,
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
  createActivityAction,
  deleteActivityAction,
  updateActivityAction,
} from "@/lib/actions/activities";

export interface ActivityItem {
  id: string;
  workspaceId: string;
  prospectId: string;
  contactId?: string | null;
  userId: string;
  userName?: string | null;
  type: string;
  title: string;
  description?: string | null;
  outcome?: string | null;
  nextAction?: string | null;
  attachmentUrl?: string | null;
  performedAt: string | Date;
  createdAt: string | Date;
}

interface ProcessedImageData {
  id: string;
  base64: string;
  fileName: string;
  contentType: string;
  previewUrl: string;
  sizeKB: number;
  originalSizeKB: number;
}

function parseAttachmentUrls(attachmentUrl?: string | null): string[] {
  if (!attachmentUrl || typeof attachmentUrl !== "string") return [];
  const trimmed = attachmentUrl.trim();
  if (!trimmed) return [];

  // 1. If stored as JSON array string: ["https://...", "https://..."]
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === "string" && Boolean(item));
      }
    } catch {}
  }

  // 2. If single valid URL or data URI, return directly as single item
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("/")
  ) {
    return [trimmed];
  }

  // 3. Fallback for legacy comma-separated lists (ensure all parts look like URLs)
  if (trimmed.includes(",")) {
    const parts = trimmed.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length > 1 && parts.every((p) => p.startsWith("http") || p.startsWith("/"))) {
      return parts;
    }
  }

  return [trimmed];
}

const ACTIVITY_TYPES = [
  { value: "ALL", label: "All Categories", icon: Filter },
  { value: "NOTE", label: "Internal Notes", icon: FileText, color: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
  { value: "EMAIL", label: "Email Outreach", icon: Mail, color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20" },
  { value: "PHONE", label: "Phone Calls", icon: Phone, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
  { value: "LINKEDIN", label: "LinkedIn Message", icon: Send, color: "text-sky-600 bg-sky-600/10 border-sky-600/20" },
  { value: "WHATSAPP", label: "WhatsApp Chat", icon: MessageSquare, color: "text-teal-500 bg-teal-500/10 border-teal-500/20" },
  { value: "MEETING", label: "Discovery Meeting", icon: Calendar, color: "text-purple-500 bg-purple-500/10 border-purple-500/20" },
  { value: "RESEARCH", label: "Research & Audit", icon: Search, color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
  { value: "PROPOSAL", label: "Proposal / Deck", icon: Sparkles, color: "text-pink-500 bg-pink-500/10 border-pink-500/20" },
  { value: "FOLLOW_UP", label: "Follow-up Touch", icon: Clock, color: "text-orange-500 bg-orange-500/10 border-orange-500/20" },
];

export function ProspectActivitiesTab({
  prospectId,
  prospectName,
  initialActivities = [],
  contactsList = [],
  currentUserId,
}: {
  prospectId: string;
  prospectName: string;
  initialActivities: ActivityItem[];
  contactsList?: { id: string; firstName: string; lastName: string; jobTitle?: string | null }[];
  currentUserId: string;
}) {
  const [activitiesList, setActivitiesList] = useState<ActivityItem[]>(() => {
    return [...initialActivities].sort(
      (a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime()
    );
  });

  // Filter States
  const [selectedType, setSelectedType] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Create Modal States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State (Create)
  const [form, setForm] = useState({
    type: "NOTE",
    title: "",
    description: "",
    outcome: "",
    nextAction: "",
    contactId: "",
    performedAt: new Date().toISOString().slice(0, 16),
  });

  const [formImages, setFormImages] = useState<ProcessedImageData[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit Modal States
  const [editingActivity, setEditingActivity] = useState<ActivityItem | null>(null);
  const [editForm, setEditForm] = useState({
    type: "NOTE",
    title: "",
    description: "",
    outcome: "",
    nextAction: "",
    contactId: "",
    performedAt: new Date().toISOString().slice(0, 16),
  });
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [editNewImages, setEditNewImages] = useState<ProcessedImageData[]>([]);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Lightbox View for Attached Screenshots Gallery
  const [lightboxGallery, setLightboxGallery] = useState<{
    images: string[];
    activeIndex: number;
  } | null>(null);

  // Filtered Activities (Strictly newest first)
  const filteredActivities = useMemo(() => {
    return activitiesList.filter((act) => {
      if (selectedType !== "ALL" && act.type.toUpperCase() !== selectedType.toUpperCase()) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = act.title.toLowerCase().includes(q);
        const matchesDesc = act.description?.toLowerCase().includes(q) || false;
        const matchesOutcome = act.outcome?.toLowerCase().includes(q) || false;
        const matchesNext = act.nextAction?.toLowerCase().includes(q) || false;
        if (!matchesTitle && !matchesDesc && !matchesOutcome && !matchesNext) return false;
      }
      return true;
    });
  }, [activitiesList, selectedType, searchQuery]);

  // Keyboard Navigation for Lightbox Gallery
  const handleNextImage = useCallback(() => {
    setLightboxGallery((prev) => {
      if (!prev || prev.images.length <= 1) return prev;
      const nextIndex = (prev.activeIndex + 1) % prev.images.length;
      return { ...prev, activeIndex: nextIndex };
    });
  }, []);

  const handlePrevImage = useCallback(() => {
    setLightboxGallery((prev) => {
      if (!prev || prev.images.length <= 1) return prev;
      const prevIndex = (prev.activeIndex - 1 + prev.images.length) % prev.images.length;
      return { ...prev, activeIndex: prevIndex };
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxGallery) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNextImage();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrevImage();
      } else if (e.key === "Escape") {
        setLightboxGallery(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxGallery, handleNextImage, handlePrevImage]);

  // Smart Client-Side Image Compression using HTML5 Canvas & WebP:
  const compressSingleFile = (file: File): Promise<ProcessedImageData> => {
    return new Promise((resolve) => {
      const originalSizeKB = Math.round(file.size / 1024);
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const maxDimension = 1280;
          let { width, height } = img;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, width, height);

          let dataUrl = canvas.toDataURL("image/webp", 0.72);
          let contentType = "image/webp";
          if (!dataUrl.startsWith("data:image/webp")) {
            dataUrl = canvas.toDataURL("image/jpeg", 0.75);
            contentType = "image/jpeg";
          }

          const base64Data = dataUrl.split(",")[1];
          const sizeKB = Math.round((base64Data.length * 0.75) / 1024);
          const cleanName = file.name.replace(/\.[^/.]+$/, "") + ".webp";

          resolve({
            id: crypto.randomUUID(),
            base64: base64Data,
            fileName: cleanName,
            contentType,
            previewUrl: dataUrl,
            sizeKB,
            originalSizeKB,
          });
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleProcessMultipleFiles = async (
    files: FileList | null,
    target: "CREATE" | "EDIT"
  ) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (fileArray.length === 0) return;

    const processed = await Promise.all(fileArray.map((f) => compressSingleFile(f)));
    if (target === "CREATE") {
      setFormImages((prev) => [...prev, ...processed]);
    } else {
      setEditNewImages((prev) => [...prev, ...processed]);
    }
  };

  // Submit New Activity Form
  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    setIsSubmitting(true);
    try {
      const attachments = formImages.map((img) => ({
        base64: img.base64,
        fileName: img.fileName,
        contentType: img.contentType,
      }));

      const res = await createActivityAction({
        prospectId,
        contactId: form.contactId || undefined,
        type: form.type,
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        outcome: form.outcome.trim() || undefined,
        nextAction: form.nextAction.trim() || undefined,
        performedAt: form.performedAt ? new Date(form.performedAt) : new Date(),
        attachments: attachments.length > 0 ? attachments : undefined,
      });

      if (res.success) {
        const newActivity: ActivityItem = {
          id: res.activityId || crypto.randomUUID(),
          workspaceId: "",
          prospectId,
          contactId: form.contactId || null,
          userId: currentUserId,
          userName: "You",
          type: form.type,
          title: form.title.trim(),
          description: form.description.trim() || null,
          outcome: form.outcome.trim() || null,
          nextAction: form.nextAction.trim() || null,
          attachmentUrl: res.attachmentUrl,
          performedAt: form.performedAt ? new Date(form.performedAt) : new Date(),
          createdAt: new Date(),
        };

        // Prepend to top so newest is always first!
        setActivitiesList((prev) => [newActivity, ...prev]);

        setForm({
          type: "NOTE",
          title: "",
          description: "",
          outcome: "",
          nextAction: "",
          contactId: "",
          performedAt: new Date().toISOString().slice(0, 16),
        });
        setFormImages([]);
        setIsAddOpen(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Modal
  const handleOpenEditModal = (act: ActivityItem) => {
    setEditingActivity(act);
    setEditForm({
      type: act.type || "NOTE",
      title: act.title || "",
      description: act.description || "",
      outcome: act.outcome || "",
      nextAction: act.nextAction || "",
      contactId: act.contactId || "",
      performedAt: new Date(act.performedAt).toISOString().slice(0, 16),
    });
    setExistingImages(parseAttachmentUrls(act.attachmentUrl));
    setEditNewImages([]);
  };

  // Submit Edit Activity
  const handleUpdateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingActivity || !editForm.title.trim()) return;

    setIsEditSubmitting(true);
    try {
      const newAttachments = editNewImages.map((img) => ({
        base64: img.base64,
        fileName: img.fileName,
        contentType: img.contentType,
      }));

      const res = await updateActivityAction({
        id: editingActivity.id,
        type: editForm.type,
        title: editForm.title.trim(),
        description: editForm.description.trim() || null,
        outcome: editForm.outcome.trim() || null,
        nextAction: editForm.nextAction.trim() || null,
        contactId: editForm.contactId || null,
        performedAt: editForm.performedAt ? new Date(editForm.performedAt) : new Date(),
        existingAttachments: existingImages,
        newAttachments: newAttachments.length > 0 ? newAttachments : undefined,
      });

      if (res.success) {
        setActivitiesList((prev) =>
          prev.map((a) => {
            if (a.id === editingActivity.id) {
              return {
                ...a,
                type: editForm.type,
                title: editForm.title.trim(),
                description: editForm.description.trim() || null,
                outcome: editForm.outcome.trim() || null,
                nextAction: editForm.nextAction.trim() || null,
                contactId: editForm.contactId || null,
                performedAt: editForm.performedAt ? new Date(editForm.performedAt) : new Date(),
                attachmentUrl: res.attachmentUrl,
              };
            }
            return a;
          })
        );

        setEditingActivity(null);
        setEditNewImages([]);
      }
    } finally {
      setIsEditSubmitting(false);
    }
  };

  // Delete Activity
  const handleDeleteActivity = async (actId: string, title: string) => {
    if (!confirm(`Delete activity entry "${title}"?`)) return;
    setActivitiesList((prev) => prev.filter((a) => a.id !== actId));
    await deleteActivityAction(actId);
  };

  const getTypeConfig = (type: string) => {
    const found = ACTIVITY_TYPES.find((t) => t.value.toUpperCase() === type.toUpperCase());
    return (
      found || {
        value: type,
        label: type,
        icon: FileText,
        color: "text-slate-500 bg-slate-500/10 border-slate-500/20",
      }
    );
  };

  return (
    <div className="space-y-4">
      {/* Header & Controls Panel */}
      <div className="rounded-2xl border border-border/60 bg-card/70 p-4 sm:p-5 backdrop-blur-md space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-foreground">Activity & Outreach Timeline</h3>
              <Badge variant="secondary" className="text-[11px] font-mono">
                {activitiesList.length} Total
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground pt-0.5">
              Chronological log of notes, calls, emails, research findings, and screenshot logs for {prospectName}
            </p>
          </div>

          <Button
            size="sm"
            variant="gradient"
            onClick={() => setIsAddOpen(true)}
            className="gap-1.5 text-xs font-semibold rounded-xl shadow-sm self-start sm:self-auto shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Log Activity</span>
          </Button>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
          {/* Category Chips Selector (Scrollable) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
            {ACTIVITY_TYPES.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedType === cat.value;
              const count =
                cat.value === "ALL"
                  ? activitiesList.length
                  : activitiesList.filter((a) => a.type.toUpperCase() === cat.value.toUpperCase()).length;

              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setSelectedType(cat.value)}
                  className={`px-3 py-1 rounded-xl text-xs font-medium inline-flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer border ${
                    isActive
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-muted/50 dark:bg-zinc-900/80 hover:bg-muted text-muted-foreground hover:text-foreground border-border/70"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{cat.label}</span>
                  {count > 0 && (
                    <span
                      className={`h-4 px-1 rounded-full text-[10px] font-mono ${
                        isActive ? "bg-white/20 text-white" : "bg-muted-foreground/10 text-muted-foreground"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search activity notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 pr-2.5 text-xs w-[160px] sm:w-[200px] bg-background/90 dark:bg-zinc-950/90 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Activity Timeline List (Newest on Top) */}
      <div className="space-y-3">
        {filteredActivities.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/80 bg-card/40 p-8 text-center space-y-3">
            <div className="h-10 w-10 mx-auto rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">No activities matching your filter</p>
              <p className="text-xs text-muted-foreground pt-0.5">
                {activitiesList.length === 0
                  ? "Record your first outreach note, call, meeting, or research finding."
                  : "Try switching categories or clearing your search term."}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsAddOpen(true)}
              className="text-xs gap-1.5 rounded-xl"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Log First Activity</span>
            </Button>
          </div>
        ) : (
          filteredActivities.map((act) => {
            const config = getTypeConfig(act.type);
            const Icon = config.icon;
            const attachments = parseAttachmentUrls(act.attachmentUrl);

            return (
              <div
                key={act.id}
                className="rounded-2xl border border-border/70 bg-card/90 p-4 sm:p-5 space-y-3 shadow-xs hover:border-primary/40 transition-all"
              >
                {/* Header Row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border ${
                        config.color || "text-primary bg-primary/10 border-primary/20"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-foreground tracking-tight">
                          {act.title}
                        </span>

                        <Badge
                          variant="outline"
                          className={`text-[10px] font-semibold uppercase font-mono px-2 py-0.5 rounded-md border ${
                            config.color || "text-primary border-primary/30"
                          }`}
                        >
                          {act.type}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <User className="h-3 w-3 text-primary" />
                          <span>{act.userName || "Team Member"}</span>
                        </span>
                        <span>•</span>
                        <span>
                          {new Date(act.performedAt).toLocaleDateString()} at{" "}
                          {new Date(act.performedAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Edit (Pencil) and Delete Buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleOpenEditModal(act)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg"
                      title="Edit Activity"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteActivity(act.id, act.title)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                      title="Delete Activity"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Description Body */}
                {act.description && (
                  <p className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed pl-12">
                    {act.description}
                  </p>
                )}

                {/* Outcome & Next Action Pills */}
                {(act.outcome || act.nextAction) && (
                  <div className="pl-12 flex flex-wrap gap-2 pt-1 text-xs">
                    {act.outcome && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span><strong>Outcome:</strong> {act.outcome}</span>
                      </div>
                    )}
                    {act.nextAction && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-medium">
                        <ArrowRight className="h-3.5 w-3.5" />
                        <span><strong>Next Step:</strong> {act.nextAction}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Attached Screenshot Thumbnails Gallery */}
                {attachments.length > 0 && (
                  <div className="pl-12 pt-1.5 flex flex-wrap gap-2.5">
                    {attachments.map((url, idx) => (
                      <button
                        key={url}
                        type="button"
                        onClick={() =>
                          setLightboxGallery({
                            images: attachments,
                            activeIndex: idx,
                          })
                        }
                        className="relative group rounded-xl overflow-hidden border border-border/80 h-16 w-16 bg-muted hover:border-primary transition-all cursor-pointer shadow-xs"
                      >
                        <img
                          src={url}
                          alt={`Attachment ${idx + 1}`}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                          <Eye className="h-4 w-4" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ========================================================================= */}
      {/* 1. UPGRADED CREATE ACTIVITY MODAL                                         */}
      {/* ========================================================================= */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#121218] text-foreground dark:text-zinc-100 border border-slate-200/90 dark:border-zinc-800 shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3 pb-2 border-b border-border/60">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  Log Activity & Outreach
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Record communication, research note, or meeting findings for {prospectName}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleCreateActivity} className="space-y-3.5 pt-1 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block mb-1.5 font-semibold text-foreground">Activity Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl bg-card dark:bg-zinc-900 border border-border/80 text-xs text-foreground dark:text-zinc-100 shadow-2xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="NOTE" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Internal Research Note</option>
                  <option value="EMAIL" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Email Outreach</option>
                  <option value="PHONE" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Phone Call</option>
                  <option value="LINKEDIN" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">LinkedIn Message</option>
                  <option value="WHATSAPP" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">WhatsApp Chat</option>
                  <option value="MEETING" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Discovery Meeting</option>
                  <option value="RESEARCH" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Research & Audit</option>
                  <option value="PROPOSAL" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Proposal Presentation</option>
                  <option value="FOLLOW_UP" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Follow-up Touchpoint</option>
                </select>
              </div>

              <div>
                <label className="block mb-1.5 font-semibold text-foreground">Date & Time</label>
                <Input
                  type="datetime-local"
                  value={form.performedAt}
                  onChange={(e) => setForm({ ...form, performedAt: e.target.value })}
                  className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                />
              </div>
            </div>

            {contactsList.length > 0 && (
              <div>
                <label className="block mb-1.5 font-semibold text-foreground">Associated Contact (Optional)</label>
                <select
                  value={form.contactId}
                  onChange={(e) => setForm({ ...form, contactId: e.target.value })}
                  className="w-full h-9 px-3 rounded-xl bg-card dark:bg-zinc-900 border border-border/80 text-xs text-foreground dark:text-zinc-100 shadow-2xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">General Company Activity (No specific contact)</option>
                  {contactsList.map((c) => (
                    <option key={c.id} value={c.id} className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">
                      {c.firstName} {c.lastName} {c.jobTitle ? `(${c.jobTitle})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block mb-1.5 font-semibold text-foreground">
                Activity Title / Subject <span className="text-destructive">*</span>
              </label>
              <Input
                required
                placeholder="e.g. Discovery call completed with owner regarding website overhaul"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl font-medium"
              />
            </div>

            <div>
              <label className="block mb-1.5 font-semibold text-foreground">Description & Key Notes</label>
              <Textarea
                rows={3}
                placeholder="Discussed scope, reviewed current website pain points, confirmed interest..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block mb-1.5 font-semibold text-foreground">Outcome / Takeaway</label>
                <Input
                  placeholder="e.g. Interested in SEO + Redesign proposal"
                  value={form.outcome}
                  onChange={(e) => setForm({ ...form, outcome: e.target.value })}
                  className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                />
              </div>

              <div>
                <label className="block mb-1.5 font-semibold text-foreground">Next Action / Follow-up Step</label>
                <Input
                  placeholder="e.g. Send audit deck by Friday morning"
                  value={form.nextAction}
                  onChange={(e) => setForm({ ...form, nextAction: e.target.value })}
                  className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                />
              </div>
            </div>

            {/* Multiple Screenshot Upload Box */}
            <div className="space-y-2 pt-1">
              <label className="block font-semibold text-foreground">Attach Reference Screenshots (Multiple)</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border hover:border-primary rounded-2xl p-4 text-center cursor-pointer transition-colors bg-muted/20"
              >
                <UploadCloud className="h-6 w-6 mx-auto text-primary mb-1" />
                <p className="text-xs font-semibold text-foreground">Click to upload screenshots</p>
                <p className="text-[10px] text-muted-foreground">Automatic WebP compression & Cloudinary upload</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleProcessMultipleFiles(e.target.files, "CREATE")}
                />
              </div>

              {/* Preview Chips */}
              {formImages.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {formImages.map((img, idx) => (
                    <div
                      key={img.id}
                      className="relative group rounded-xl overflow-hidden border border-border/80 h-16 w-16"
                    >
                      <img src={img.previewUrl} alt="Preview" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setFormImages((prev) => prev.filter((_, i) => i !== idx))}
                        className="absolute top-1 right-1 p-0.5 rounded-full bg-black/70 text-white hover:bg-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t border-border/60">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddOpen(false)}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="gradient"
                disabled={isSubmitting}
                className="rounded-xl text-xs font-semibold gap-1.5"
              >
                <CheckCheck className="h-4 w-4" />
                <span>{isSubmitting ? "Saving..." : "Save Activity"}</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* 2. EDIT ACTIVITY MODAL (Pencil Trigger)                                    */}
      {/* ========================================================================= */}
      <Dialog open={Boolean(editingActivity)} onOpenChange={(open) => !open && setEditingActivity(null)}>
        <DialogContent className="w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#121218] text-foreground dark:text-zinc-100 border border-slate-200/90 dark:border-zinc-800 shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3 pb-2 border-b border-border/60">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
                <Pencil className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  Edit Activity Record
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Update activity details, notes, outcomes, or attachments
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {editingActivity && (
            <form onSubmit={handleUpdateActivity} className="space-y-3.5 pt-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1.5 font-semibold text-foreground">Activity Type</label>
                  <select
                    value={editForm.type}
                    onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl bg-card dark:bg-zinc-900 border border-border/80 text-xs text-foreground dark:text-zinc-100 shadow-2xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  >
                    <option value="NOTE" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Internal Research Note</option>
                    <option value="EMAIL" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Email Outreach</option>
                    <option value="PHONE" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Phone Call</option>
                    <option value="LINKEDIN" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">LinkedIn Message</option>
                    <option value="WHATSAPP" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">WhatsApp Chat</option>
                    <option value="MEETING" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Discovery Meeting</option>
                    <option value="RESEARCH" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Research & Audit</option>
                    <option value="PROPOSAL" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Proposal Presentation</option>
                    <option value="FOLLOW_UP" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Follow-up Touchpoint</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1.5 font-semibold text-foreground">Date & Time</label>
                  <Input
                    type="datetime-local"
                    value={editForm.performedAt}
                    onChange={(e) => setEditForm({ ...editForm, performedAt: e.target.value })}
                    className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                  />
                </div>
              </div>

              {contactsList.length > 0 && (
                <div>
                  <label className="block mb-1.5 font-semibold text-foreground">Associated Contact (Optional)</label>
                  <select
                    value={editForm.contactId}
                    onChange={(e) => setEditForm({ ...editForm, contactId: e.target.value })}
                    className="w-full h-9 px-3 rounded-xl bg-card dark:bg-zinc-900 border border-border/80 text-xs text-foreground dark:text-zinc-100 shadow-2xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  >
                    <option value="" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">General Company Activity (No specific contact)</option>
                    {contactsList.map((c) => (
                      <option key={c.id} value={c.id} className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">
                        {c.firstName} {c.lastName} {c.jobTitle ? `(${c.jobTitle})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block mb-1.5 font-semibold text-foreground">
                  Activity Title / Subject <span className="text-destructive">*</span>
                </label>
                <Input
                  required
                  placeholder="Activity Title"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block mb-1.5 font-semibold text-foreground">Description & Key Notes</label>
                <Textarea
                  rows={3}
                  placeholder="Activity description..."
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1.5 font-semibold text-foreground">Outcome / Takeaway</label>
                  <Input
                    placeholder="Outcome..."
                    value={editForm.outcome}
                    onChange={(e) => setEditForm({ ...editForm, outcome: e.target.value })}
                    className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block mb-1.5 font-semibold text-foreground">Next Action / Follow-up Step</label>
                  <Input
                    placeholder="Next step..."
                    value={editForm.nextAction}
                    onChange={(e) => setEditForm({ ...editForm, nextAction: e.target.value })}
                    className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                  />
                </div>
              </div>

              {/* Existing & New Attachments */}
              <div className="space-y-2 pt-1">
                <label className="block font-semibold text-foreground">Attached Screenshots</label>

                {/* Existing Attached Images */}
                {existingImages.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[11px] text-muted-foreground">Current attachments:</span>
                    <div className="flex flex-wrap gap-2">
                      {existingImages.map((url, idx) => (
                        <div
                          key={url}
                          className="relative group rounded-xl overflow-hidden border border-border/80 h-16 w-16"
                        >
                          <img src={url} alt="Attachment" className="h-full w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setExistingImages((prev) => prev.filter((_, i) => i !== idx))}
                            className="absolute top-1 right-1 p-0.5 rounded-full bg-black/70 text-white hover:bg-destructive cursor-pointer"
                            title="Remove attachment"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload New Additional Images */}
                <div
                  onClick={() => editFileInputRef.current?.click()}
                  className="border-2 border-dashed border-border hover:border-primary rounded-2xl p-3 text-center cursor-pointer transition-colors bg-muted/20"
                >
                  <UploadCloud className="h-5 w-5 mx-auto text-primary mb-0.5" />
                  <p className="text-xs font-semibold text-foreground">Click to upload additional screenshots</p>
                  <input
                    ref={editFileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleProcessMultipleFiles(e.target.files, "EDIT")}
                  />
                </div>

                {/* New Image Preview Chips */}
                {editNewImages.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {editNewImages.map((img, idx) => (
                      <div
                        key={img.id}
                        className="relative group rounded-xl overflow-hidden border border-border/80 h-16 w-16"
                      >
                        <img src={img.previewUrl} alt="New Preview" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setEditNewImages((prev) => prev.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 p-0.5 rounded-full bg-black/70 text-white hover:bg-destructive cursor-pointer"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingActivity(null)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="gradient"
                  disabled={isEditSubmitting}
                  className="rounded-xl text-xs font-semibold gap-1.5"
                >
                  <CheckCheck className="h-4 w-4" />
                  <span>{isEditSubmitting ? "Saving..." : "Save Changes"}</span>
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* 3. LIGHTBOX GALLERY MODAL                                                 */}
      {/* ========================================================================= */}
      {lightboxGallery && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[99999] bg-black/95 backdrop-blur-md flex flex-col items-center justify-between p-4 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setLightboxGallery(null)}
        >
          {/* Top Bar */}
          <div
            className="w-full flex items-center justify-between text-white/80 max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 text-xs font-medium">
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-white font-mono">
                {lightboxGallery.activeIndex + 1} / {lightboxGallery.images.length}
              </span>
              <span className="hidden sm:inline text-white/60">
                (Use ← / → arrow keys to navigate, Esc to close)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={lightboxGallery.images[lightboxGallery.activeIndex]}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Open original in new tab"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
              <button
                type="button"
                onClick={() => setLightboxGallery(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-destructive text-white transition-colors"
                title="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Central Image View with Navigation Arrows */}
          <div
            className="relative flex-1 w-full max-w-5xl flex items-center justify-center my-3"
            onClick={(e) => e.stopPropagation()}
          >
            {lightboxGallery.images.length > 1 && (
              <button
                type="button"
                onClick={handlePrevImage}
                className="absolute left-2 sm:left-4 z-10 p-2.5 sm:p-3 rounded-2xl bg-black/60 hover:bg-black/90 text-white border border-white/20 hover:scale-105 transition-all shadow-xl"
                title="Previous Image (←)"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}

            <img
              src={lightboxGallery.images[lightboxGallery.activeIndex]}
              alt="Screenshot Preview"
              className="max-h-[72vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl border border-white/10"
            />

            {lightboxGallery.images.length > 1 && (
              <button
                type="button"
                onClick={handleNextImage}
                className="absolute right-2 sm:right-4 z-10 p-2.5 sm:p-3 rounded-2xl bg-black/60 hover:bg-black/90 text-white border border-white/20 hover:scale-105 transition-all shadow-xl"
                title="Next Image (→)"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}
          </div>

          {/* Bottom Thumbnail Strip */}
          {lightboxGallery.images.length > 1 && (
            <div
              className="flex items-center gap-2 overflow-x-auto p-2 bg-black/50 rounded-2xl border border-white/10 max-w-2xl scrollbar-none"
              onClick={(e) => e.stopPropagation()}
            >
              {lightboxGallery.images.map((img, idx) => (
                <button
                  key={img}
                  type="button"
                  onClick={() =>
                    setLightboxGallery((prev) => (prev ? { ...prev, activeIndex: idx } : null))
                  }
                  className={`relative rounded-lg overflow-hidden h-12 w-12 border-2 shrink-0 transition-all ${
                    idx === lightboxGallery.activeIndex
                      ? "border-primary scale-105 ring-2 ring-primary/40"
                      : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt={`Thumbnail ${idx + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
