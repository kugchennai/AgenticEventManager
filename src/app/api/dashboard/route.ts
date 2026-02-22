import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    nextEventRaw,
    myTasks,
    overdueTasks,
    totalEvents,
    confirmedSpeakersCount,
    totalVolunteers,
    tasksCompletedThisWeek,
    recentActivity,
  ] = await Promise.all([
    // nextEvent: nearest upcoming event (date > now, status != COMPLETED)
    prisma.event.findFirst({
      where: {
        date: { gt: now },
        status: { not: "COMPLETED" },
      },
      orderBy: { date: "asc" },
      include: {
        checklists: {
          include: {
            tasks: true,
          },
        },
      },
    }),

    // myTasks: SOP tasks where ownerId or assigneeId = current user, status != DONE
    prisma.sOPTask.findMany({
      where: {
        OR: [{ ownerId: userId }, { assigneeId: userId }],
        status: { not: "DONE" },
      },
      orderBy: { deadline: "asc" },
      take: 10,
      include: {
        owner: { select: { name: true } },
        assignee: { select: { name: true } },
      },
    }),

    // overdueTasks: deadline < now AND status != DONE
    prisma.sOPTask.findMany({
      where: {
        deadline: { lt: now },
        status: { not: "DONE" },
      },
      orderBy: { deadline: "asc" },
      take: 10,
      include: {
        owner: { select: { name: true } },
        assignee: { select: { name: true } },
      },
    }),

    prisma.event.count(),

    // totalSpeakers: EventSpeaker where status = CONFIRMED
    prisma.eventSpeaker.count({ where: { status: "CONFIRMED" } }),

    // totalVolunteers: unique Volunteer count
    prisma.volunteer.count(),

    // tasksCompletedThisWeek: SOPTask where completedAt >= 7 days ago
    prisma.sOPTask.count({
      where: { completedAt: { gte: sevenDaysAgo } },
    }),

    // recentActivity: last 10 audit logs with user info
    prisma.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
    }),
  ]);

  // Build nextEvent with progress
  let nextEvent = null;
  if (nextEventRaw) {
    const allTasks = nextEventRaw.checklists.flatMap((c) => c.tasks);
    const totalTasks = allTasks.length;
    const tasksDone = allTasks.filter((t) => t.status === "DONE").length;
    const progress = totalTasks > 0 ? Math.round((tasksDone / totalTasks) * 100) : 0;

    nextEvent = {
      id: nextEventRaw.id,
      title: nextEventRaw.title,
      date: nextEventRaw.date,
      venue: nextEventRaw.venue,
      status: nextEventRaw.status,
      progress,
      tasksCompleted: tasksDone,
      tasksTotal: totalTasks,
    };
  }

  // Transform myTasks for response
  const myTasksFormatted = myTasks.map((t) => ({
    id: t.id,
    title: t.title,
    priority: t.priority,
    status: t.status,
    deadline: t.deadline,
    owner: t.owner?.name ?? t.assignee?.name ?? null,
  }));

  // Transform overdueTasks for response
  const overdueTasksFormatted = overdueTasks.map((t) => ({
    id: t.id,
    title: t.title,
    deadline: t.deadline,
    owner: t.owner?.name ?? t.assignee?.name ?? null,
  }));

  return NextResponse.json({
    nextEvent,
    myTasks: myTasksFormatted,
    overdueTasks: overdueTasksFormatted,
    stats: {
      totalEvents,
      totalSpeakers: confirmedSpeakersCount,
      totalVolunteers,
      tasksCompletedThisWeek,
    },
    recentActivity,
  });
}
