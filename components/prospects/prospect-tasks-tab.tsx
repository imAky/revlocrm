"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import confetti from "canvas-confetti";
import {
  CalendarCheck2,
  Building2,
  AlertCircle,
  CheckCircle2,
  Plus,
  Trash2,
  Clock,
  User,
  FileText,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  Check,
  Flame,
  Sparkles,
  RotateCcw,
  Save,
  Layers,
  Zap,
  ImageIcon,
  UploadCloud,
  History,
  MessageSquare,
  ExternalLink,
  Send,
  Eye,
  CheckCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createTaskAction,
  updateTaskStatusAction,
  updateTaskAction,
  deleteTaskAction,
  completeTaskWithLogAction,
  reopenTaskAction,
  addTaskLogAction,
  deleteTaskLogAttachmentAction,
  deleteTaskLogAction,
  TaskLogItem,
} from "@/lib/actions/tasks";
import { TaskItem, UserOption } from "@/components/tasks/tasks-client-list";

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

export function ProspectTasksTab({
  prospectId,
  prospectName,
  initialTasks = [],
  initialLogs = [],
  workspaceUsers = [],
  currentUserId,
}: {
  prospectId: string;
  prospectName: string;
  initialTasks: TaskItem[];
  initialLogs?: TaskLogItem[];
  workspaceUsers: { id: string; name: string; email?: string | null }[];
  currentUserId: string;
}) {
  // Filter States
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "COMPLETED">("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal & Expand States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<string>>(new Set());
  const [taskActiveTab, setTaskActiveTab] = useState<Record<string, "NOTES" | "LOGS">>({});

  // Dynamic In-memory Task Logs cache (sorted newest first)
  const [taskLogsMap, setTaskLogsMap] = useState<Record<string, TaskLogItem[]>>(() => {
    const map: Record<string, TaskLogItem[]> = {};
    initialLogs.forEach((log) => {
      if (!map[log.taskId]) map[log.taskId] = [];
      map[log.taskId].push(log);
    });
    // Ensure newest first (descending by createdAt)
    Object.keys(map).forEach((k) => {
      map[k].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    });
    return map;
  });

  // Inline Note Editing States (taskId -> note text)
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null);

  // Completion Log Dialog Modal State (multiple images supported)
  const [completingTask, setCompletingTask] = useState<TaskItem | null>(null);
  const [completionNote, setCompletionNote] = useState("");
  const [completionImages, setCompletionImages] = useState<ProcessedImageData[]>([]);
  const [isCompletingSubmitting, setIsCompletingSubmitting] = useState(false);
  const completionFileInputRef = useRef<HTMLInputElement>(null);

  // Inline New Comment/Log State per Task
  const [inlineNewLogText, setInlineNewLogText] = useState<Record<string, string>>({});
  const [inlineLogImages, setInlineLogImages] = useState<Record<string, ProcessedImageData[]>>({});
  const [addingLogTaskId, setAddingLogTaskId] = useState<string | null>(null);

  // Lightbox View for Attached Screenshots Gallery
  const [lightboxGallery, setLightboxGallery] = useState<{
    images: string[];
    activeIndex: number;
  } | null>(null);

  // Create Task Modal Form State
  const [form, setForm] = useState({
    title: "",
    description: "",
    assignedToId: currentUserId,
    priority: "MEDIUM" as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
    dueDate: "",
  });

  const now = new Date();

  // Helper: Is task due today?
  const isDueToday = (dueDate?: string | Date | null) => {
    if (!dueDate) return false;
    const d = new Date(dueDate);
    return (
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  };

  // Dynamic Stats Calculations
  const stats = useMemo(() => {
    const total = initialTasks.length;
    const pending = initialTasks.filter((t) => t.status !== "COMPLETED" && t.status !== "CANCELLED").length;
    const completed = initialTasks.filter((t) => t.status === "COMPLETED").length;
    const urgentOrHigh = initialTasks.filter(
      (t) => (t.priority === "URGENT" || t.priority === "HIGH") && t.status !== "COMPLETED"
    ).length;

    return { total, pending, completed, urgentOrHigh };
  }, [initialTasks]);

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    return initialTasks.filter((t) => {
      // Status Filter
      if (statusFilter === "PENDING" && (t.status === "COMPLETED" || t.status === "CANCELLED")) {
        return false;
      }
      if (statusFilter === "COMPLETED" && t.status !== "COMPLETED") {
        return false;
      }

      // Priority Filter
      if (priorityFilter !== "ALL" && t.priority !== priorityFilter) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesDesc = t.description?.toLowerCase().includes(q) || false;
        if (!matchesTitle && !matchesDesc) return false;
      }

      return true;
    });
  }, [initialTasks, statusFilter, priorityFilter, searchQuery]);

  const toggleTaskExpand = (taskId: string, initialDesc?: string | null) => {
    setExpandedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
        if (editingNotes[taskId] === undefined && initialDesc) {
          setEditingNotes((n) => ({ ...n, [taskId]: initialDesc }));
        }
      }
      return next;
    });
  };

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

  // Trigger physics confetti burst
  const triggerConfettiCelebration = (event?: React.MouseEvent) => {
    let originX = 0.5;
    let originY = 0.5;

    if (event && event.currentTarget) {
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      originX = (rect.left + rect.width / 2) / window.innerWidth;
      originY = (rect.top + rect.height / 2) / window.innerHeight;
    }

    try {
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { x: originX, y: originY },
        colors: [
          "#10b981",
          "#6366f1",
          "#f59e0b",
          "#ec4899",
          "#8b5cf6",
          "#3b82f6",
          "#14b8a6",
        ],
        startVelocity: 26,
        gravity: 0.85,
        ticks: 200,
        shapes: ["circle", "square"],
        scalar: 1,
        zIndex: 99999,
      });

      setTimeout(() => {
        confetti({
          particleCount: 30,
          spread: 90,
          origin: { x: originX, y: originY },
          colors: ["#fbbf24", "#34d399", "#818cf8", "#f472b6", "#60a5fa"],
          startVelocity: 20,
          gravity: 0.75,
          ticks: 160,
          scalar: 0.85,
          zIndex: 99999,
        });
      }, 100);
    } catch {}
  };

  // Handle task completion or prompt handover log dialog
  const handleCheckboxClick = async (task: TaskItem, e: React.MouseEvent) => {
    if (task.status === "COMPLETED") {
      await reopenTaskAction(task.id);
      return;
    }

    // Open completion log dialog so any user can log resolution & attach screenshots
    setCompletingTask(task);
    setCompletionNote("");
    setCompletionImages([]);
  };

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
    target: "COMPLETION" | "INLINE",
    taskId?: string
  ) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (fileArray.length === 0) return;

    const processed = await Promise.all(fileArray.map((f) => compressSingleFile(f)));

    if (target === "COMPLETION") {
      setCompletionImages((prev) => [...prev, ...processed]);
    } else if (target === "INLINE" && taskId) {
      setInlineLogImages((prev) => ({
        ...prev,
        [taskId]: [...(prev[taskId] || []), ...processed],
      }));
    }
  };

  // Confirm completion of prospect task with log & multiple screenshots
  const handleConfirmCompletionWithLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingTask) return;
    setIsCompletingSubmitting(true);

    try {
      triggerConfettiCelebration();
      const attachments = completionImages.map((img) => ({
        base64: img.base64,
        fileName: img.fileName,
        contentType: img.contentType,
      }));

      const res = await completeTaskWithLogAction({
        taskId: completingTask.id,
        note: completionNote.trim() || undefined,
        attachments: attachments.length > 0 ? attachments : undefined,
      });

      if (res.success) {
        // Optimistically add log
        const currentUser = workspaceUsers.find((u) => u.id === currentUserId);
        const newLog: TaskLogItem = {
          id: crypto.randomUUID(),
          taskId: completingTask.id,
          userId: currentUserId,
          userName: currentUser?.name || "You",
          userEmail: currentUser?.email,
          action: "COMPLETED",
          note: completionNote.trim() || "Marked task as completed",
          attachmentUrl: res.attachmentUrl,
          createdAt: new Date(),
        };

        setTaskLogsMap((prev) => ({
          ...prev,
          [completingTask.id]: [newLog, ...(prev[completingTask.id] || [])],
        }));

        setCompletingTask(null);
        setCompletionNote("");
        setCompletionImages([]);
      }
    } finally {
      setIsCompletingSubmitting(false);
    }
  };

  // Add inline handover comment/log to any task with multiple screenshots
  const handleAddInlineLog = async (taskId: string) => {
    const text = inlineNewLogText[taskId] || "";
    const imgs = inlineLogImages[taskId] || [];
    if (!text.trim() && imgs.length === 0) return;

    setAddingLogTaskId(taskId);
    try {
      const attachments = imgs.map((img) => ({
        base64: img.base64,
        fileName: img.fileName,
        contentType: img.contentType,
      }));

      const res = await addTaskLogAction({
        taskId,
        note: text.trim() || "Added reference screenshots",
        attachments: attachments.length > 0 ? attachments : undefined,
      });

      if (res.success) {
        const currentUser = workspaceUsers.find((u) => u.id === currentUserId);
        const newLog: TaskLogItem = {
          id: res.logId || crypto.randomUUID(),
          taskId,
          userId: currentUserId,
          userName: currentUser?.name || "You",
          userEmail: currentUser?.email,
          action: "COMMENT",
          note: text.trim() || "Added reference screenshots",
          attachmentUrl: res.attachmentUrl,
          createdAt: new Date(),
        };

        setTaskLogsMap((prev) => ({
          ...prev,
          [taskId]: [newLog, ...(prev[taskId] || [])],
        }));

        setInlineNewLogText((prev) => ({ ...prev, [taskId]: "" }));
        setInlineLogImages((prev) => ({ ...prev, [taskId]: [] }));
      }
    } finally {
      setAddingLogTaskId(null);
    }
  };

  // Save Note Inline
  const handleSaveInlineNote = async (taskId: string) => {
    const newNote = editingNotes[taskId] ?? "";
    setSavingNoteId(taskId);
    try {
      await updateTaskAction({ id: taskId, description: newNote });
    } finally {
      setSavingNoteId(null);
    }
  };

  // Create Task Submit
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    setIsSubmitting(true);
    try {
      await createTaskAction({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        prospectId,
        assignedToId: form.assignedToId || undefined,
        priority: form.priority,
        dueDate: form.dueDate ? new Date(form.dueDate) : undefined,
      });

      setForm({
        title: "",
        description: "",
        assignedToId: currentUserId,
        priority: "MEDIUM",
        dueDate: "",
      });
      setIsAddOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Task
  const handleDeleteTask = async (taskId: string, title: string) => {
    if (!confirm(`Delete task "${title}"?`)) return;
    await deleteTaskAction(taskId);
  };

  // Delete Individual Screenshot / Attachment from Task Log
  const handleDeleteLogAttachment = async (taskId: string, logId: string, urlToDelete: string) => {
    if (!confirm("Delete this attached screenshot?")) return;
    const res = await deleteTaskLogAttachmentAction({
      logId,
      attachmentUrlToDelete: urlToDelete,
    });
    if (res.success) {
      setTaskLogsMap((prev) => ({
        ...prev,
        [taskId]: (prev[taskId] || []).map((l) =>
          l.id === logId ? { ...l, attachmentUrl: res.attachmentUrl } : l
        ),
      }));
    }
  };

  // Delete Task Log Entry
  const handleDeleteLog = async (taskId: string, logId: string) => {
    if (!confirm("Delete this log entry?")) return;
    const res = await deleteTaskLogAction(logId);
    if (res.success) {
      setTaskLogsMap((prev) => ({
        ...prev,
        [taskId]: (prev[taskId] || []).filter((l) => l.id !== logId),
      }));
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="rounded-2xl border border-border/60 bg-card/70 p-4 sm:p-5 backdrop-blur-md space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-foreground">Follow-up Tasks & Action Items</h3>
              <Badge variant="secondary" className="text-[11px] font-mono">
                {stats.pending} Pending
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground pt-0.5">
              Collaborative action items, handover notes, and execution logs for {prospectName}
            </p>
          </div>

          <Button
            size="sm"
            variant="gradient"
            onClick={() => setIsAddOpen(true)}
            className="gap-1.5 text-xs font-semibold rounded-xl shadow-sm self-start sm:self-auto shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>New Task</span>
          </Button>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
          {/* Status Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-muted/60 dark:bg-zinc-900 border border-border/80 text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                statusFilter === "ALL"
                  ? "bg-card dark:bg-zinc-800 text-foreground dark:text-zinc-100 shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All ({stats.total})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("PENDING")}
              className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                statusFilter === "PENDING"
                  ? "bg-card dark:bg-zinc-800 text-foreground dark:text-zinc-100 shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Pending ({stats.pending})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("COMPLETED")}
              className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                statusFilter === "COMPLETED"
                  ? "bg-card dark:bg-zinc-800 text-foreground dark:text-zinc-100 shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Completed ({stats.completed})
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="h-8 px-2.5 rounded-lg bg-card dark:bg-zinc-900 border border-border/80 text-xs text-foreground dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-2xs"
            >
              <option value="ALL" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">All Priorities</option>
              <option value="URGENT" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Urgent</option>
              <option value="HIGH" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">High</option>
              <option value="MEDIUM" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Medium</option>
              <option value="LOW" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Low</option>
            </select>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 pr-2.5 text-xs w-[140px] sm:w-[180px] bg-background/90 dark:bg-zinc-950/90 rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Task Cards List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/80 bg-card/40 p-8 text-center space-y-3">
            <div className="h-10 w-10 mx-auto rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <CalendarCheck2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">No tasks matching your filters</p>
              <p className="text-xs text-muted-foreground pt-0.5">
                {initialTasks.length === 0
                  ? "Create the first follow-up or research task for this company."
                  : "Try clearing your status or search filters."}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsAddOpen(true)}
              className="text-xs gap-1.5 rounded-xl"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add First Task</span>
            </Button>
          </div>
        ) : (
          filteredTasks.map((t) => {
            const isCompleted = t.status === "COMPLETED";
            const isExpanded = expandedTaskIds.has(t.id);
            const activeTab = taskActiveTab[t.id] || "LOGS";
            const logs = taskLogsMap[t.id] || [];
            const isOverdue =
              t.dueDate &&
              new Date(t.dueDate) < now &&
              !isCompleted &&
              !isDueToday(t.dueDate);
            const dueToday = isDueToday(t.dueDate) && !isCompleted;

            return (
              <div
                key={t.id}
                className={`rounded-2xl border transition-all ${
                  isCompleted
                    ? "bg-card/40 border-border/40 opacity-75"
                    : isOverdue
                    ? "bg-card/90 border-destructive/30 shadow-xs"
                    : "bg-card/90 border-border/70 shadow-xs hover:border-primary/40"
                }`}
              >
                {/* Main Task Header Row */}
                <div className="p-3.5 sm:p-4 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Interactive Completion Button */}
                    <button
                      type="button"
                      onClick={(e) => handleCheckboxClick(t, e)}
                      className={`mt-0.5 h-5 w-5 rounded-lg flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                        isCompleted
                          ? "bg-emerald-500 text-white shadow-xs"
                          : "border-2 border-border hover:border-primary bg-background/50 hover:bg-primary/10"
                      }`}
                      title={isCompleted ? "Click to reopen task" : "Click to complete with handover note"}
                    >
                      {isCompleted && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                    </button>

                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-sm font-semibold tracking-tight ${
                            isCompleted ? "line-through text-muted-foreground" : "text-foreground"
                          }`}
                        >
                          {t.title}
                        </span>

                        {/* Priority Badge */}
                        <Badge
                          variant={
                            t.priority === "URGENT"
                              ? "destructive"
                              : t.priority === "HIGH"
                              ? "warning"
                              : t.priority === "MEDIUM"
                              ? "secondary"
                              : "outline"
                          }
                          className="text-[10px] px-2 py-0.5 rounded-md font-semibold inline-flex items-center gap-1"
                        >
                          {t.priority === "URGENT" && <Flame className="h-2.5 w-2.5" />}
                          {t.priority === "HIGH" && <AlertCircle className="h-2.5 w-2.5" />}
                          <span>{t.priority}</span>
                        </Badge>

                        {/* Due Date Indicator */}
                        {t.dueDate && (
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md ${
                              isOverdue
                                ? "bg-destructive/10 text-destructive border border-destructive/20 font-semibold"
                                : dueToday
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-semibold"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            <Clock className="h-3 w-3" />
                            {isOverdue ? "Overdue: " : dueToday ? "Due Today: " : "Due: "}
                            {new Date(t.dueDate).toLocaleDateString()}
                          </span>
                        )}

                        {/* Assigned Rep */}
                        {t.assignedToName && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                            <User className="h-3 w-3 text-primary" />
                            <span>{t.assignedToName}</span>
                          </span>
                        )}
                      </div>

                      {/* Summary preview if not expanded */}
                      {!isExpanded && t.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {t.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions & Expand Toggle */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleTaskExpand(t.id, t.description)}
                      className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground gap-1 rounded-lg"
                    >
                      <History className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Activity & Logs</span>
                      {logs.length > 0 && (
                        <span className="h-4 px-1 rounded-full bg-primary/10 text-primary text-[10px] font-mono">
                          {logs.length}
                        </span>
                      )}
                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteTask(t.id, t.title)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                      title="Delete Task"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Expanded Activity Logs & Details Sub-Panel */}
                {isExpanded && (
                  <div className="p-4 border-t border-border/50 bg-background/50 space-y-3 text-xs rounded-b-2xl animate-in fade-in-50 duration-150">
                    {/* Sub Tab Switcher */}
                    <div className="flex items-center justify-between border-b border-border/40 pb-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setTaskActiveTab((prev) => ({ ...prev, [t.id]: "LOGS" }))}
                          className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                            activeTab === "LOGS"
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <History className="h-3.5 w-3.5" />
                          <span>Recent Activity & Logs ({logs.length})</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setTaskActiveTab((prev) => ({ ...prev, [t.id]: "NOTES" }))}
                          className={`px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                            activeTab === "NOTES"
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <FileText className="h-3.5 w-3.5" />
                          <span>Task Description & Notes</span>
                        </button>
                      </div>
                    </div>

                    {/* SUB-TAB 1: LOGS & TIMELINE */}
                    {activeTab === "LOGS" ? (
                      <div className="space-y-3">
                        {/* Inline Add Note / Screenshot Box */}
                        <div className="p-3 rounded-xl bg-card border border-border/80 space-y-2">
                          <Textarea
                            rows={2}
                            placeholder="Add a handover note, update, or finding for this task..."
                            value={inlineNewLogText[t.id] || ""}
                            onChange={(e) =>
                              setInlineNewLogText((prev) => ({ ...prev, [t.id]: e.target.value }))
                            }
                            className="bg-background/90 text-xs border-border/60 rounded-lg resize-none"
                          />

                          {/* Selected inline image chips */}
                          {(inlineLogImages[t.id] || []).length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-1">
                              {inlineLogImages[t.id].map((img, idx) => (
                                <div
                                  key={img.id}
                                  className="relative group rounded-lg overflow-hidden border border-border/80 h-14 w-14"
                                >
                                  <img
                                    src={img.previewUrl}
                                    alt="Preview"
                                    className="h-full w-full object-cover"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setInlineLogImages((prev) => ({
                                        ...prev,
                                        [t.id]: prev[t.id].filter((_, i) => i !== idx),
                                      }))
                                    }
                                    className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/70 text-white hover:bg-destructive"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-1">
                            <label className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer px-2 py-1 rounded-lg hover:bg-muted transition-colors">
                              <ImageIcon className="h-3.5 w-3.5 text-primary" />
                              <span>Attach Screenshots</span>
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={(e) => handleProcessMultipleFiles(e.target.files, "INLINE", t.id)}
                              />
                            </label>

                            <Button
                              size="sm"
                              variant="gradient"
                              disabled={
                                addingLogTaskId === t.id ||
                                (!inlineNewLogText[t.id]?.trim() &&
                                  (inlineLogImages[t.id] || []).length === 0)
                              }
                              onClick={() => handleAddInlineLog(t.id)}
                              className="h-7 px-3 text-xs gap-1 rounded-lg"
                            >
                              <Send className="h-3 w-3" />
                              <span>{addingLogTaskId === t.id ? "Saving..." : "Add Note"}</span>
                            </Button>
                          </div>
                        </div>

                        {/* Historical Log Entries List */}
                        <div className="space-y-2 pt-1">
                          {logs.length === 0 ? (
                            <div className="text-center py-4 text-xs text-muted-foreground">
                              No activity logs yet. Check off task or add an update note above.
                            </div>
                          ) : (
                            logs.map((log) => {
                              const attachments = parseAttachmentUrls(log.attachmentUrl);
                              const isCompletion = log.action === "COMPLETED";

                              return (
                                <div
                                  key={log.id}
                                  className={`p-3 rounded-xl border ${
                                    isCompletion
                                      ? "bg-emerald-500/5 border-emerald-500/20"
                                      : "bg-card border-border/60"
                                  } space-y-1.5`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px]">
                                        {log.userName?.charAt(0).toUpperCase() || "U"}
                                      </div>
                                      <span className="font-semibold text-foreground">
                                        {log.userName || "Team Member"}
                                      </span>
                                      <Badge
                                        variant={isCompletion ? "success" : "secondary"}
                                        className="text-[9px] px-1.5 py-0"
                                      >
                                        {log.action}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[10px] text-muted-foreground">
                                        {new Date(log.createdAt).toLocaleDateString()} at{" "}
                                        {new Date(log.createdAt).toLocaleTimeString([], {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteLog(t.id, log.id)}
                                        className="p-0.5 rounded text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                                        title="Delete Log Entry"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    </div>
                                  </div>

                                  {log.note && (
                                    <p className="text-xs text-foreground/90 whitespace-pre-wrap pl-7">
                                      {log.note}
                                    </p>
                                  )}

                                  {/* Attached Screenshots Gallery */}
                                  {attachments.length > 0 && (
                                    <div className="pl-7 pt-1 flex flex-wrap gap-2">
                                      {attachments.map((url, idx) => (
                                        <div
                                          key={url}
                                          className="relative group/thumb rounded-lg overflow-hidden border border-border/80 h-14 w-14 bg-muted hover:border-primary transition-all"
                                        >
                                          <img
                                            src={url}
                                            alt={`Attachment ${idx + 1}`}
                                            className="h-full w-full object-cover group-hover/thumb:scale-105 transition-transform"
                                          />
                                          <div
                                            onClick={() =>
                                              setLightboxGallery({
                                                images: attachments,
                                                activeIndex: idx,
                                              })
                                            }
                                            className="absolute inset-0 bg-black/30 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
                                          >
                                            <Eye className="h-3.5 w-3.5" />
                                          </div>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleDeleteLogAttachment(t.id, log.id, url);
                                            }}
                                            className="absolute top-0.5 right-0.5 p-0.5 rounded bg-black/75 hover:bg-destructive text-white opacity-0 group-hover/thumb:opacity-100 transition-opacity z-10 cursor-pointer"
                                            title="Delete screenshot"
                                          >
                                            <Trash2 className="h-2.5 w-2.5" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    ) : (
                      /* SUB-TAB 2: TASK DESCRIPTION / EDITABLE NOTE */
                      <div className="space-y-2">
                        <Textarea
                          rows={3}
                          value={editingNotes[t.id] ?? t.description ?? ""}
                          onChange={(e) =>
                            setEditingNotes((prev) => ({ ...prev, [t.id]: e.target.value }))
                          }
                          placeholder="Add instructions, research notes, or context for this task..."
                          className="bg-card text-xs border-border/80 rounded-xl"
                        />
                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            variant="gradient"
                            disabled={savingNoteId === t.id}
                            onClick={() => handleSaveInlineNote(t.id)}
                            className="h-7 px-3 text-xs gap-1 rounded-lg"
                          >
                            <Save className="h-3 w-3" />
                            <span>{savingNoteId === t.id ? "Saving..." : "Save Changes"}</span>
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ========================================================================= */}
      {/* 1. COMPLETION LOG & MULTI-SCREENSHOT MODAL                                */}
      {/* ========================================================================= */}
      <Dialog open={Boolean(completingTask)} onOpenChange={(open) => !open && setCompletingTask(null)}>
        <DialogContent className="w-[95vw] sm:max-w-lg rounded-3xl bg-white dark:bg-[#121218] text-foreground dark:text-zinc-100 border border-slate-200/90 dark:border-zinc-800 shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3 pb-2 border-b border-border/60">
              <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  Complete Task & Log Handover
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Record resolution notes and attach reference screenshots for {prospectName}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {completingTask && (
            <form onSubmit={handleConfirmCompletionWithLog} className="space-y-4 pt-1 text-xs">
              <div className="p-3 rounded-xl bg-muted/40 border border-border/60 space-y-1">
                <span className="font-semibold text-foreground">{completingTask.title}</span>
                {completingTask.description && (
                  <p className="text-muted-foreground text-[11px] line-clamp-2">{completingTask.description}</p>
                )}
              </div>

              <div>
                <label className="block mb-1.5 font-semibold text-foreground">Resolution Note / Outcome</label>
                <Textarea
                  rows={3}
                  placeholder="e.g. Completed audit, spoke with owner John, sent revised quote..."
                  value={completionNote}
                  onChange={(e) => setCompletionNote(e.target.value)}
                  className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                />
              </div>

              {/* Multi-Screenshot File Upload */}
              <div className="space-y-2">
                <label className="block font-semibold text-foreground">Attach Reference Screenshots (Multiple)</label>
                <div
                  onClick={() => completionFileInputRef.current?.click()}
                  className="border-2 border-dashed border-border hover:border-primary rounded-2xl p-4 text-center cursor-pointer transition-colors bg-muted/20"
                >
                  <UploadCloud className="h-6 w-6 mx-auto text-primary mb-1" />
                  <p className="text-xs font-semibold text-foreground">Click to select screenshots</p>
                  <p className="text-[10px] text-muted-foreground">Automatic WebP format compression</p>
                  <input
                    ref={completionFileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleProcessMultipleFiles(e.target.files, "COMPLETION")}
                  />
                </div>

                {/* Image Previews */}
                {completionImages.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {completionImages.map((img, idx) => (
                      <div
                        key={img.id}
                        className="relative group rounded-xl overflow-hidden border border-border/80 h-16 w-16"
                      >
                        <img src={img.previewUrl} alt="Preview" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setCompletionImages((prev) => prev.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 p-0.5 rounded-full bg-black/70 text-white hover:bg-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCompletingTask(null)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="gradient"
                  disabled={isCompletingSubmitting}
                  className="rounded-xl text-xs font-semibold gap-1.5"
                >
                  <CheckCheck className="h-4 w-4" />
                  <span>{isCompletingSubmitting ? "Completing..." : "Complete & Log"}</span>
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* 2. CREATE TASK MODAL (Pre-scoped to company)                              */}
      {/* ========================================================================= */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="w-[95vw] sm:max-w-lg rounded-3xl bg-white dark:bg-[#121218] text-foreground dark:text-zinc-100 border border-slate-200/90 dark:border-zinc-800 shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3 pb-2 border-b border-border/60">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 text-white flex items-center justify-center">
                <Plus className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  Create Task for {prospectName}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Add action item, deadline, and assign to a team member
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleCreateTask} className="space-y-3.5 pt-1 text-xs">
            <div>
              <label className="block mb-1.5 font-semibold text-foreground">
                Task Title <span className="text-destructive">*</span>
              </label>
              <Input
                required
                placeholder="e.g. Call owner to review website redesign proposal"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block mb-1.5 font-semibold text-foreground">Priority Level</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value as any })}
                  className="w-full h-9 px-3 rounded-xl bg-card dark:bg-zinc-900 border border-border/80 text-xs text-foreground dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-2xs"
                >
                  <option value="LOW" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Low Priority</option>
                  <option value="MEDIUM" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Medium Priority</option>
                  <option value="HIGH" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">High Priority</option>
                  <option value="URGENT" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block mb-1.5 font-semibold text-foreground">Due Date</label>
                <Input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="block mb-1.5 font-semibold text-foreground">Assign To</label>
              <select
                value={form.assignedToId}
                onChange={(e) => setForm({ ...form, assignedToId: e.target.value })}
                className="w-full h-9 px-3 rounded-xl bg-card dark:bg-zinc-900 border border-border/80 text-xs text-foreground dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-2xs"
              >
                {workspaceUsers.map((u) => (
                  <option key={u.id} value={u.id} className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-1.5 font-semibold text-foreground">Instructions & Context</label>
              <Textarea
                rows={3}
                placeholder="Add context, talking points, or details for this task..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border/60">
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
                <Plus className="h-4 w-4" />
                <span>{isSubmitting ? "Creating..." : "Create Task"}</span>
              </Button>
            </DialogFooter>
          </form>
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
