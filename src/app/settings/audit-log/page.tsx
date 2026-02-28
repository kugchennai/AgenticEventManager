"use client";

import { PageHeader, EmptyState, OwnerAvatar } from "@/components/design-system";
import { ClipboardCheck, Filter, ShieldX } from "lucide-react";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface AuditEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  entityName: string | null;
  changes: Record<string, unknown> | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
}

const ENTITY_LABELS: Record<string, string> = {
  Event: "Event",
  Speaker: "Speaker",
  Volunteer: "Volunteer",
  SOPTask: "Task",
  SOPTemplate: "Template",
  EventSpeaker: "Event Speaker",
  EventVolunteer: "Event Volunteer",
  User: "Member",
};

function inferEntityName(log: AuditEntry): string | null {
  if (log.entityName) return log.entityName;
  if (!log.changes) return null;

  const nameKeys = ["title", "name"];
  for (const key of nameKeys) {
    const val = log.changes[key];
    if (typeof val === "string") return val;
    if (val != null && typeof val === "object" && "to" in (val as Record<string, unknown>)) {
      const to = (val as { to: unknown }).to;
      if (typeof to === "string") return to;
    }
    if (val != null && typeof val === "object" && "from" in (val as Record<string, unknown>)) {
      const from = (val as { from: unknown }).from;
      if (typeof from === "string") return from;
    }
  }
  return null;
}

const ACTION_STYLES: Record<string, string> = {
  CREATE: "text-status-done bg-status-done/10",
  UPDATE: "text-status-progress bg-status-progress/10",
  DELETE: "text-status-blocked bg-status-blocked/10",
};

export default function AuditLogPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState("");

  const role = session?.user?.globalRole;
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";

  useEffect(() => {
    if (status === "loading") return;
    if (!isAdmin) router.replace("/dashboard");
  }, [status, isAdmin, router]);

  if (status === "loading" || !isAdmin) return null;

  useEffect(() => {
    const params = new URLSearchParams();
    if (entityFilter) params.set("entityType", entityFilter);

    fetch(`/api/audit-log?${params}`)
      .then((r) => (r.ok ? r.json() : { logs: [] }))
      .then((data) => setLogs(data.logs))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, [entityFilter]);

  const entityTypes = [
    { value: "Event", label: "Event" },
    { value: "Speaker", label: "Speaker" },
    { value: "Volunteer", label: "Volunteer" },
    { value: "SOPTask", label: "Task" },
    { value: "SOPTemplate", label: "Template" },
    { value: "EventSpeaker", label: "Event Speaker" },
    { value: "EventVolunteer", label: "Event Volunteer" },
    { value: "User", label: "Member" },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Audit Log"
        description="Track all changes across your workspace"
        actions={
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted" />
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:border-accent outline-none cursor-pointer"
            >
              <option value="">All types</option>
              {entityTypes.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        }
      />

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-surface border border-border">
              <div className="h-8 w-8 rounded-full animate-shimmer" />
              <div className="h-4 w-48 rounded animate-shimmer" />
              <div className="ml-auto h-4 w-20 rounded animate-shimmer" />
            </div>
          ))}
        </div>
      ) : logs.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="No activity yet"
          description="Changes to events, speakers, volunteers, and tasks will be logged here."
        />
      ) : (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          {logs.map((log, i) => (
            <div
              key={log.id}
              className={cn(
                "flex items-start gap-4 px-5 py-3.5",
                "border-b border-border last:border-0",
                "hover:bg-surface-hover transition-colors"
              )}
            >
              <OwnerAvatar name={log.user.name} image={log.user.image} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-medium">{log.user.name ?? log.user.email}</span>
                  {" "}
                  <span
                    className={cn(
                      "inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase",
                      ACTION_STYLES[log.action] ?? "text-muted bg-surface-hover"
                    )}
                  >
                    {log.action.toLowerCase()}d
                  </span>
                  {" "}
                  <span className="text-muted">{ENTITY_LABELS[log.entityType] ?? log.entityType}</span>
                  {" "}
                  {(() => {
                    const displayName = inferEntityName(log);
                    return displayName ? (
                      <span className="font-medium text-foreground/80">{displayName}</span>
                    ) : (
                      <span className="font-[family-name:var(--font-mono)] text-xs text-muted">
                        {log.entityId.slice(0, 8)}
                      </span>
                    );
                  })()}
                </p>
                {log.changes && Object.keys(log.changes).length > 0 && (
                  <div className="mt-1.5 text-xs text-muted space-y-0.5">
                    {Object.entries(log.changes).map(([key, val]) => {
                      const isDiff = val != null && typeof val === "object" && "from" in val;
                      return (
                        <p key={key}>
                          <span className="font-medium text-foreground/70">{key}:</span>{" "}
                          {isDiff ? (
                            <>
                              <span className="text-status-blocked line-through">{String((val as {from:unknown;to:unknown}).from)}</span>{" "}
                              → <span className="text-status-done">{String((val as {from:unknown;to:unknown}).to)}</span>
                            </>
                          ) : (
                            <span className="text-foreground/80">{String(val)}</span>
                          )}
                        </p>
                      );
                    })}
                  </div>
                )}
              </div>
              <span className="text-[11px] font-[family-name:var(--font-mono)] text-muted shrink-0">
                {new Date(log.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
