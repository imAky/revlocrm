"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CalendarCheck2,
  Building2,
  AlertCircle,
  CheckCircle,
  Plus,
  Trash2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createTaskAction, updateTaskStatusAction, deleteTaskAction } from "@/lib/actions/tasks";

export function TasksClientList({
  initialTasks,
  currentUserId,
}: {
  initialTasks: any[];
  currentUserId: string;
}) {
  const [filter, setFilter] = useState<"ALL" | "MINE" | "OVERDUE" | "COMPLETED">("ALL");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "MEDIUM",
    dueDate: "",
  });

  const now = new Date();

  const filteredTasks = initialTasks.filter((t) => {
    if (filter === "MINE") return t.assignedToId === currentUserId && t.status !== "COMPLETED";
    if (filter === "OVERDUE") return t.dueDate && new Date(t.dueDate) < now && t.status !== "COMPLETED";
    if (filter === "COMPLETED") return t.status === "COMPLETED";
    return t.status !== "COMPLETED"; // ALL active
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setIsSubmitting(true);
    await createTaskAction({
      title: form.title,
      description: form.description,
      priority: form.priority as any,
      dueDate: form.dueDate ? new Date(form.dueDate) : undefined,
    });
    setForm({ title: "", description: "", priority: "MEDIUM", dueDate: "" });
    setIsAddOpen(false);
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl border border-border/60 bg-card/70 backdrop-blur-md">
        <div className="flex items-center gap-2">
          {(["ALL", "MINE", "OVERDUE", "COMPLETED"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                filter === f
                  ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {f === "ALL" && "All Active"}
              {f === "MINE" && "Assigned to Me"}
              {f === "OVERDUE" && "Overdue Tasks"}
              {f === "COMPLETED" && "Completed"}
            </button>
          ))}
        </div>

        <Button
          size="sm"
          variant="gradient"
          onClick={() => setIsAddOpen(true)}
          className="text-xs gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          Create Task
        </Button>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12 rounded-2xl border border-border/60 bg-card/40 text-xs text-muted-foreground">
            No tasks found in this view.
          </div>
        ) : (
          filteredTasks.map((t) => {
            const isOverdue = t.dueDate && new Date(t.dueDate) < now && t.status !== "COMPLETED";

            return (
              <div
                key={t.id}
                className="p-4 rounded-2xl border border-border/60 bg-card/70 backdrop-blur-md flex items-center justify-between hover:border-indigo-500/40 transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <input
                    type="checkbox"
                    checked={t.status === "COMPLETED"}
                    onChange={async (e) => {
                      await updateTaskStatusAction(
                        t.id,
                        e.target.checked ? "COMPLETED" : "TODO"
                      );
                    }}
                    className="h-4 w-4 rounded border-border cursor-pointer"
                  />

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-semibold ${
                          t.status === "COMPLETED"
                            ? "line-through text-muted-foreground"
                            : "text-foreground"
                        }`}
                      >
                        {t.title}
                      </span>
                      <Badge
                        variant={
                          t.priority === "URGENT" || t.priority === "HIGH"
                            ? "destructive"
                            : "secondary"
                        }
                        className="text-[9px] px-1.5 py-0"
                      >
                        {t.priority}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      {t.prospectName && (
                        <Link
                          href={`/prospects/${t.prospectId}`}
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          <Building2 className="h-3 w-3" />
                          {t.prospectName}
                        </Link>
                      )}
                      {t.dueDate && (
                        <span
                          className={`flex items-center gap-1 ${
                            isOverdue ? "text-rose-400 font-semibold" : ""
                          }`}
                        >
                          <Clock className="h-3 w-3" />
                          Due: {new Date(t.dueDate).toLocaleDateString()} {isOverdue && "(Overdue)"}
                        </span>
                      )}
                      {t.assignedToName && <span>Assigned: {t.assignedToName}</span>}
                    </div>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    if (confirm("Delete this task?")) {
                      await deleteTaskAction(t.id);
                    }
                  }}
                  className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })
        )}
      </div>

      {/* Add Task Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Task</DialogTitle>
            <DialogDescription>Create a follow-up action or research reminder.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4 text-xs">
            <div>
              <label className="block mb-1 font-medium text-foreground">Task Title *</label>
              <Input
                required
                placeholder="e.g. Call decision maker regarding proposal review"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>

            <div>
              <label className="block mb-1 font-medium text-foreground">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full h-9 px-3 rounded-lg bg-background border border-border text-xs text-foreground"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 font-medium text-foreground">Due Date</label>
              <Input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="gradient" disabled={isSubmitting}>
                Save Task
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
