import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-helpers";
import type { GlobalRole } from "@/generated/prisma/enums";

export async function GET(req: Request) {
  const session = await getAuthSession(req);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const userRole = session.user.globalRole as GlobalRole;
  const isVolunteer = userRole === "VOLUNTEER";
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // For volunteers, resolve assigned event IDs to scope all dashboard data
  let assignedEventIds: string[] | null = null;
  if (isVolunteer) {
    const [volunteerLinks, memberLinks] = await Promise.all([
      prisma.eventVolunteer.findMany({
        where: { volunteer: { userId } },
        select: { eventId: true },
      }),
      prisma.eventMember.findMany({
        where: { userId },
        select: { eventId: true },
      }),
    ]);
    assignedEventIds = [
      ...new Set([
        ...volunteerLinks.map((v) => v.eventId),
        ...memberLinks.map((m) => m.eventId),
      ]),
    ];
  }

  // Build audit log filter: for volunteers, only show logs related to their events
  let auditWhere: object | undefined;
  if (assignedEventIds !== null) {
    if (assignedEventIds.length === 0) {
      auditWhere = { id: { in: [] as string[] } };
    } else {
      const [evSpeakers, evVolunteers, evTasks] = await Promise.all([
        prisma.eventSpeaker.findMany({
          where: { eventId: { in: assignedEventIds } },
          select: { id: true },
        }),
        prisma.eventVolunteer.findMany({
          where: { eventId: { in: assignedEventIds } },
          select: { id: true },
        }),
        prisma.sOPTask.findMany({
          where: { checklist: { eventId: { in: assignedEventIds } } },
          select: { id: true },
        }),
      ]);
      auditWhere = {
        OR: [
          { entityType: "Event", entityId: { in: assignedEventIds } },
          { entityType: "EventSpeaker", entityId: { in: evSpeakers.map((e) => e.id) } },
          { entityType: "EventVolunteer", entityId: { in: evVolunteers.map((e) => e.id) } },
          { entityType: "SOPTask", entityId: { in: evTasks.map((e) => e.id) } },
        ],
      };
    }
  }

  const eventScope =
    assignedEventIds !== null ? { id: { in: assignedEventIds } } : {};

  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const [
    nextEventRaw,
    myTasks,
    overdueTasks,
    totalEvents,
    upcomingEvents,
    pastEvents,
    todayEvents,
    confirmedSpeakersCount,
    totalVolunteers,
    tasksCompletedThisWeek,
    recentActivity,
  ] = await Promise.all([
    prisma.event.findFirst({
      where: {
        ...eventScope,
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

    prisma.sOPTask.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { assigneeId: userId },
          { volunteerAssignee: { userId } },
        ],
        status: { not: "DONE" },
      },
      orderBy: { deadline: "asc" },
      take: 10,
      include: {
        owner: { select: { name: true } },
        assignee: { select: { name: true } },
        volunteerAssignee: { select: { name: true } },
        checklist: {
          select: {
            id: true,
            event: { select: { id: true, title: true } },
          },
        },
      },
    }),

    // Overdue tasks: for volunteers, only from assigned events
    prisma.sOPTask.findMany({
      where: {
        deadline: { lt: now },
        status: { not: "DONE" },
        ...(assignedEventIds !== null
          ? { checklist: { eventId: { in: assignedEventIds } } }
          : {}),
      },
      orderBy: { deadline: "asc" },
      take: 10,
      include: {
        owner: { select: { name: true } },
        assignee: { select: { name: true } },
      },
    }),

    prisma.event.count(
      assignedEventIds !== null
        ? { where: { id: { in: assignedEventIds } } }
        : undefined
    ),

    prisma.event.count({
      where: {
        ...eventScope,
        date: { gt: endOfDay },
      },
    }),

    prisma.event.count({
      where: {
        ...eventScope,
        date: { lt: startOfDay },
      },
    }),

    prisma.event.count({
      where: {
        ...eventScope,
        date: { gte: startOfDay, lte: endOfDay },
      },
    }),

    prisma.speaker.count(),

    prisma.volunteer.count(
      assignedEventIds !== null
        ? {
            where: {
              events: { some: { eventId: { in: assignedEventIds } } },
            },
          }
        : undefined
    ),

    prisma.sOPTask.count({
      where: {
        completedAt: { gte: sevenDaysAgo },
        ...(assignedEventIds !== null
          ? { checklist: { eventId: { in: assignedEventIds } } }
          : {}),
      },
    }),

    // Recent activity: for volunteers, only logs related to their events
    prisma.auditLog.findMany({
      where: auditWhere,
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    }),
  ]);

  // Build nextEvent with progress
  let nextEvent = null;
  if (nextEventRaw) {
    const allTasks = nextEventRaw.checklists.flatMap((c) => c.tasks);
    const totalTasks = allTasks.length;
    const tasksDone = allTasks.filter((t) => t.status === "DONE").length;
    const progress =
      totalTasks > 0 ? Math.round((tasksDone / totalTasks) * 100) : 0;

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

  const myTasksFormatted = myTasks.map((t) => ({
    id: t.id,
    title: t.title,
    priority: t.priority,
    status: t.status,
    deadline: t.deadline,
    owner:
      t.owner?.name ?? t.assignee?.name ?? t.volunteerAssignee?.name ?? null,
    checklistId: t.checklist.id,
    eventId: t.checklist.event.id,
    eventTitle: t.checklist.event.title,
  }));

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
      upcomingEvents,
      pastEvents,
      todayEvents,
      totalSpeakers: confirmedSpeakersCount,
      totalVolunteers,
      tasksCompletedThisWeek,
    },
    recentActivity,
  });
}
