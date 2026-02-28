import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-helpers";
import { canUserAccessEvent } from "@/lib/permissions";

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: checklistId } = await params;
  const session = await getAuthSession(req);
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

  const canAccess = await canUserAccessEvent(session.user.id, checklist.eventId, "read");
  if (!canAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const tasks = await prisma.sOPTask.findMany({
    where: { checklistId },
    include: {
      owner: { select: { id: true, name: true, image: true } },
      assignee: { select: { id: true, name: true, image: true } },
    },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json(tasks);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: checklistId } = await params;
  const session = await getAuthSession(req);
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

  const body = await req.json();
  const { title, priority, deadline, ownerId, assigneeId } = body;

  if (!title || typeof title !== "string" || !title.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const maxSortOrder = await prisma.sOPTask.aggregate({
    where: { checklistId },
    _max: { sortOrder: true },
  });
  const sortOrder = (maxSortOrder._max.sortOrder ?? -1) + 1;

  const task = await prisma.sOPTask.create({
    data: {
      checklistId,
      title: title.trim(),
      priority: PRIORITIES.includes(priority) ? priority : "MEDIUM",
      sortOrder,
      deadline: deadline ? new Date(deadline) : null,
      ownerId: ownerId ?? session.user.id,
      assigneeId: assigneeId ?? null,
    },
    include: {
      owner: { select: { id: true, name: true, image: true } },
      assignee: { select: { id: true, name: true, image: true } },
    },
  });

  return NextResponse.json(task, { status: 201 });
}
