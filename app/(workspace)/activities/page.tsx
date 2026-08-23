import { requireAuth } from "@/lib/permissions/server-guards";
import { db } from "@/lib/db";
import { activities, prospects, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { History, Building2, User, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default async function ActivitiesPage() {
  const ctx = await requireAuth();

  const allActivities = await db
    .select({
      id: activities.id,
      type: activities.type,
      title: activities.title,
      description: activities.description,
      outcome: activities.outcome,
      nextAction: activities.nextAction,
      performedAt: activities.performedAt,
      prospectId: activities.prospectId,
      prospectName: prospects.name,
      userName: users.name,
    })
    .from(activities)
    .innerJoin(prospects, eq(activities.prospectId, prospects.id))
    .innerJoin(users, eq(activities.userId, users.id))
    .where(eq(activities.workspaceId, ctx.workspaceId))
    .orderBy(desc(activities.performedAt));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Activity & Outreach Log
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Complete chronological record of all team interactions, discovery calls, and research notes.
          </p>
        </div>
        <Badge variant="secondary" className="text-xs font-mono">
          {allActivities.length} Logged Events
        </Badge>
      </div>

      <div className="space-y-3">
        {allActivities.length === 0 ? (
          <div className="text-center py-12 rounded-2xl border border-border/60 bg-card/40 text-xs text-muted-foreground">
            No activity recorded yet.
          </div>
        ) : (
          allActivities.map((act) => (
            <div
              key={act.id}
              className="p-5 rounded-2xl border border-border/60 bg-card/70 backdrop-blur-md space-y-2 hover:border-indigo-500/40 transition-colors"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <Badge variant="info" className="uppercase font-mono text-[10px]">
                    {act.type}
                  </Badge>
                  <h3 className="text-sm font-semibold text-foreground">{act.title}</h3>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  <span>
                    {new Date(act.performedAt).toLocaleDateString()} at{" "}
                    {new Date(act.performedAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>

              {act.description && (
                <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {act.description}
                </p>
              )}

              {act.outcome && (
                <div className="text-xs text-emerald-400 bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20 font-medium">
                  Outcome: {act.outcome}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/30 text-xs text-muted-foreground">
                <Link
                  href={`/prospects/${act.prospectId}`}
                  className="flex items-center gap-1 text-primary hover:underline font-medium"
                >
                  <Building2 className="h-3.5 w-3.5" />
                  {act.prospectName}
                </Link>
                <span>Logged by: {act.userName}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
