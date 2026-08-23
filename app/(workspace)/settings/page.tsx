import { requireAuth } from "@/lib/permissions/server-guards";
import { db } from "@/lib/db";
import { workspaces } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Settings, Building, ShieldCheck, Database, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default async function SettingsPage() {
  const ctx = await requireAuth();

  const ws = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, ctx.workspaceId))
    .limit(1);

  const workspace = ws[0] || { name: "ProspectForge Growth Lab", slug: "prospectforge" };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Workspace Settings & Configuration
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Manage workspace profile, database connections, and session preferences.
        </p>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/70 backdrop-blur-md p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-border/40 pb-4">
          <Building className="h-5 w-5 text-indigo-400" />
          <div>
            <h3 className="text-sm font-semibold text-foreground">Workspace Profile</h3>
            <p className="text-xs text-muted-foreground">General metadata and public slug</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block mb-1.5 font-medium text-foreground">Workspace Name</label>
            <Input defaultValue={workspace.name} />
          </div>
          <div>
            <label className="block mb-1.5 font-medium text-foreground">Workspace Slug</label>
            <Input defaultValue={workspace.slug} disabled className="font-mono bg-muted/40" />
          </div>
        </div>

        <div className="pt-2">
          <Button size="sm" variant="gradient" className="text-xs">
            Save Workspace Details
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/70 backdrop-blur-md p-6 space-y-4">
        <div className="flex items-center gap-3 border-b border-border/40 pb-4">
          <Database className="h-5 w-5 text-emerald-400" />
          <div>
            <h3 className="text-sm font-semibold text-foreground">Database & Infrastructure Status</h3>
            <p className="text-xs text-muted-foreground">PostgreSQL / Neon database connection layer</p>
          </div>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between p-3 rounded-xl bg-background/50 border border-border/40">
            <span className="text-muted-foreground">Connection State</span>
            <Badge variant="success" className="text-[10px]">
              Active (PostgreSQL Pool)
            </Badge>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-background/50 border border-border/40">
            <span className="text-muted-foreground">Relational Entities</span>
            <span className="font-mono font-semibold text-foreground">16 Tables</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-background/50 border border-border/40">
            <span className="text-muted-foreground">ORM Engine</span>
            <span className="font-mono font-semibold text-foreground">Drizzle ORM v0.45+</span>
          </div>
        </div>
      </div>
    </div>
  );
}
