import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-helpers";
import { hasMinimumRole } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { sendEventCreatedEmail } from "@/lib/emails/triggers";
import type { GlobalRole } from "@/generated/prisma/enums";

export async function GET(req: Request) {
  const session = await getAuthSession(req);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userRole = session.user.globalRole as GlobalRole;
  const userId = session.user.id;

  const where = userRole === "VOLUNTEER"
    ? {
        OR: [
          { members: { some: { userId } } },
          { volunteers: { some: { volunteer: { userId } } } },
        ],
      }
    : undefined;

  const events = await prisma.event.findMany({
    where,
    include: {
      createdBy: { select: { id: true, name: true, image: true } },
      members: { include: { user: { select: { id: true, name: true, image: true } } } },
      _count: {
        select: { speakers: true, volunteers: true, checklists: true },
      },
    },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(events);
}

export async function POST(req: NextRequest) {
  const session = await getAuthSession(req);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasMinimumRole(session.user.globalRole as GlobalRole, "EVENT_LEAD")) {
    return NextResponse.json({ error: "Forbidden: Event Lead role required" }, { status: 403 });
  }

  const body = await req.json();
  const { title, description, date, venue, pageLink, templateId } = body;

  if (!title || !date) {
    return NextResponse.json({ error: "Title and date are required" }, { status: 400 });
  }

  if (!templateId) {
    return NextResponse.json({ error: "SOP template is required. Please create one in Settings > Templates first." }, { status: 400 });
  }

  const event = await prisma.event.create({
    data: {
      title,
      description,
      date: new Date(date),
      venue,
      pageLink: pageLink || null,
      createdById: session.user.id,
      members: {
        create: {
          userId: session.user.id,
          eventRole: "LEAD",
        },
      },
    },
    include: {
      createdBy: { select: { id: true, name: true, image: true } },
    },
  });

  if (templateId) {
    const template = await prisma.sOPTemplate.findUnique({
      where: { id: templateId },
    });

    if (template && Array.isArray(template.defaultTasks)) {
      const tasks = template.defaultTasks as Array<{
        title: string;
        relativeDays?: number;
        priority?: string;
        section?: string;
        subcategory?: string;
      }>;

      const eventDate = new Date(date);

      const sectionLabels: Record<string, string> = {
        PRE_EVENT: "Pre-Event",
        ON_DAY: "On-Day",
        POST_EVENT: "Post-Event",
      };
      const sectionOrder = ["PRE_EVENT", "ON_DAY", "POST_EVENT"];

      // Group tasks by section + subcategory for granular checklists
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

      // Sort groups: by section order first, then by insertion order within section
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
            eventId: event.id,
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
    }
  }

  await logAudit({
    userId: session.user.id,
    action: "CREATE",
    entityType: "Event",
    entityId: event.id,
    entityName: title,
    changes: { title, date, venue },
  });

  // Send event creation notification if status is SCHEDULED
  if (event.status === "SCHEDULED" || body.status === "SCHEDULED") {
    await sendEventCreatedEmail(event.id);
  }

  return NextResponse.json(event, { status: 201 });
}
