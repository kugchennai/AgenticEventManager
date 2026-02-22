import { prisma } from "./prisma";
import type { AuditAction } from "@/generated/prisma/enums";

interface AuditEntry {
  userId: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  entityName?: string;
  changes?: Record<string, unknown>;
}

export async function logAudit(entry: AuditEntry) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: entry.userId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        entityName: entry.entityName ?? undefined,
        changes: entry.changes ? JSON.parse(JSON.stringify(entry.changes)) : undefined,
      },
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
  }
}

export function diffChanges(
  before: Record<string, unknown>,
  after: Record<string, unknown>
): Record<string, { from: unknown; to: unknown }> {
  const diff: Record<string, { from: unknown; to: unknown }> = {};

  for (const key of Object.keys(after)) {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      diff[key] = { from: before[key], to: after[key] };
    }
  }

  return diff;
}
