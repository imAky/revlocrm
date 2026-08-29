"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
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
  ArrowUpDown,
  Check,
  Flame,
  Sun,
  Briefcase,
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
  Lock,
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
  TaskLogItem,
} from "@/lib/actions/tasks";

export interface TaskItem {
  id: string;
  title: string;
  description?: string | null;
  dueDate?: string | Date | null;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: "TODO" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  prospectId?: string | null;
  prospectName?: string | null;
  assignedToId?: string | null;
  assignedToName?: string | null;
  createdById?: string | null;
  createdAt?: string | Date | null;
  completedAt?: string | Date | null;
}

export interface ProspectOption {
  id: string;
  name: string;
  category?: string | null;
  city?: string | null;
}

export interface UserOption {
  id: string;
  name: string;
  email?: string | null;
}

type MainTab = "ALL" | "MY_DAY" | "WORKSPACE";
type SortOption =
  | "NEWEST"
  | "OLDEST"
  | "DUE_SOON"
  | "DUE_LATE"
  | "PRIORITY"
  | "TITLE_AZ";
type StatusFilter = "ALL_ACTIVE" | "MINE" | "OVERDUE" | "COMPLETED" | "ALL";

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
  if (!attachmentUrl) return [];
  try {
    if (attachmentUrl.startsWith("[")) {
      const parsed = JSON.parse(attachmentUrl);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    }
  } catch {}
  if (attachmentUrl.includes(",")) {
    return attachmentUrl.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [attachmentUrl];
}

export function TasksClientList({
  initialTasks,
  initialLogs = [],
  prospects = [],
  users = [],
  currentUserId,
}: {
  initialTasks: TaskItem[];
  initialLogs?: TaskLogItem[];
  prospects?: ProspectOption[];
  users?: UserOption[];
  currentUserId: string;
}) {
  // Navigation / View Tab
  const [activeMainTab, setActiveMainTab] = useState<MainTab>("ALL");

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL_ACTIVE");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [companyFilter, setCompanyFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<SortOption>("NEWEST");

  // Modal & Expand States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<string>>(new Set());

  // Task active sub-tab inside card: "NOTES" | "LOGS"
  const [taskActiveTab, setTaskActiveTab] = useState<Record<string, "NOTES" | "LOGS">>({});

  // Dynamic In-memory Task Logs cache
  const [taskLogsMap, setTaskLogsMap] = useState<Record<string, TaskLogItem[]>>(() => {
    const map: Record<string, TaskLogItem[]> = {};
    initialLogs.forEach((log) => {
      if (!map[log.taskId]) map[log.taskId] = [];
      map[log.taskId].push(log);
    });
    return map;
  });

  // Inline Note Editing States (taskId -> note text)
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});
  const [savingNoteId, setSavingNoteId] = useState<string | null>(null);

  // Quick Add Form States
  const [quickTitle, setQuickTitle] = useState("");
  const [quickProspectId, setQuickProspectId] = useState<string>("");
  const [quickDueDate, setQuickDueDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [quickPriority, setQuickPriority] = useState<
    "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  >("MEDIUM");
  const [isQuickAdding, setIsQuickAdding] = useState(false);

  // Completion Log Dialog Modal State (multiple images supported)
  const [completingTask, setCompletingTask] = useState<TaskItem | null>(null);
  const [completionNote, setCompletionNote] = useState("");
  const [completionImages, setCompletionImages] = useState<ProcessedImageData[]>([]);
  const [isCompletingSubmitting, setIsCompletingSubmitting] = useState(false);
  const completionFileInputRef = useRef<HTMLInputElement>(null);

  // Inline New Comment/Log State per Task (multiple images supported)
  const [inlineNewLogText, setInlineNewLogText] = useState<Record<string, string>>({});
  const [inlineLogImages, setInlineLogImages] = useState<Record<string, ProcessedImageData[]>>({});
  const [addingLogTaskId, setAddingLogTaskId] = useState<string | null>(null);

  // Lightbox View for Attached Screenshots Gallery
  const [lightboxGallery, setLightboxGallery] = useState<{
    images: string[];
    activeIndex: number;
  } | null>(null);

  // Permission warning toast/message for personal tasks
  const [permissionWarning, setPermissionWarning] = useState<string | null>(null);

  // Create Task Modal Form State
  const [form, setForm] = useState({
    title: "",
    description: "",
    prospectId: "",
    assignedToId: currentUserId,
    priority: "MEDIUM" as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
    dueDate: "",
  });
  const [companySearchInModal, setCompanySearchInModal] = useState("");

  const now = new Date();

  // Helper: Is task personal?
  const isPersonalTask = (t: TaskItem) => !t.prospectId;

  // Helper: Can current user complete this personal task?
  const canCompletePersonalTask = (t: TaskItem) => {
    if (!isPersonalTask(t)) return true; // Prospect tasks can be completed by any user
    return (
      t.createdById === currentUserId ||
      t.assignedToId === currentUserId ||
      !t.assignedToId
    );
  };

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

  // Base Tasks isolated strictly per Active Tab
  const tabBaseTasks = useMemo(() => {
    if (activeMainTab === "MY_DAY") {
      return initialTasks.filter((t) => !t.prospectId);
    } else if (activeMainTab === "WORKSPACE") {
      return initialTasks.filter((t) => Boolean(t.prospectId));
    }
    return initialTasks;
  }, [initialTasks, activeMainTab]);

  // Dynamic Stats Calculations for the Active Tab Scope
  const stats = useMemo(() => {
    const total = tabBaseTasks.length;
    const active = tabBaseTasks.filter(
      (t) => t.status !== "COMPLETED" && t.status !== "CANCELLED"
    ).length;
    const mine = tabBaseTasks.filter(
      (t) => t.assignedToId === currentUserId && t.status !== "COMPLETED"
    ).length;
    const overdue = tabBaseTasks.filter(
      (t) =>
        t.dueDate &&
        new Date(t.dueDate) < now &&
        t.status !== "COMPLETED" &&
        !isDueToday(t.dueDate)
    ).length;
    const urgentOrHigh = tabBaseTasks.filter(
      (t) => (t.priority === "URGENT" || t.priority === "HIGH") && t.status !== "COMPLETED"
    ).length;
    const completed = tabBaseTasks.filter((t) => t.status === "COMPLETED").length;

    // Overall global counts for navigation badges
    const globalPersonalCount = initialTasks.filter(
      (t) => !t.prospectId && t.status !== "COMPLETED"
    ).length;
    const globalProspectCount = initialTasks.filter(
      (t) => Boolean(t.prospectId) && t.status !== "COMPLETED"
    ).length;
    const globalTotalCount = initialTasks.filter(
      (t) => t.status !== "COMPLETED"
    ).length;

    return {
      total,
      active,
      mine,
      overdue,
      urgentOrHigh,
      completed,
      globalPersonalCount,
      globalProspectCount,
      globalTotalCount,
    };
  }, [tabBaseTasks, initialTasks, currentUserId, now]);

  const priorityRank: Record<string, number> = {
    URGENT: 4,
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
  };

  // Filtered and Sorted Tasks within the Tab Scope
  const processedTasks = useMemo(() => {
    return tabBaseTasks
      .filter((t) => {
        // Status Filter
        if (statusFilter === "ALL_ACTIVE") {
          if (t.status === "COMPLETED" || t.status === "CANCELLED") return false;
        } else if (statusFilter === "MINE") {
          if (t.assignedToId !== currentUserId || t.status === "COMPLETED") return false;
        } else if (statusFilter === "OVERDUE") {
          if (
            !t.dueDate ||
            new Date(t.dueDate) >= now ||
            isDueToday(t.dueDate) ||
            t.status === "COMPLETED"
          )
            return false;
        } else if (statusFilter === "COMPLETED") {
          if (t.status !== "COMPLETED") return false;
        }

        // Priority filter
        if (priorityFilter !== "ALL" && t.priority !== priorityFilter) {
          return false;
        }

        // Company filter (Only applicable in Workspace or All tab)
        if (activeMainTab !== "MY_DAY" && companyFilter !== "ALL" && t.prospectId !== companyFilter) {
          return false;
        }

        // Text search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = t.title.toLowerCase().includes(q);
          const matchDesc = t.description?.toLowerCase().includes(q) || false;
          const matchCompany = t.prospectName?.toLowerCase().includes(q) || false;
          const matchAssignee = t.assignedToName?.toLowerCase().includes(q) || false;

          if (!matchTitle && !matchDesc && !matchCompany && !matchAssignee) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "NEWEST": {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
          }
          case "OLDEST": {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateA - dateB;
          }
          case "DUE_SOON": {
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          }
          case "DUE_LATE": {
            if (!a.dueDate) return 1;
            if (!b.dueDate) return -1;
            return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
          }
          case "PRIORITY": {
            const rankA = priorityRank[a.priority] || 0;
            const rankB = priorityRank[b.priority] || 0;
            return rankB - rankA;
          }
          case "TITLE_AZ": {
            return a.title.localeCompare(b.title);
          }
          default:
            return 0;
        }
      });
  }, [
    tabBaseTasks,
    activeMainTab,
    statusFilter,
    priorityFilter,
    companyFilter,
    searchQuery,
    sortBy,
    currentUserId,
    now,
  ]);

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    statusFilter !== "ALL_ACTIVE" ||
    priorityFilter !== "ALL" ||
    (activeMainTab !== "MY_DAY" && companyFilter !== "ALL") ||
    sortBy !== "NEWEST";

  const resetFilters = () => {
    setSearchQuery("");
    setStatusFilter("ALL_ACTIVE");
    setPriorityFilter("ALL");
    setCompanyFilter("ALL");
    setSortBy("NEWEST");
  };

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
      // Reopen task
      if (isPersonalTask(task) && !canCompletePersonalTask(task)) {
        showWarning("Personal tasks can only be updated by the owner.");
        return;
      }
      await reopenTaskAction(task.id);
      return;
    }

    // Checking off a task
    if (isPersonalTask(task)) {
      // Personal task: verify authorization
      if (!canCompletePersonalTask(task)) {
        showWarning("Personal tasks can only be completed by the user who created them.");
        return;
      }
      // Authorized to complete personal task
      triggerConfettiCelebration(e);
      await completeTaskWithLogAction({ taskId: task.id, note: "Completed personal task" });
    } else {
      // Prospect task: open completion log dialog so any user can log their resolution & attach screenshots
      setCompletingTask(task);
      setCompletionNote("");
      setCompletionImages([]);
    }
  };

  const showWarning = (msg: string) => {
    setPermissionWarning(msg);
    setTimeout(() => {
      setPermissionWarning(null);
    }, 3500);
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
        const currentUser = users.find((u) => u.id === currentUserId);
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
          [completingTask.id]: [...(prev[completingTask.id] || []), newLog],
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
        const currentUser = users.find((u) => u.id === currentUserId);
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
          [taskId]: [...(prev[taskId] || []), newLog],
        }));

        setInlineNewLogText((prev) => ({ ...prev, [taskId]: "" }));
        setInlineLogImages((prev) => ({ ...prev, [taskId]: [] }));
      }
    } finally {
      setAddingLogTaskId(null);
    }
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
    files: FileList | File[],
    onAppend: (newImages: ProcessedImageData[]) => void
  ) => {
    const list = Array.from(files);
    if (list.length === 0) return;
    const processed = await Promise.all(list.map((f) => compressSingleFile(f)));
    onAppend(processed);
  };

  // Save Task Note
  const handleSaveNote = async (taskId: string) => {
    const noteText = editingNotes[taskId] ?? "";
    setSavingNoteId(taskId);
    try {
      await updateTaskAction({
        id: taskId,
        description: noteText,
      });
    } finally {
      setSavingNoteId(null);
    }
  };

  // Quick Add for Active Tab
  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    setIsQuickAdding(true);

    try {
      const prospectIdVal =
        activeMainTab === "MY_DAY"
          ? undefined
          : quickProspectId.trim()
          ? quickProspectId.trim()
          : undefined;

      const res = await createTaskAction({
        title: quickTitle.trim(),
        prospectId: prospectIdVal,
        assignedToId: currentUserId,
        priority: quickPriority,
        dueDate: quickDueDate ? new Date(quickDueDate) : undefined,
      });

      setQuickTitle("");
      if (res.success && res.taskId) {
        setExpandedTaskIds((prev) => new Set(prev).add(res.taskId!));
      }
    } finally {
      setIsQuickAdding(false);
    }
  };

  // Open Modal with appropriate default
  const handleOpenModal = () => {
    setForm({
      title: "",
      description: "",
      prospectId: activeMainTab === "MY_DAY" ? "" : prospects[0]?.id || "",
      assignedToId: currentUserId,
      priority: "MEDIUM",
      dueDate: "",
    });
    setCompanySearchInModal("");
    setIsAddOpen(true);
  };

  // Create Task from Modal
  const handleModalCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setIsSubmitting(true);

    try {
      await createTaskAction({
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        prospectId: form.prospectId || undefined,
        assignedToId: form.assignedToId || undefined,
        priority: form.priority,
        dueDate: form.dueDate ? new Date(form.dueDate) : undefined,
      });

      setForm({
        title: "",
        description: "",
        prospectId: "",
        assignedToId: currentUserId,
        priority: "MEDIUM",
        dueDate: "",
      });
      setCompanySearchInModal("");
      setIsAddOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProspectOptionsInModal = prospects.filter(
    (p) =>
      p.name.toLowerCase().includes(companySearchInModal.toLowerCase()) ||
      (p.category && p.category.toLowerCase().includes(companySearchInModal.toLowerCase())) ||
      (p.city && p.city.toLowerCase().includes(companySearchInModal.toLowerCase()))
  );

  const selectedProspectInModal = prospects.find((p) => p.id === form.prospectId);

  // Priority metadata for clean badge styling
  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return {
          label: "Urgent",
          badgeClass:
            "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 dark:border-rose-500/30",
          dotColor: "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-pulse",
        };
      case "HIGH":
        return {
          label: "High",
          badgeClass:
            "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 dark:border-amber-500/30",
          dotColor: "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.5)]",
        };
      case "MEDIUM":
        return {
          label: "Medium",
          badgeClass:
            "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 dark:border-indigo-500/30",
          dotColor: "bg-indigo-500 shadow-[0_0_6px_rgba(99,102,241,0.5)]",
        };
      case "LOW":
      default:
        return {
          label: "Low",
          badgeClass:
            "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20 dark:border-zinc-700/50",
          dotColor: "bg-slate-400 dark:bg-zinc-500",
        };
    }
  };

  const formatTaskDueDate = (dateStr: string | Date) => {
    const d = new Date(dateStr);
    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();
    const isOverdue = d < now && !isToday;

    return {
      formatted: isToday
        ? "Today"
        : d.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
          }),
      isToday,
      isOverdue,
    };
  };

  const formatCreatedDate = (dateStr?: string | Date | null) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    const diffMs = now.getTime() - d.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  return (
    <div className="space-y-6 relative max-w-full pb-12">
      {/* Permission Warning Toast for Personal Task */}
      {permissionWarning && (
        <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-rose-950/90 text-white border border-rose-500/40 shadow-2xl backdrop-blur-xl">
            <Lock className="h-4 w-4 text-rose-400" />
            <span className="text-xs font-semibold">{permissionWarning}</span>
          </div>
        </div>
      )}

      {/* 1. Header Navigation Tabs Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-1.5 rounded-2xl bg-card/60 dark:bg-zinc-900/60 backdrop-blur-xl border border-border/80 shadow-xs">
        {/* Navigation Tabs - Responsive Scroll Container */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/50 dark:bg-zinc-950/60 border border-border/50 max-w-full overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => {
              setActiveMainTab("ALL");
              setCompanyFilter("ALL");
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer shrink-0 ${
              activeMainTab === "ALL"
                ? "bg-card text-foreground shadow-sm border border-border/60"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            }`}
          >
            <Layers className={`h-3.5 w-3.5 ${activeMainTab === "ALL" ? "text-primary" : "text-muted-foreground"}`} />
            <span className="whitespace-nowrap">All Tasks</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-medium ${
              activeMainTab === "ALL"
                ? "bg-primary/10 text-primary border border-primary/20"
                : "bg-muted dark:bg-zinc-800 text-muted-foreground"
            }`}>
              {stats.globalTotalCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveMainTab("MY_DAY");
              setCompanyFilter("ALL");
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer shrink-0 ${
              activeMainTab === "MY_DAY"
                ? "bg-gradient-to-r from-amber-500/15 to-orange-500/15 text-amber-600 dark:text-amber-400 shadow-sm border border-amber-500/30"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            }`}
          >
            <Sun className={`h-3.5 w-3.5 ${activeMainTab === "MY_DAY" ? "text-amber-500" : "text-muted-foreground"}`} />
            <span className="whitespace-nowrap">My Day</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/30">
              {stats.globalPersonalCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveMainTab("WORKSPACE");
              setCompanyFilter("ALL");
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer shrink-0 ${
              activeMainTab === "WORKSPACE"
                ? "bg-gradient-to-r from-indigo-500/15 to-purple-500/15 text-indigo-600 dark:text-indigo-400 shadow-sm border border-indigo-500/30"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
            }`}
          >
            <Briefcase className={`h-3.5 w-3.5 ${activeMainTab === "WORKSPACE" ? "text-indigo-500" : "text-muted-foreground"}`} />
            <span className="whitespace-nowrap">Prospect Tasks</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-medium ${
              activeMainTab === "WORKSPACE"
                ? "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/25"
                : "bg-muted dark:bg-zinc-800 text-muted-foreground"
            }`}>
              {stats.globalProspectCount}
            </span>
          </button>
        </div>

        {/* Global Create Task Modal Button */}
        <Button
          size="sm"
          variant="gradient"
          onClick={handleOpenModal}
          className="text-xs gap-1.5 shrink-0 shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 active:scale-95 transition-all w-full sm:w-auto h-9 px-4 rounded-xl font-semibold"
        >
          <Plus className="h-4 w-4" />
          <span>New Task</span>
        </Button>
      </div>

      {/* 2. Quick Add Floating Card */}
      <div
        className={`relative overflow-hidden rounded-2xl border p-4 backdrop-blur-xl shadow-sm transition-all duration-300 ${
          activeMainTab === "MY_DAY"
            ? "border-amber-500/30 bg-gradient-to-br from-amber-500/5 via-card/90 to-card/90 dark:from-amber-500/10 dark:via-zinc-900/90 dark:to-zinc-900/90"
            : activeMainTab === "WORKSPACE"
            ? "border-indigo-500/30 bg-gradient-to-br from-indigo-500/5 via-card/90 to-card/90 dark:from-indigo-500/10 dark:via-zinc-900/90 dark:to-zinc-900/90"
            : "border-border/80 bg-card/85 dark:bg-zinc-900/85"
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${
              activeMainTab === "MY_DAY"
                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                : activeMainTab === "WORKSPACE"
                ? "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400"
                : "bg-primary/10 text-primary"
            }`}>
              {activeMainTab === "MY_DAY" ? (
                <Sun className="h-4 w-4" />
              ) : activeMainTab === "WORKSPACE" ? (
                <Briefcase className="h-4 w-4" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
            </div>
            <div>
              <h2 className="text-xs font-bold text-foreground tracking-tight">
                {activeMainTab === "MY_DAY"
                  ? "Quick Add • My Day"
                  : activeMainTab === "WORKSPACE"
                  ? "Quick Add • Prospect Task"
                  : "Quick Add Task"}
              </h2>
            </div>
          </div>
          <span className="text-[11px] text-muted-foreground/80 hidden sm:flex items-center gap-1">
            <span>Press</span>
            <kbd className="px-1.5 py-0.5 rounded-md bg-muted text-[10px] font-mono border border-border">Enter ↵</kbd>
            <span>to create</span>
          </span>
        </div>

        {/* Form controls with clean responsiveness */}
        <form onSubmit={handleQuickAdd} className="space-y-2.5">
          <div className="relative">
            <Input
              type="text"
              placeholder={
                activeMainTab === "MY_DAY"
                  ? "What's on your agenda today? (e.g. Call client regarding proposal, review revenue metrics)"
                  : activeMainTab === "WORKSPACE"
                  ? "Task for prospect... (e.g. Follow up on demo feedback with VP of Sales)"
                  : "Task title... (e.g. Schedule discovery call, internal follow-up)"
              }
              value={quickTitle}
              onChange={(e) => setQuickTitle(e.target.value)}
              className="h-10 text-xs pl-3.5 pr-4 bg-background/90 dark:bg-zinc-950/90 border-border/80 focus:border-primary placeholder:text-muted-foreground/70 rounded-xl shadow-xs w-full"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              {/* Quick Company Selector (only in WORKSPACE or ALL tabs) */}
              {activeMainTab !== "MY_DAY" && prospects.length > 0 && (
                <div className="relative flex-1 sm:flex-initial">
                  <select
                    value={quickProspectId}
                    onChange={(e) => setQuickProspectId(e.target.value)}
                    className="h-9 px-3 pr-8 rounded-xl bg-background/90 dark:bg-zinc-950/90 text-foreground dark:text-zinc-100 border border-border/80 text-xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-xs w-full sm:w-auto sm:max-w-[210px] truncate"
                  >
                    <option value="" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">
                      {activeMainTab === "WORKSPACE" ? "🏢 Select Company *" : "🏢 No Company"}
                    </option>
                    {prospects.map((p) => (
                      <option
                        key={p.id}
                        value={p.id}
                        className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100"
                      >
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Quick Due Date Picker */}
              <div className="relative flex-1 sm:flex-initial">
                <Input
                  type="date"
                  value={quickDueDate}
                  onChange={(e) => setQuickDueDate(e.target.value)}
                  className="h-9 text-xs w-full sm:w-36 bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl shadow-xs"
                  title="Due Date"
                />
              </div>

              {/* Quick Priority Selector */}
              <div className="relative flex-1 sm:flex-initial">
                <select
                  value={quickPriority}
                  onChange={(e) => setQuickPriority(e.target.value as any)}
                  className="h-9 px-3 rounded-xl bg-background/90 dark:bg-zinc-950/90 text-foreground dark:text-zinc-100 border border-border/80 text-xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-xs w-full sm:w-auto"
                >
                  <option value="LOW" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Priority: Low</option>
                  <option value="MEDIUM" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Priority: Medium</option>
                  <option value="HIGH" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">High Priority</option>
                  <option value="URGENT" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">🔥 Urgent Priority</option>
                </select>
              </div>
            </div>

            {/* Quick Add Submit Button */}
            <Button
              type="submit"
              size="sm"
              variant="gradient"
              disabled={
                isQuickAdding ||
                !quickTitle.trim() ||
                (activeMainTab === "WORKSPACE" && !quickProspectId && prospects.length > 0)
              }
              className="h-9 px-5 text-xs gap-1.5 shrink-0 rounded-xl shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 active:scale-95 transition-all w-full sm:w-auto font-semibold"
            >
              <Plus className="h-4 w-4" />
              <span>{isQuickAdding ? "Adding..." : "Add Task"}</span>
            </Button>
          </div>
        </form>
      </div>

      {/* 3. Luxury Stats Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Card 1: Active Tasks */}
        <div
          onClick={() => setStatusFilter("ALL_ACTIVE")}
          className={`group relative p-4 rounded-2xl border transition-all duration-200 cursor-pointer select-none overflow-hidden ${
            statusFilter === "ALL_ACTIVE"
              ? "bg-primary/5 dark:bg-primary/10 border-primary/40 shadow-sm"
              : "bg-card/75 dark:bg-zinc-900/75 hover:bg-card border-border/80 hover:border-primary/40 hover:shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span className="font-semibold text-foreground/80 tracking-tight">
              {activeMainTab === "MY_DAY"
                ? "Active Tasks"
                : activeMainTab === "WORKSPACE"
                ? "Active Prospect"
                : "Active Tasks"}
            </span>
            <div className="p-1.5 rounded-xl bg-primary/10 text-primary group-hover:scale-105 transition-transform">
              <CalendarCheck2 className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-foreground">{stats.active}</div>
          <div className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
            <span>Out of {stats.total} total</span>
          </div>
        </div>

        {/* Card 2: Assigned to Me */}
        <div
          onClick={() => setStatusFilter("MINE")}
          className={`group relative p-4 rounded-2xl border transition-all duration-200 cursor-pointer select-none overflow-hidden ${
            statusFilter === "MINE"
              ? "bg-indigo-500/5 dark:bg-indigo-500/10 border-indigo-500/40 shadow-sm"
              : "bg-card/75 dark:bg-zinc-900/75 hover:bg-card border-border/80 hover:border-indigo-500/40 hover:shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span className="font-semibold text-foreground/80 tracking-tight">My Tasks</span>
            <div className="p-1.5 rounded-xl bg-indigo-500/10 text-indigo-500 group-hover:scale-105 transition-transform">
              <User className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-foreground">{stats.mine}</div>
          <div className="text-[10px] text-muted-foreground mt-1">Assigned to you</div>
        </div>

        {/* Card 3: Overdue */}
        <div
          onClick={() => setStatusFilter("OVERDUE")}
          className={`group relative p-4 rounded-2xl border transition-all duration-200 cursor-pointer select-none overflow-hidden ${
            statusFilter === "OVERDUE"
              ? "bg-rose-500/10 dark:bg-rose-500/15 border-rose-500/40 shadow-sm"
              : "bg-card/75 dark:bg-zinc-900/75 hover:bg-card border-border/80 hover:border-rose-500/40 hover:shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span className="font-semibold text-foreground/80 tracking-tight">Overdue</span>
            <div className={`p-1.5 rounded-xl ${
              stats.overdue > 0
                ? "bg-rose-500/15 text-rose-500 animate-bounce"
                : "bg-rose-500/10 text-rose-400"
            }`}>
              <AlertCircle className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className={`text-2xl font-bold tracking-tight ${stats.overdue > 0 ? "text-rose-500" : "text-foreground"}`}>
            {stats.overdue}
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">
            {stats.overdue > 0 ? "Requires action" : "On schedule"}
          </div>
        </div>

        {/* Card 4: Urgent & High Priority */}
        <div
          onClick={() => {
            setStatusFilter("ALL_ACTIVE");
            setPriorityFilter("URGENT");
          }}
          className={`group relative p-4 rounded-2xl border transition-all duration-200 cursor-pointer select-none overflow-hidden ${
            priorityFilter === "URGENT"
              ? "bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/40 shadow-sm"
              : "bg-card/75 dark:bg-zinc-900/75 hover:bg-card border-border/80 hover:border-amber-500/40 hover:shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span className="font-semibold text-foreground/80 tracking-tight">Urgent & High</span>
            <div className="p-1.5 rounded-xl bg-amber-500/10 text-amber-500 group-hover:scale-105 transition-transform">
              <Flame className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-foreground">{stats.urgentOrHigh}</div>
          <div className="text-[10px] text-muted-foreground mt-1">High impact items</div>
        </div>

        {/* Card 5: Completed */}
        <div
          onClick={() => setStatusFilter("COMPLETED")}
          className={`col-span-2 sm:col-span-1 group relative p-4 rounded-2xl border transition-all duration-200 cursor-pointer select-none overflow-hidden ${
            statusFilter === "COMPLETED"
              ? "bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500/40 shadow-sm"
              : "bg-card/75 dark:bg-zinc-900/75 hover:bg-card border-border/80 hover:border-emerald-500/40 hover:shadow-sm"
          }`}
        >
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span className="font-semibold text-foreground/80 tracking-tight">Completed</span>
            <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-500 group-hover:scale-105 transition-transform">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
            {stats.completed}
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">
            {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}% done
          </div>
        </div>
      </div>

      {/* 4. Controls & Search Toolbar */}
      <div className="p-4 rounded-2xl border border-border/80 bg-card/75 dark:bg-zinc-900/80 backdrop-blur-xl shadow-xs space-y-3.5">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground/80" />
          <Input
            type="text"
            placeholder={
              activeMainTab === "MY_DAY"
                ? "Search my day tasks by title, instructions, or notes..."
                : activeMainTab === "WORKSPACE"
                ? "Search prospect tasks by company, title, assignee, or logs..."
                : "Search all tasks across the workspace..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-9 h-10 text-xs w-full bg-background/80 dark:bg-zinc-950/80 border-border/80 placeholder:text-muted-foreground/70 rounded-xl"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-3 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter Pills & Selectors Toolbar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2 border-t border-border/60">
          {/* Status Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 md:pb-0">
            {(
              [
                { key: "ALL_ACTIVE", label: "All Active" },
                { key: "MINE", label: "My Tasks" },
                { key: "OVERDUE", label: "Overdue" },
                { key: "COMPLETED", label: "Completed" },
                { key: "ALL", label: "All Records" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer shrink-0 whitespace-nowrap ${
                  statusFilter === tab.key
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/70 bg-muted/40 dark:bg-zinc-800/40"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Secondary Filters: Priority, Company & Sort By */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="h-8.5 px-3 rounded-xl bg-card dark:bg-zinc-900 border border-border/80 text-xs text-foreground dark:text-zinc-100 font-medium focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer flex-1 sm:flex-none shadow-2xs"
            >
              <option value="ALL" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Priority: All</option>
              <option value="URGENT" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">🔥 Urgent</option>
              <option value="HIGH" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">High</option>
              <option value="MEDIUM" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Medium</option>
              <option value="LOW" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Low</option>
            </select>

            {/* Company Filter (Only in WORKSPACE or ALL tab) */}
            {activeMainTab !== "MY_DAY" && prospects.length > 0 && (
              <select
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                className="h-8.5 px-3 rounded-xl bg-card dark:bg-zinc-900 border border-border/80 text-xs text-foreground dark:text-zinc-100 font-medium focus:outline-none focus:ring-1 focus:ring-primary max-w-[160px] truncate cursor-pointer flex-1 sm:flex-none shadow-2xs"
              >
                <option value="ALL" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Company: All</option>
                {prospects.map((p) => (
                  <option key={p.id} value={p.id} className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">
                    {p.name}
                  </option>
                ))}
              </select>
            )}

            {/* Sort Selector */}
            <div className="flex items-center gap-1.5 flex-1 sm:flex-none">
              <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="h-8.5 px-3 rounded-xl bg-card dark:bg-zinc-900 border border-border/80 text-xs text-foreground dark:text-zinc-100 font-medium focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer w-full shadow-2xs"
              >
                <option value="NEWEST" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Newest First (Recent)</option>
                <option value="OLDEST" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Oldest First</option>
                <option value="DUE_SOON" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Due Date (Earliest)</option>
                <option value="DUE_LATE" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Due Date (Latest)</option>
                <option value="PRIORITY" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Priority (Urgent First)</option>
                <option value="TITLE_AZ" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">Title (A-Z)</option>
              </select>
            </div>

            {/* Reset Filters */}
            {hasActiveFilters && (
              <Button
                size="sm"
                variant="ghost"
                onClick={resetFilters}
                className="h-8.5 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1.5 shrink-0 rounded-xl"
                title="Reset all filters and sort"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 5. Clean, Luxury Task Cards Feed with Multi-User Activity Logging & Multiple Screenshots */}
      <div className="space-y-3">
        {processedTasks.length === 0 ? (
          <div className="text-center py-16 px-6 rounded-3xl border border-dashed border-border/80 bg-card/50 dark:bg-zinc-900/50 backdrop-blur-md shadow-inner">
            <div className="h-14 w-14 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4 shadow-inner">
              <CalendarCheck2 className="h-7 w-7" />
            </div>
            <h3 className="text-base font-bold text-foreground">No tasks found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1.5 mb-5 leading-relaxed">
              {activeMainTab === "MY_DAY"
                ? "Your My Day queue is currently clear. Use the quick add bar above to plan your personal actions!"
                : activeMainTab === "WORKSPACE"
                ? "No prospect outreach tasks found matching your active filter criteria."
                : "No tasks found matching your active filter criteria."}
            </p>
            {hasActiveFilters ? (
              <Button size="sm" variant="outline" onClick={resetFilters} className="text-xs rounded-xl px-4">
                Clear Active Filters
              </Button>
            ) : (
              <Button
                size="sm"
                variant="gradient"
                onClick={handleOpenModal}
                className="text-xs gap-1.5 rounded-xl px-5 h-9 font-semibold shadow-md shadow-primary/20"
              >
                <Plus className="h-4 w-4" />
                <span>Create Task</span>
              </Button>
            )}
          </div>
        ) : (
          processedTasks.map((t) => {
            const isExpanded = expandedTaskIds.has(t.id);
            const isCompleted = t.status === "COMPLETED";
            const priorityConfig = getPriorityConfig(t.priority);
            const dueDateInfo = t.dueDate ? formatTaskDueDate(t.dueDate) : null;
            const createdAgo = formatCreatedDate(t.createdAt);
            const isPersonal = isPersonalTask(t);
            const isAllowedToComplete = canCompletePersonalTask(t);
            const currentNote = editingNotes[t.id] ?? t.description ?? "";
            const currentSubTab = taskActiveTab[t.id] || "NOTES";
            const logsForTask = taskLogsMap[t.id] || [];
            const currentInlineImages = inlineLogImages[t.id] || [];

            return (
              <div
                key={t.id}
                className={`group relative rounded-2xl border transition-all duration-200 ${
                  isCompleted
                    ? "bg-card/40 dark:bg-zinc-900/30 border-border/40 opacity-75 hover:opacity-100"
                    : "bg-card/90 dark:bg-zinc-900/90 border-border/80 backdrop-blur-xl shadow-xs hover:border-primary/40 hover:shadow-md"
                }`}
              >
                <div className="p-4 sm:p-4.5">
                  <div className="flex items-start justify-between gap-3">
                    {/* Checkbox + Title + Metadata */}
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      {/* Tactile Checkbox Button */}
                      <button
                        type="button"
                        onClick={(e) => handleCheckboxClick(t, e)}
                        className={`mt-0.5 h-5.5 w-5.5 rounded-lg border-2 flex items-center justify-center transition-all duration-200 cursor-pointer shrink-0 ${
                          isCompleted
                            ? "bg-gradient-to-br from-emerald-500 to-teal-600 border-emerald-500 text-white shadow-md shadow-emerald-500/30 scale-105"
                            : isPersonal && !isAllowedToComplete
                            ? "border-border/60 bg-muted/40 opacity-50 cursor-not-allowed"
                            : "border-border/80 hover:border-primary bg-background/80 dark:bg-zinc-950/80 hover:scale-110 active:scale-95"
                        }`}
                        title={
                          isCompleted
                            ? "Click to reopen task"
                            : isPersonal && !isAllowedToComplete
                            ? "Personal task: Only the owner can mark as complete"
                            : "Click to complete task & log details"
                        }
                      >
                        {isCompleted ? (
                          <Check className="h-3.5 w-3.5 stroke-[3.5] text-white animate-in zoom-in-75" />
                        ) : isPersonal && !isAllowedToComplete ? (
                          <Lock className="h-2.5 w-2.5 text-muted-foreground" />
                        ) : null}
                      </button>

                      <div className="space-y-2 min-w-0 flex-1">
                        {/* Title & Priority Badge Row */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            onClick={() => toggleTaskExpand(t.id, t.description)}
                            className={`text-sm font-semibold tracking-tight cursor-pointer select-none leading-snug break-words transition-colors ${
                              isCompleted
                                ? "line-through text-muted-foreground/75"
                                : "text-foreground group-hover:text-primary"
                            }`}
                          >
                            {t.title}
                          </span>

                          {/* Priority Badge */}
                          <span
                            className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${priorityConfig.badgeClass}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${priorityConfig.dotColor}`} />
                            {priorityConfig.label}
                          </span>

                          {/* Toggle Expand Details & Logs */}
                          <button
                            type="button"
                            onClick={() => toggleTaskExpand(t.id, t.description)}
                            className={`inline-flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-0.5 rounded-lg border transition-all cursor-pointer ${
                              isExpanded
                                ? "bg-primary/10 text-primary border-primary/25"
                                : "bg-muted/40 text-muted-foreground border-border/50 hover:text-foreground hover:bg-muted"
                            }`}
                            title={isExpanded ? "Hide details" : "View notes & handover logs"}
                          >
                            <History className="h-2.5 w-2.5" />
                            <span>
                              {isExpanded ? "Hide" : logsForTask.length > 0 ? `Logs (${logsForTask.length})` : "Details"}
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="h-2.5 w-2.5" />
                            ) : (
                              <ChevronDown className="h-2.5 w-2.5" />
                            )}
                          </button>
                        </div>

                        {/* Metadata Pills: Company, Due Date, Assignee, Created */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                          {/* Company Link Chip */}
                          {t.prospectName && (
                            <Link
                              href={`/prospects/${t.prospectId}`}
                              className="inline-flex items-center gap-1.5 font-medium text-primary hover:text-primary/80 hover:underline px-2 py-0.5 rounded-md bg-primary/5 dark:bg-primary/10 border border-primary/15 transition-colors"
                            >
                              <Building2 className="h-3 w-3 shrink-0" />
                              <span className="truncate max-w-[190px]">{t.prospectName}</span>
                            </Link>
                          )}

                          {/* Due Date Badge */}
                          {dueDateInfo && (
                            <span
                              className={`inline-flex items-center gap-1.5 font-medium ${
                                dueDateInfo.isOverdue && !isCompleted
                                  ? "text-rose-600 dark:text-rose-400 font-semibold px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/20"
                                  : dueDateInfo.isToday && !isCompleted
                                  ? "text-amber-600 dark:text-amber-400 font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20"
                                  : "text-muted-foreground"
                              }`}
                            >
                              <Clock className="h-3 w-3 shrink-0" />
                              <span>
                                {dueDateInfo.formatted}
                                {dueDateInfo.isOverdue && !isCompleted && " (Overdue)"}
                                {dueDateInfo.isToday && !isCompleted && " (Today)"}
                              </span>
                            </span>
                          )}

                          {/* Assignee Chip */}
                          {t.assignedToName && (
                            <span className="inline-flex items-center gap-1.5 font-medium text-muted-foreground/90">
                              <span className="h-4.5 w-4.5 rounded-full bg-gradient-to-tr from-primary/20 to-purple-500/20 text-[10px] font-bold text-primary flex items-center justify-center ring-1 ring-primary/20">
                                {t.assignedToName.charAt(0).toUpperCase()}
                              </span>
                              <span>
                                {t.assignedToName} {t.assignedToId === currentUserId ? "(You)" : ""}
                              </span>
                            </span>
                          )}

                          {/* Creation Timestamp */}
                          {createdAgo && (
                            <span className="text-[11px] text-muted-foreground/65">
                              Created {createdAgo}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Actions: Delete button */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={async () => {
                          if (confirm(`Delete task "${t.title}"?`)) {
                            await deleteTaskAction(t.id);
                          }
                        }}
                        className="h-8 w-8 p-0 text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 cursor-pointer rounded-xl opacity-70 group-hover:opacity-100 transition-all"
                        title="Delete task"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Expandable Section: Segmented between "Notes & Instructions" and "Activity & Screenshots" */}
                  {isExpanded && (
                    <div className="mt-4 pt-3 border-t border-border/60 animate-in fade-in duration-200 space-y-3">
                      {/* Sub-tab navigation */}
                      <div className="flex items-center justify-between pb-1 border-b border-border/40">
                        <div className="flex items-center gap-1 bg-muted/40 dark:bg-zinc-950/60 p-0.5 rounded-lg border border-border/40">
                          <button
                            type="button"
                            onClick={() =>
                              setTaskActiveTab((prev) => ({ ...prev, [t.id]: "NOTES" }))
                            }
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                              currentSubTab === "NOTES"
                                ? "bg-card text-foreground shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <FileText className="h-3 w-3 text-primary" />
                            <span>Notes & Instructions</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setTaskActiveTab((prev) => ({ ...prev, [t.id]: "LOGS" }))
                            }
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                              currentSubTab === "LOGS"
                                ? "bg-card text-foreground shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <History className="h-3 w-3 text-indigo-500" />
                            <span>Activity & Screenshots</span>
                            {logsForTask.length > 0 && (
                              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-bold">
                                {logsForTask.length}
                              </span>
                            )}
                          </button>
                        </div>

                        <span className="text-[10px] text-muted-foreground hidden sm:inline">
                          {currentSubTab === "NOTES"
                            ? "Edit task background or instructions"
                            : "Collaborative multi-user history"}
                        </span>
                      </div>

                      {/* Sub-tab 1: Notes & Instructions */}
                      {currentSubTab === "NOTES" && (
                        <div className="space-y-2">
                          <Textarea
                            rows={3}
                            placeholder="Type notes, meeting action items, or phone context for this task..."
                            value={currentNote}
                            onChange={(e) =>
                              setEditingNotes((n) => ({ ...n, [t.id]: e.target.value }))
                            }
                            className="text-xs bg-background/90 dark:bg-zinc-950/90 border-border/80 focus:border-primary leading-relaxed rounded-xl shadow-inner"
                          />

                          <div className="flex items-center justify-end gap-2 pt-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleTaskExpand(t.id)}
                              className="h-7.5 px-3 text-[11px] rounded-xl"
                            >
                              Close
                            </Button>
                            <Button
                              size="sm"
                              variant="gradient"
                              onClick={() => handleSaveNote(t.id)}
                              disabled={savingNoteId === t.id}
                              className="h-7.5 px-4 text-[11px] gap-1.5 rounded-xl font-semibold shadow-xs"
                            >
                              <Save className="h-3 w-3" />
                              <span>{savingNoteId === t.id ? "Saving..." : "Save Notes"}</span>
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Sub-tab 2: Activity Logs & Screenshots Timeline */}
                      {currentSubTab === "LOGS" && (
                        <div className="space-y-3">
                          {/* Log List */}
                          <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                            {logsForTask.length === 0 ? (
                              <div className="text-center py-6 px-4 rounded-xl border border-dashed border-border/60 bg-muted/20 text-xs text-muted-foreground">
                                No activity logs recorded yet. Add a handover note below.
                              </div>
                            ) : (
                              logsForTask.map((log) => {
                                const urls = parseAttachmentUrls(log.attachmentUrl);

                                return (
                                  <div
                                    key={log.id}
                                    className="p-3 rounded-xl bg-muted/40 dark:bg-zinc-950/60 border border-border/60 space-y-2"
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="h-5 w-5 rounded-full bg-gradient-to-tr from-primary/20 to-purple-500/20 text-[10px] font-bold text-primary flex items-center justify-center ring-1 ring-primary/20">
                                          {log.userName.charAt(0).toUpperCase()}
                                        </span>
                                        <span className="text-xs font-semibold text-foreground">
                                          {log.userName} {log.userId === currentUserId ? "(You)" : ""}
                                        </span>
                                        <Badge
                                          variant="secondary"
                                          className={`text-[9px] px-1.5 py-0 ${
                                            log.action === "COMPLETED"
                                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 font-bold"
                                              : log.action === "CREATED"
                                              ? "bg-primary/10 text-primary border border-primary/20"
                                              : "bg-muted text-muted-foreground"
                                          }`}
                                        >
                                          {log.action === "COMPLETED"
                                            ? "Completed Task"
                                            : log.action === "CREATED"
                                            ? "Created Task"
                                            : "Note / Update"}
                                        </Badge>
                                      </div>
                                      <span className="text-[10px] text-muted-foreground">
                                        {formatCreatedDate(log.createdAt)}
                                      </span>
                                    </div>

                                    {log.note && (
                                      <p className="text-xs text-foreground/90 leading-relaxed pl-7 whitespace-pre-wrap">
                                        {log.note}
                                      </p>
                                    )}

                                    {/* Multiple Attached Reference Screenshots Preview */}
                                    {urls.length > 0 && (
                                      <div className="pl-7 pt-1 flex flex-wrap gap-2">
                                        {urls.map((imgUrl, idx) => (
                                          <div
                                            key={idx}
                                            onClick={() =>
                                              setLightboxGallery({
                                                images: urls,
                                                activeIndex: idx,
                                              })
                                            }
                                            className="group/img relative inline-block cursor-pointer overflow-hidden rounded-xl border border-border/80 hover:border-primary/60 shadow-xs transition-all"
                                          >
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                              src={imgUrl}
                                              alt={`Attachment ${idx + 1}`}
                                              className="h-24 w-28 object-cover group-hover/img:scale-105 transition-transform"
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center gap-1 text-white text-[10px] font-medium transition-opacity">
                                              <Eye className="h-3 w-3" />
                                              <span>View ({idx + 1}/{urls.length})</span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })
                            )}
                          </div>

                          {/* Quick Add Log & Multiple Screenshot Attachment Bar */}
                          <div className="p-3 rounded-xl border border-border/80 bg-background/90 dark:bg-zinc-950/80 space-y-2">
                            <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                              <span>Add Progress Note / Handover</span>
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                                ⚡ WebP Auto-Compressed
                              </span>
                            </div>

                            <Textarea
                              rows={2}
                              placeholder="Write a status update, client response, or handover note..."
                              value={inlineNewLogText[t.id] || ""}
                              onChange={(e) =>
                                setInlineNewLogText((prev) => ({
                                  ...prev,
                                  [t.id]: e.target.value,
                                }))
                              }
                              className="text-xs bg-card dark:bg-zinc-900 border-border/80 rounded-xl"
                            />

                            {/* Multiple Image Previews with live compression stats */}
                            {currentInlineImages.length > 0 && (
                              <div className="flex flex-wrap gap-2 p-2 rounded-lg bg-muted/40 border border-border/60">
                                {currentInlineImages.map((img) => (
                                  <div
                                    key={img.id}
                                    className="flex items-center gap-2 p-1.5 rounded-lg bg-card dark:bg-zinc-900 border border-border/80 shadow-2xs"
                                  >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={img.previewUrl}
                                      alt="Preview"
                                      className="h-9 w-9 object-cover rounded-md border"
                                    />
                                    <div className="min-w-0 max-w-[120px]">
                                      <div className="text-[10px] font-semibold truncate text-foreground">
                                        {img.fileName}
                                      </div>
                                      <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-medium">
                                        {img.sizeKB} KB
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setInlineLogImages((prev) => ({
                                          ...prev,
                                          [t.id]: (prev[t.id] || []).filter((i) => i.id !== img.id),
                                        }))
                                      }
                                      className="p-1 rounded-md text-muted-foreground hover:text-destructive cursor-pointer"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="flex items-center justify-between pt-1">
                              <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border/80 bg-card hover:bg-muted text-[11px] font-medium text-foreground cursor-pointer transition-colors">
                                <ImageIcon className="h-3 w-3 text-primary" />
                                <span>{currentInlineImages.length > 0 ? "+ Add More Images" : "Attach Screenshots"}</span>
                                <input
                                  type="file"
                                  multiple
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    if (e.target.files) {
                                      handleProcessMultipleFiles(e.target.files, (newImgs) =>
                                        setInlineLogImages((prev) => ({
                                          ...prev,
                                          [t.id]: [...(prev[t.id] || []), ...newImgs],
                                        }))
                                      );
                                    }
                                  }}
                                />
                              </label>

                              <Button
                                size="sm"
                                variant="gradient"
                                onClick={() => handleAddInlineLog(t.id)}
                                disabled={
                                  addingLogTaskId === t.id ||
                                  (!inlineNewLogText[t.id]?.trim() && currentInlineImages.length === 0)
                                }
                                className="h-7.5 px-3 text-[11px] gap-1 rounded-xl font-semibold shadow-xs"
                              >
                                <Send className="h-3 w-3" />
                                <span>{addingLogTaskId === t.id ? "Posting..." : "Post Update"}</span>
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 6. Completion & Handover Log Dialog Modal (Multiple Screenshots Supported) */}
      <Dialog open={Boolean(completingTask)} onOpenChange={(open) => !open && setCompletingTask(null)}>
        <DialogContent className="max-w-md bg-white dark:bg-[#121218] border border-slate-200 dark:border-zinc-800 shadow-2xl rounded-3xl">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-500">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <DialogTitle className="text-lg font-bold text-slate-900 dark:text-zinc-100">
                Complete & Log Task
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-slate-600 dark:text-zinc-400">
              Mark this task as resolved, log your outcome note, and attach proof/screenshots.
            </DialogDescription>
          </DialogHeader>

          {completingTask && (
            <form onSubmit={handleConfirmCompletionWithLog} className="space-y-4 text-xs">
              {/* Task Summary Banner */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-zinc-900/80 border border-slate-200/80 dark:border-zinc-800 space-y-1">
                <div className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                  {completingTask.title}
                </div>
                {completingTask.prospectName && (
                  <div className="text-[11px] text-primary font-medium flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    <span>{completingTask.prospectName}</span>
                  </div>
                )}
              </div>

              {/* Handover / Resolution Note */}
              <div>
                <label className="block mb-1.5 font-semibold text-slate-800 dark:text-zinc-200">
                  Handover & Resolution Notes (Optional)
                </label>
                <Textarea
                  rows={3}
                  placeholder="e.g. Spoke with decision maker, confirmed next demo for Thursday. Logged in CRM timeline."
                  value={completionNote}
                  onChange={(e) => setCompletionNote(e.target.value)}
                  className="text-xs bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 rounded-xl"
                />
              </div>

              {/* Multiple Screenshots Attachment */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold text-slate-800 dark:text-zinc-200">
                    Attach Reference Screenshots / Proof
                  </label>
                  {completionImages.length > 0 && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                      {completionImages.length} image{completionImages.length > 1 ? "s" : ""} selected
                    </span>
                  )}
                </div>

                {completionImages.length > 0 ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-1">
                      {completionImages.map((img) => (
                        <div
                          key={img.id}
                          className="flex items-center gap-2 p-2 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={img.previewUrl}
                            alt="Screenshot Preview"
                            className="h-10 w-10 object-cover rounded-lg border shadow-2xs shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-[11px] font-semibold truncate text-slate-900 dark:text-zinc-100">
                              {img.fileName}
                            </div>
                            <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-medium">
                              ⚡ {img.sizeKB} KB
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setCompletionImages((prev) => prev.filter((i) => i.id !== img.id))
                            }
                            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive cursor-pointer"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => completionFileInputRef.current?.click()}
                      className="w-full py-2 text-center text-xs font-semibold text-primary hover:underline cursor-pointer border border-dashed border-primary/30 rounded-xl bg-primary/5"
                    >
                      + Add More Screenshots
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => completionFileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 dark:border-zinc-700 hover:border-primary/60 rounded-2xl p-4 text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-zinc-900/50 hover:bg-slate-50 dark:hover:bg-zinc-900"
                  >
                    <UploadCloud className="h-6 w-6 text-primary mx-auto mb-1" />
                    <div className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                      Click or drag screenshots here
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      PNG, JPG, WebP &bull; Select single or multiple images
                    </div>
                  </div>
                )}

                <input
                  ref={completionFileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) {
                      handleProcessMultipleFiles(e.target.files, (newImgs) =>
                        setCompletionImages((prev) => [...prev, ...newImgs])
                      );
                    }
                  }}
                />
              </div>

              <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border/40">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCompletingTask(null)}
                  className="text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="gradient"
                  disabled={isCompletingSubmitting}
                  className="text-xs rounded-xl font-semibold shadow-md shadow-emerald-500/20 bg-gradient-to-r from-emerald-500 to-teal-600 text-white cursor-pointer"
                >
                  <Check className="h-3.5 w-3.5 mr-1 stroke-[3]" />
                  <span>{isCompletingSubmitting ? "Completing..." : "Complete & Save Log"}</span>
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* 7. Clean, Luxury Multi-Image Gallery Lightbox Modal with Arrows & Thumbnails */}
      <Dialog open={Boolean(lightboxGallery)} onOpenChange={(open) => !open && setLightboxGallery(null)}>
        <DialogContent className="max-w-4xl bg-black/95 backdrop-blur-2xl border border-zinc-800 p-3 sm:p-4 shadow-2xl rounded-3xl text-white">
          {lightboxGallery && (
            <div className="relative space-y-3 select-none">
              {/* Top Toolbar */}
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80 px-1">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-semibold text-zinc-200">
                    Screenshot {lightboxGallery.activeIndex + 1} of {lightboxGallery.images.length}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <a
                    href={lightboxGallery.images[lightboxGallery.activeIndex]}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors font-medium px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20"
                  >
                    <span>Open Original</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>

                  {/* Prominent Easy-to-Click Close Button */}
                  <button
                    type="button"
                    onClick={() => setLightboxGallery(null)}
                    className="h-8 w-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-md hover:scale-105 border border-zinc-700"
                    title="Close viewer (Esc)"
                  >
                    <X className="h-4 w-4 stroke-[2.5]" />
                  </button>
                </div>
              </div>

              {/* Main Image Display with Left/Right Scroll Arrows */}
              <div className="relative flex items-center justify-center p-2 overflow-hidden rounded-2xl bg-zinc-950/90 border border-zinc-800/60 min-h-[340px] group/viewer">
                {/* Left Arrow Button */}
                {lightboxGallery.images.length > 1 && (
                  <button
                    type="button"
                    onClick={handlePrevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-all cursor-pointer border border-white/20 shadow-xl hover:scale-110 active:scale-95"
                    title="Previous image (←)"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                )}

                {/* The Active Full-Scale Image */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  key={lightboxGallery.images[lightboxGallery.activeIndex]}
                  src={lightboxGallery.images[lightboxGallery.activeIndex]}
                  alt={`Screenshot ${lightboxGallery.activeIndex + 1}`}
                  className="max-h-[68vh] w-auto max-w-full object-contain rounded-xl shadow-2xl animate-in fade-in duration-200"
                />

                {/* Right Arrow Button */}
                {lightboxGallery.images.length > 1 && (
                  <button
                    type="button"
                    onClick={handleNextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-20 h-10 w-10 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-all cursor-pointer border border-white/20 shadow-xl hover:scale-110 active:scale-95"
                    title="Next image (→)"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                )}
              </div>

              {/* Bottom Thumbnail Strip for Multi-Image Gallery */}
              {lightboxGallery.images.length > 1 && (
                <div className="flex items-center justify-center gap-2 overflow-x-auto py-1 px-2 max-w-full scrollbar-none">
                  {lightboxGallery.images.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() =>
                        setLightboxGallery((prev) => (prev ? { ...prev, activeIndex: idx } : null))
                      }
                      className={`relative rounded-xl overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                        lightboxGallery.activeIndex === idx
                          ? "border-primary ring-2 ring-primary/40 scale-105 shadow-md"
                          : "border-zinc-800 opacity-60 hover:opacity-100 hover:border-zinc-600"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imgUrl}
                        alt={`Thumbnail ${idx + 1}`}
                        className="h-12 w-16 object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 8. Global Create Task Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-white dark:bg-[#121218] border border-slate-200 dark:border-zinc-800 shadow-2xl rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-zinc-100">
              Create New Task
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 dark:text-zinc-400">
              Add a follow-up action, outreach schedule, or task.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleModalCreate} className="space-y-4 text-xs">
            {/* Task Title */}
            <div>
              <label className="block mb-1.5 font-semibold text-slate-800 dark:text-zinc-200">
                Task Title <span className="text-rose-500">*</span>
              </label>
              <Input
                required
                placeholder="e.g. Call decision maker regarding proposal review"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="text-xs bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 rounded-xl"
              />
            </div>

            {/* Related Company Dropdown */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-semibold text-slate-800 dark:text-zinc-200">
                  Related Company / Prospect
                </label>
                {selectedProspectInModal && (
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, prospectId: "" })}
                    className="text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-0.5 cursor-pointer"
                  >
                    <X className="h-2.5 w-2.5" /> Clear selection
                  </button>
                )}
              </div>

              {prospects.length > 6 && (
                <div className="relative mb-1.5">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search company list..."
                    value={companySearchInModal}
                    onChange={(e) => setCompanySearchInModal(e.target.value)}
                    className="pl-8 h-8 text-xs bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 rounded-xl"
                  />
                </div>
              )}

              <select
                value={form.prospectId}
                onChange={(e) => setForm({ ...form, prospectId: e.target.value })}
                className="w-full h-9 px-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary/25 cursor-pointer"
              >
                <option value="" className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100">-- No Company (General Task) --</option>
                {filteredProspectOptionsInModal.map((p) => (
                  <option key={p.id} value={p.id} className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100">
                    {p.name} {p.category ? `(${p.category})` : ""} {p.city ? `• ${p.city}` : ""}
                  </option>
                ))}
              </select>
              {companySearchInModal && filteredProspectOptionsInModal.length === 0 && (
                <p className="text-[10px] text-muted-foreground mt-1">
                  No company found matching &quot;{companySearchInModal}&quot;.
                </p>
              )}
            </div>

            {/* Assign To User */}
            <div>
              <label className="block mb-1.5 font-semibold text-slate-800 dark:text-zinc-200">
                Assign Task To
              </label>
              <select
                value={form.assignedToId}
                onChange={(e) => setForm({ ...form, assignedToId: e.target.value })}
                className="w-full h-9 px-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary/25 cursor-pointer"
              >
                <option value="" className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100">-- Unassigned --</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id} className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100">
                    {u.name} {u.id === currentUserId ? "(You)" : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority & Due Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block mb-1.5 font-semibold text-slate-800 dark:text-zinc-200">
                  Priority
                </label>
                <select
                  value={form.priority}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      priority: e.target.value as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
                    })
                  }
                  className="w-full h-9 px-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary/25 cursor-pointer"
                >
                  <option value="LOW" className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100">Low Priority</option>
                  <option value="MEDIUM" className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100">Medium Priority</option>
                  <option value="HIGH" className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100">High Priority</option>
                  <option value="URGENT" className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100">🔥 Urgent Priority</option>
                </select>
              </div>

              <div>
                <label className="block mb-1.5 font-semibold text-slate-800 dark:text-zinc-200">
                  Due Date
                </label>
                <Input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  className="text-xs bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 rounded-xl"
                />
              </div>
            </div>

            {/* Notes & Details */}
            <div>
              <label className="block mb-1.5 font-semibold text-slate-800 dark:text-zinc-200">
                Notes & Details (Optional)
              </label>
              <Textarea
                rows={3}
                placeholder="Add background context, talking points, or action notes for this task..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="text-xs leading-relaxed bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 rounded-xl"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t border-border/40">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddOpen(false);
                  setCompanySearchInModal("");
                }}
                className="text-xs rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="gradient"
                disabled={isSubmitting}
                className="text-xs rounded-xl font-semibold shadow-md shadow-primary/20"
              >
                {isSubmitting ? "Saving Task..." : "Save Task"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
