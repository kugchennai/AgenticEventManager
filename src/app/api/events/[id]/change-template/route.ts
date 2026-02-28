import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-helpers";
import { hasMinimumRole } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;
  const session = await getAuthSession(req);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only ADMIN and above can change SOP template
  if (!hasMinimumRole(session.user.globalRole as "VIEWER" | "VOLUNTEER" | "EVENT_LEAD" | "ADMIN" | "SUPER_ADMIN", "ADMIN")) {
    return NextResponse.json({ error: "Only admins can change the SOP template" }, { status: 403 });
  }

  const body = await req.json();
  const { templateId } = body;

  if (!templateId) {
    return NextResponse.json({ error: "Template ID is required" }, { status: 400 });
  }

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, title: true, date: true },
  });

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const template = await prisma.sOPTemplate.findUnique({
    where: { id: templateId },
  });

  if (!template) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  if (!Array.isArray(template.defaultTasks)) {
    return NextResponse.json({ error: "Template has no tasks" }, { status: 400 });
  }

  // Delete all existing checklists (cascade deletes tasks)
  await prisma.sOPChecklist.deleteMany({
    where: { eventId },
  });

  // Re-apply the new template (same logic as event creation)
  const tasks = template.defaultTasks as Array<{
    title: string;
    relativeDays?: number;
    priority?: string;
    section?: string;
    subcategory?: string;
  }>;

  const eventDate = new Date(event.date);

  const sectionLabels: Record<string, string> = {
    PRE_EVENT: "Pre-Event",
    ON_DAY: "On-Day",
    POST_EVENT: "Post-Event",
  };
  const sectionOrder = ["PRE_EVENT", "ON_DAY", "POST_EVENT"];

  type GroupKey = string;
  const grouped: Map<GroupKey, { section: string; subcategory: string; tasks: typeof tasks }> = new Map();
  const groupOrder: GroupKey[] = [];

  for (const task of tasks) {
    const sec = task.section && sectionOrder.includes(task.section)
      ? task.section
      : (task.relativeDays ?? 0) > 0 ? "PRE_EVENT" : (task.relativeDays ?? 0) === 0 ? "ON_DAY" : "POST_EVENT";
    const sub = task.subcategory?.trim() || sectionLabels[sec];
    const key = `${sec}::${sub}`;

    if (!grouped.has(key)) {
      grouped.set(key, { section: sec, subcategory: sub, tasks: [] });
      groupOrder.push(key);
    }
    grouped.get(key)!.tasks.push(task);
  }

  groupOrder.sort((a, b) => {
    const secA = sectionOrder.indexOf(a.split("::")[0]);
    const secB = sectionOrder.indexOf(b.split("::")[0]);
    return secA - secB;
  });

  let sortIdx = 0;
  for (const key of groupOrder) {
    const group = grouped.get(key)!;
    const sectionTasks = group.tasks;
    if (sectionTasks.length === 0) continue;

    const checklistTitle = `${sectionLabels[group.section]}: ${group.subcategory}`;

    await prisma.sOPChecklist.create({
      data: {
        eventId,
        title: checklistTitle,
        sortOrder: sortIdx++,
        tasks: {
          create: sectionTasks.map((task, index) => ({
            title: task.title,
            priority: (task.priority as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL") ?? "MEDIUM",
            sortOrder: index,
            deadline: task.relativeDays != null
              ? new Date(eventDate.getTime() - task.relativeDays * 24 * 60 * 60 * 1000)
              : undefined,
          })),
        },
      },
    });
  }

  await logAudit({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "Event",
    entityId: eventId,
    entityName: event.title,
    changes: { sopTemplate: { to: template.name } },
  });

  return NextResponse.json({ success: true, templateName: template.name });
}
