"use client";

import { useState } from "react";
import { Sliders, Plus, CheckCircle, Tag, Layers, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { createCustomFieldAction } from "@/lib/actions/custom-fields";

export function CustomFieldsClient({
  initialFields,
  canManage = false,
}: {
  initialFields: any[];
  canManage?: boolean;
}) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    key: "",
    description: "",
    fieldType: "TEXT",
    section: "Custom Attributes",
    isRequired: false,
    isFilterable: true,
    optionsText: "Option 1\nOption 2\nOption 3",
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.key.trim()) return;

    setIsSubmitting(true);

    const options =
      form.fieldType === "SELECT" || form.fieldType === "MULTI_SELECT"
        ? form.optionsText
            .split("\n")
            .filter((o) => o.trim().length > 0)
            .map((o) => ({
              label: o.trim(),
              value: o.trim().toLowerCase().replace(/[^a-z0-9]/g, "_"),
            }))
        : undefined;

    await createCustomFieldAction({
      name: form.name,
      key: form.key,
      description: form.description,
      fieldType: form.fieldType,
      section: form.section,
      isRequired: form.isRequired,
      isFilterable: form.isFilterable,
      options,
    });

    setForm({
      name: "",
      key: "",
      description: "",
      fieldType: "TEXT",
      section: "Custom Attributes",
      isRequired: false,
      isFilterable: true,
      optionsText: "Option 1\nOption 2\nOption 3",
    });

    setIsAddOpen(false);
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Dynamic Custom Fields Engine
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
              Zero-Migration
            </span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Create custom attributes, select menus, and intelligence parameters rendered dynamically in forms.
          </p>
        </div>

        {canManage && (
          <Button
            size="sm"
            variant="gradient"
            onClick={() => setIsAddOpen(true)}
            className="text-xs gap-1.5 shadow-md shadow-indigo-500/20"
          >
            <Plus className="h-3.5 w-3.5" />
            Create Custom Field
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {initialFields.length === 0 ? (
          <div className="col-span-3 text-center py-12 rounded-2xl border border-border/60 bg-card/40 text-xs text-muted-foreground">
            No dynamic fields created yet. Click "Create Custom Field" to add one.
          </div>
        ) : (
          initialFields.map((field) => (
            <div
              key={field.id}
              className="p-5 rounded-2xl border border-border/60 bg-card/70 backdrop-blur-md space-y-3 hover:border-indigo-500/40 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-sm text-foreground">{field.name}</h3>
                  <code className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">
                    {field.key}
                  </code>
                </div>
                <Badge variant="purple" className="text-[10px] uppercase font-mono">
                  {field.fieldType}
                </Badge>
              </div>

              {field.description && (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {field.description}
                </p>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-border/30 text-[11px] text-muted-foreground">
                <span>Section: {field.section}</span>
                <span className={field.isRequired ? "text-amber-400 font-semibold" : ""}>
                  {field.isRequired ? "Required" : "Optional"}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Field Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Dynamic Custom Field</DialogTitle>
            <DialogDescription>
              Define a new structured data field for all workspace prospects.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4 text-xs">
            <div>
              <label className="block mb-1 font-medium text-foreground">Field Label *</label>
              <Input
                required
                placeholder="e.g. Current CRM Tool"
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  const key = name.toLowerCase().replace(/[^a-z0-9]/g, "_");
                  setForm({ ...form, name, key });
                }}
              />
            </div>

            <div>
              <label className="block mb-1 font-medium text-foreground">Field Key (API identifier) *</label>
              <Input
                required
                placeholder="current_crm_tool"
                value={form.key}
                onChange={(e) => setForm({ ...form, key: e.target.value })}
              />
            </div>

            <div>
              <label className="block mb-1 font-semibold text-slate-800 dark:text-slate-200">Field Data Type</label>
              <select
                value={form.fieldType}
                onChange={(e) => setForm({ ...form, fieldType: e.target.value })}
                className="w-full h-9 px-3 rounded-lg bg-white dark:bg-zinc-900/90 border border-slate-200 dark:border-border text-xs text-slate-900 dark:text-foreground shadow-2xs focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary"
              >
                <option value="TEXT">Short Text</option>
                <option value="LONG_TEXT">Long Text / Paragraph</option>
                <option value="NUMBER">Number</option>
                <option value="CURRENCY">Currency ($)</option>
                <option value="DATE">Date</option>
                <option value="BOOLEAN">Yes / No Toggle</option>
                <option value="SELECT">Single Select Menu</option>
                <option value="MULTI_SELECT">Multi Select Tags</option>
                <option value="URL">Web URL</option>
                <option value="EMAIL">Email Address</option>
                <option value="PHONE">Phone Number</option>
              </select>
            </div>

            {(form.fieldType === "SELECT" || form.fieldType === "MULTI_SELECT") && (
              <div>
                <label className="block mb-1 font-medium text-foreground">
                  Select Options (one per line)
                </label>
                <Textarea
                  rows={3}
                  value={form.optionsText}
                  onChange={(e) => setForm({ ...form, optionsText: e.target.value })}
                />
              </div>
            )}

            <div>
              <label className="block mb-1 font-medium text-foreground">Form Section</label>
              <Input
                placeholder="e.g. Commercial Intelligence"
                value={form.section}
                onChange={(e) => setForm({ ...form, section: e.target.value })}
              />
            </div>

            <div>
              <label className="block mb-1 font-medium text-foreground">Description / Help Text</label>
              <Input
                placeholder="Helper tip for researchers..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="req"
                checked={form.isRequired}
                onChange={(e) => setForm({ ...form, isRequired: e.target.checked })}
                className="rounded border-border cursor-pointer"
              />
              <label htmlFor="req" className="cursor-pointer text-foreground">
                Make this field required
              </label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="gradient" disabled={isSubmitting}>
                Save Field Definition
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
