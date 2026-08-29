"use client";

import { useState, useMemo } from "react";
import {
  Sliders,
  Plus,
  CheckCircle,
  Tag,
  Layers,
  HelpCircle,
  Search,
  Filter,
  Code2,
  Sparkles,
  Type,
  ListFilter,
  Calendar,
  ToggleLeft,
  DollarSign,
  Hash,
  Globe,
  Mail,
  Phone,
  AlignLeft,
  X,
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
import { createCustomFieldAction } from "@/lib/actions/custom-fields";

export interface CustomFieldItem {
  id: string;
  name: string;
  key: string;
  description?: string | null;
  fieldType: string;
  section: string;
  isRequired: boolean;
  isFilterable: boolean;
  displayOrder?: number;
}

const FIELD_TYPE_CONFIG = [
  { value: "TEXT", label: "Short Text", icon: Type, color: "text-blue-500" },
  { value: "LONG_TEXT", label: "Long Text / Paragraph", icon: AlignLeft, color: "text-indigo-500" },
  { value: "NUMBER", label: "Number", icon: Hash, color: "text-emerald-500" },
  { value: "CURRENCY", label: "Currency ($)", icon: DollarSign, color: "text-amber-500" },
  { value: "DATE", label: "Date", icon: Calendar, color: "text-rose-500" },
  { value: "BOOLEAN", label: "Yes / No Toggle", icon: ToggleLeft, color: "text-teal-500" },
  { value: "SELECT", label: "Single Select Dropdown", icon: ListFilter, color: "text-purple-500" },
  { value: "MULTI_SELECT", label: "Multi Select Tags", icon: Tag, color: "text-pink-500" },
  { value: "URL", label: "Web URL Link", icon: Globe, color: "text-sky-500" },
  { value: "EMAIL", label: "Email Address", icon: Mail, color: "text-indigo-400" },
  { value: "PHONE", label: "Phone Number", icon: Phone, color: "text-emerald-400" },
];

export function CustomFieldsClient({
  initialFields,
  canManage = false,
}: {
  initialFields: CustomFieldItem[];
  canManage?: boolean;
}) {
  const [fieldsList, setFieldsList] = useState<CustomFieldItem[]>(initialFields);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSection, setSelectedSection] = useState("ALL");

  const [form, setForm] = useState({
    name: "",
    key: "",
    description: "",
    fieldType: "TEXT",
    section: "Commercial Intelligence",
    isRequired: false,
    isFilterable: true,
    optionsText: "Option 1\nOption 2\nOption 3",
  });

  // Unique sections for filtering
  const sections = useMemo(() => {
    const set = new Set<string>();
    fieldsList.forEach((f) => {
      if (f.section) set.add(f.section);
    });
    return Array.from(set).sort();
  }, [fieldsList]);

  // Filtered fields
  const filteredFields = useMemo(() => {
    return fieldsList.filter((f) => {
      if (selectedSection !== "ALL" && f.section !== selectedSection) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = f.name.toLowerCase().includes(q);
        const matchKey = f.key.toLowerCase().includes(q);
        const matchDesc = f.description?.toLowerCase().includes(q) || false;
        if (!matchName && !matchKey && !matchDesc) return false;
      }
      return true;
    });
  }, [fieldsList, selectedSection, searchQuery]);

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

    const res = await createCustomFieldAction({
      name: form.name.trim(),
      key: form.key.trim(),
      description: form.description.trim() || undefined,
      fieldType: form.fieldType,
      section: form.section.trim() || "Custom Attributes",
      isRequired: form.isRequired,
      isFilterable: form.isFilterable,
      options,
    });

    if (res?.success) {
      const newField: CustomFieldItem = {
        id: res.fieldId || crypto.randomUUID(),
        name: form.name.trim(),
        key: form.key.trim(),
        description: form.description.trim() || null,
        fieldType: form.fieldType,
        section: form.section.trim() || "Custom Attributes",
        isRequired: form.isRequired,
        isFilterable: form.isFilterable,
      };
      setFieldsList((prev) => [...prev, newField]);
    }

    setForm({
      name: "",
      key: "",
      description: "",
      fieldType: "TEXT",
      section: "Commercial Intelligence",
      isRequired: false,
      isFilterable: true,
      optionsText: "Option 1\nOption 2\nOption 3",
    });

    setIsAddOpen(false);
    setIsSubmitting(false);
  };

  const getFieldTypeConfig = (type: string) => {
    return FIELD_TYPE_CONFIG.find((c) => c.value === type) || FIELD_TYPE_CONFIG[0];
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="rounded-2xl border border-border/60 bg-card/70 p-4 sm:p-6 backdrop-blur-md space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <span>Dynamic Custom Fields Engine</span>
                <Badge variant="secondary" className="text-xs font-mono">
                  {fieldsList.length} Defined
                </Badge>
              </h1>
            </div>
            <p className="text-xs text-muted-foreground pt-1">
              Zero-migration structured data fields, dropdowns, and intelligence attributes rendered across forms and AI summaries
            </p>
          </div>

          {canManage && (
            <Button
              size="sm"
              variant="gradient"
              onClick={() => setIsAddOpen(true)}
              className="text-xs gap-1.5 shadow-xs font-semibold rounded-xl self-start sm:self-auto cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Create Custom Field</span>
            </Button>
          )}
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-border/40 text-xs">
          {/* Search Box */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search field name, key, description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-9 pr-3 text-xs bg-background/90 dark:bg-zinc-950/90 rounded-xl"
            />
          </div>

          {/* Section Filter */}
          <div className="flex items-center gap-2">
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="h-8 px-2.5 rounded-xl bg-card dark:bg-zinc-900 border border-border/80 text-xs text-foreground dark:text-zinc-100 shadow-2xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="ALL" className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">
                All Form Sections ({sections.length})
              </option>
              {sections.map((sec) => (
                <option key={sec} value={sec} className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100">
                  {sec}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid of Dynamic Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFields.length === 0 ? (
          <div className="col-span-full text-center py-16 rounded-2xl border border-dashed border-border/70 bg-card/40 space-y-3">
            <Sliders className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="text-sm font-semibold text-foreground">No dynamic fields found</p>
            <p className="text-xs text-muted-foreground">
              {fieldsList.length === 0
                ? "Click 'Create Custom Field' to define your first custom attribute."
                : "Try adjusting your search query or section filter."}
            </p>
            {canManage && fieldsList.length === 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsAddOpen(true)}
                className="text-xs gap-1.5 rounded-xl cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create Field</span>
              </Button>
            )}
          </div>
        ) : (
          filteredFields.map((field) => {
            const config = getFieldTypeConfig(field.fieldType);
            const Icon = config.icon;

            return (
              <div
                key={field.id}
                className="p-5 rounded-2xl border border-border/70 bg-card/90 dark:bg-zinc-900/90 backdrop-blur-md space-y-3.5 hover:border-primary/50 transition-all shadow-xs flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <h3 className="font-bold text-sm text-foreground truncate">
                          {field.name}
                        </h3>
                        <code className="text-[11px] text-muted-foreground bg-muted/60 dark:bg-zinc-950 px-1.5 py-0.5 rounded-md font-mono border border-border/40 inline-block">
                          {field.key}
                        </code>
                      </div>
                    </div>

                    <Badge variant="outline" className="text-[10px] uppercase font-mono shrink-0">
                      {config.label}
                    </Badge>
                  </div>

                  {field.description ? (
                    <p className="text-xs text-muted-foreground leading-relaxed pl-10.5">
                      {field.description}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground/60 italic pl-10.5">
                      No helper description provided.
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs text-muted-foreground">
                  <span className="truncate max-w-[150px]">Section: {field.section}</span>
                  <Badge
                    variant={field.isRequired ? "warning" : "secondary"}
                    className="text-[10px] font-mono"
                  >
                    {field.isRequired ? "Required" : "Optional"}
                  </Badge>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ========================================================================= */}
      {/* 1. UPGRADED CREATE DYNAMIC FIELD MODAL                                     */}
      {/* ========================================================================= */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#121218] text-foreground dark:text-zinc-100 border border-slate-200/90 dark:border-zinc-800 shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-3 pb-2 border-b border-border/60">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  Create Dynamic Custom Field
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Define a structured custom attribute for all workspace prospects
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-3.5 pt-1 text-xs">
            <div>
              <label className="block mb-1.5 font-semibold text-foreground">
                Field Label <span className="text-destructive">*</span>
              </label>
              <Input
                required
                placeholder="e.g. Current CRM Tool"
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  const key = name.toLowerCase().replace(/[^a-z0-9]/g, "_");
                  setForm({ ...form, name, key });
                }}
                className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl font-medium"
              />
            </div>

            <div>
              <label className="block mb-1.5 font-semibold text-foreground">
                Field Key (API identifier) <span className="text-destructive">*</span>
              </label>
              <Input
                required
                placeholder="current_crm_tool"
                value={form.key}
                onChange={(e) => setForm({ ...form, key: e.target.value })}
                className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl font-mono text-xs"
              />
            </div>

            <div>
              <label className="block mb-1.5 font-semibold text-foreground">Field Data Type</label>
              <select
                value={form.fieldType}
                onChange={(e) => setForm({ ...form, fieldType: e.target.value })}
                className="w-full h-9 px-3 rounded-xl bg-card dark:bg-zinc-900 border border-border/80 text-xs text-foreground dark:text-zinc-100 shadow-2xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                {FIELD_TYPE_CONFIG.map((c) => (
                  <option
                    key={c.value}
                    value={c.value}
                    className="bg-card dark:bg-zinc-900 text-foreground dark:text-zinc-100 py-1"
                  >
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {(form.fieldType === "SELECT" || form.fieldType === "MULTI_SELECT") && (
              <div>
                <label className="block mb-1.5 font-semibold text-foreground">
                  Dropdown Options (One per line)
                </label>
                <Textarea
                  rows={3}
                  value={form.optionsText}
                  onChange={(e) => setForm({ ...form, optionsText: e.target.value })}
                  placeholder="Option 1&#10;Option 2&#10;Option 3"
                  className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl font-mono text-xs"
                />
              </div>
            )}

            <div>
              <label className="block mb-1.5 font-semibold text-foreground">Form Section Group</label>
              <Input
                placeholder="e.g. Commercial Intelligence"
                value={form.section}
                onChange={(e) => setForm({ ...form, section: e.target.value })}
                className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
              />
            </div>

            <div>
              <label className="block mb-1.5 font-semibold text-foreground">Helper Tip / Description</label>
              <Input
                placeholder="Guidance for sales reps and researchers..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="bg-background/90 dark:bg-zinc-950/90 border-border/80 rounded-xl"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="field-req"
                checked={form.isRequired}
                onChange={(e) => setForm({ ...form, isRequired: e.target.checked })}
                className="h-4 w-4 rounded border-border cursor-pointer"
              />
              <label htmlFor="field-req" className="cursor-pointer font-semibold text-foreground">
                Make this field required in forms
              </label>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t border-border/60">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddOpen(false)}
                className="rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="gradient"
                disabled={isSubmitting}
                className="rounded-xl text-xs font-semibold gap-1.5 cursor-pointer"
              >
                <CheckCircle className="h-4 w-4" />
                <span>{isSubmitting ? "Saving..." : "Save Field Definition"}</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
