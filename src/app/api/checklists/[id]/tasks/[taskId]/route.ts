import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canUserAccessEvent } from "@/lib/permissions";
import { logAudit, diffChanges } from "@/lib/audit";

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
const STATUSES = ["TODO", "IN_PROGRESS", "BLOCKED", "DONE"] as const;

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const { id: checklistId, taskId } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const checklist = await prisma.sOPChecklist.findUnique({
    where: { id: checklistId },
    select: { id: true, eventId: true },
  });

  if (!checklist) {
    return NextResponse.json({ error: "Checklist not found" }, { status: 404 });
  }

  const canEdit = await canUserAccessEvent(session.user.id, checklist.eventId, "update");
  if (!canEdit) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const before = await prisma.sOPTask.findFirst({
    where: { id: taskId, checklistId },
  });

  if (!before) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const body = await req.json();
  const { status, priority, deadline, ownerId, assigneeId, volunteerAssigneeId, blockedReason, title } = body;

  const updateData: {
    status?: (typeof STATUSES)[number];
    priority?: (typeof PRIORITIES)[number];
    deadline?: Date | null;
    ownerId?: string | null;
    assigneeId?: string | null;
    volunteerAssigneeId?: string | null;
    blockedReason?: string | null;
    title?: string;
    completedAt?: Date | null;
  } = {};

  if (status !== undefined) {
    if (STATUSES.includes(status)) {
      updateData.status = status;
      if (status === "DONE") {
        updateData.completedAt = new Date();
      } else if (before.status === "DONE") {
        updateData.completedAt = null;
      }
    }
  }

  if (priority !== undefined && PRIORITIES.includes(priority)) {
    updateData.priority = priority;
  }

  if (deadline !== undefined) {
    updateData.deadline = deadline ? new Date(deadline) : null;
  }

  if (ownerId !== undefined) {
    updateData.ownerId = ownerId || null;
  }

  if (assigneeId !== undefined) {
    updateData.assigneeId = assigneeId || null;
    if (assigneeId) updateData.volunteerAssigneeId = null;
  }

  if (volunteerAssigneeId !== undefined) {
    updateData.volunteerAssigneeId = volunteerAssigneeId || null;
    if (volunteerAssigneeId) updateData.assigneeId = null;
  }

  if (blockedReason !== undefined) {
    updateData.blockedReason = typeof blockedReason === "string" ? blockedReason.trim() || null : null;
  }

  if (title !== undefined && typeof title === "string" && title.trim()) {
    updateData.title = title.trim();
  }

  const task = await prisma.sOPTask.update({
    where: { id: taskId },
    data: updateData,
    include: {
      owner: { select: { id: true, name: true, image: true } },
      assignee: { select: { id: true, name: true, image: true } },
      volunteerAssignee: { select: { id: true, name: true } },
    },
  });

  const beforeRecord = {
    status: before.status,
    priority: before.priority,
    deadline: before.deadline,
    ownerId: before.ownerId,
    assigneeId: before.assigneeId,
    volunteerAssigneeId: before.volunteerAssigneeId,
    blockedReason: before.blockedReason,
    title: before.title,
  };

  const afterRecord = {
    status: task.status,
    priority: task.priority,
    deadline: task.deadline,
    ownerId: task.ownerId,
    assigneeId: task.assigneeId,
    volunteerAssigneeId: task.volunteerAssigneeId,
    blockedReason: task.blockedReason,
    title: task.title,
  };

  const changes = diffChanges(beforeRecord, afterRecord);

  if (Object.keys(changes).length > 0) {
    await logAudit({
      userId: session.user.id,
      action: "UPDATE",
      entityType: "SOPTask",
      entityId: taskId,
      entityName: task.title,
      changes,
    });
  }

  return NextResponse.json(task);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const { id: checklistId, taskId } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const checklist = await prisma.sOPChecklist.findUnique({
    where: { id: checklistId },
    select: { id: true, eventId: true },
  });

  if (!checklist) {
    return NextResponse.json({ error: "Checklist not found" }, { status: 404 });
  }

  const canEdit = await canUserAccessEvent(session.user.id, checklist.eventId, "update");
  if (!canEdit) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const task = await prisma.sOPTask.findFirst({
    where: { id: taskId, checklistId },
    select: { id: true, title: true },
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  await prisma.sOPTask.delete({ where: { id: taskId } });

  await logAudit({
    userId: session.user.id,
    action: "DELETE",
    entityType: "SOPTask",
    entityId: taskId,
    entityName: task.title,
    changes: { title: task.title },
  });

  return NextResponse.json({ success: true });
}
