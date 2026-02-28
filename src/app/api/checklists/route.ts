import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-helpers";
import { canUserAccessEvent } from "@/lib/permissions";

type TaskInput = {
  title: string;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  deadline?: string;
  ownerId?: string;
};

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

function validateTasks(tasks: unknown): TaskInput[] {
  if (!Array.isArray(tasks)) return [];
  return tasks
    .filter((t): t is TaskInput => {
      if (!t || typeof t !== "object") return false;
      const obj = t as Record<string, unknown>;
      return typeof obj.title === "string" && obj.title.trim().length > 0;
    })
    .map((t) => ({
      title: (t as TaskInput).title.trim(),
      priority: PRIORITIES.includes((t as TaskInput).priority as (typeof PRIORITIES)[number])
        ? ((t as TaskInput).priority as (typeof PRIORITIES)[number])
        : "MEDIUM",
      deadline: typeof (t as TaskInput).deadline === "string" ? (t as TaskInput).deadline : undefined,
      ownerId: typeof (t as TaskInput).ownerId === "string" ? (t as TaskInput).ownerId : undefined,
    }));
}

export async function POST(req: NextRequest) {
  const session = await getAuthSession(req);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { eventId, title, tasks } = body;

  if (!eventId || !title || typeof title !== "string" || !title.trim()) {
    return NextResponse.json(
      { error: "eventId and title are required" },
      { status: 400 }
    );
  }

  const canEdit = await canUserAccessEvent(session.user.id, eventId, "update");
  if (!canEdit) {
    return NextResponse.json({ error: "Forbidden: No access to this event" }, { status: 403 });
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, date: true },
  });

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const validatedTasks = validateTasks(tasks ?? []);

  const maxSortOrder = await prisma.sOPChecklist.aggregate({
    where: { eventId },
    _max: { sortOrder: true },
  });
  const sortOrder = (maxSortOrder._max.sortOrder ?? -1) + 1;

  const checklist = await prisma.sOPChecklist.create({
    data: {
      eventId,
      title: title.trim(),
      sortOrder,
      tasks: {
        create: validatedTasks.map((task, index) => ({
          title: task.title,
          priority: task.priority ?? "MEDIUM",
          sortOrder: index,
          deadline: task.deadline ? new Date(task.deadline) : null,
          ownerId: task.ownerId ?? session.user.id,
        })),
      },
    },
    include: {
      tasks: {
        include: {
          owner: { select: { id: true, name: true, image: true } },
          assignee: { select: { id: true, name: true, image: true } },
        },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  return NextResponse.json(checklist, { status: 201 });
}
