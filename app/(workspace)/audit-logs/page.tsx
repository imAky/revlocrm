import { requireAuth } from "@/lib/permissions/server-guards";
import { db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { ShieldAlert, Clock, User, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";

export default async function AuditLogsPage() {
  const ctx = await requireAuth();

  const logs = await db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.workspaceId, ctx.workspaceId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(50);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Workspace Security & Audit Trail
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
              Append-Only
            </span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Immutable log of all user logins, prospect deletions, stage changes, and permission modifications.
          </p>
        </div>
        <Badge variant="secondary" className="text-xs font-mono">
          {logs.length} Recent Audit Entries
        </Badge>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card/70 backdrop-blur-md overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Target Entity</TableHead>
              <TableHead>Details / Payload</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-xs text-muted-foreground">
                  No audit logs recorded yet.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleDateString()} at{" "}
                    {new Date(log.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </TableCell>

                  <TableCell>
                    <span className="text-xs font-medium text-foreground">
                      {log.actorEmail || "System"}
                    </span>
                  </TableCell>

                  <TableCell>
                    <Badge variant="purple" className="text-[10px] font-mono">
                      {log.action}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    <span className="text-xs text-muted-foreground font-mono">
                      {log.entityType} ({log.entityId.slice(0, 8)}...)
                    </span>
                  </TableCell>

                  <TableCell className="text-xs text-muted-foreground max-w-md truncate font-mono text-[11px]">
                    {log.afterData || log.beforeData || log.metadata || "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
