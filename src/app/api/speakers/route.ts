import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-helpers";
import { hasMinimumRole } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import type { GlobalRole } from "@/generated/prisma/enums";

export async function GET(req: Request) {
  const session = await getAuthSession(req);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userRole = session.user.globalRole as GlobalRole;
  const userId = session.user.id;
  const isVolunteer = userRole === "VOLUNTEER";

  // For volunteers, scope speakers to their assigned events
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

  const speakerWhere =
    assignedEventIds !== null
      ? { events: { some: { eventId: { in: assignedEventIds } } } }
      : {};

  const eventFilter =
    assignedEventIds !== null
      ? { where: { eventId: { in: assignedEventIds } } }
      : {};

  const speakers = await prisma.speaker.findMany({
    where: speakerWhere,
    include: {
      events: {
        ...eventFilter,
        select: { status: true },
      },
    },
    orderBy: { name: "asc" },
  });

  const speakersWithStatusCounts = speakers.map((speaker) => {
    const statusCounts = speaker.events.reduce(
      (acc, es) => {
        acc[es.status] = (acc[es.status] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    const { events, ...rest } = speaker;
    return {
      ...rest,
      eventCount: events.length,
      statusCounts,
    };
  });

  return NextResponse.json(speakersWithStatusCounts);
}

export async function POST(req: NextRequest) {
  const session = await getAuthSession(req);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasMinimumRole(session.user.globalRole as GlobalRole, "EVENT_LEAD")) {
    return NextResponse.json(
      { error: "Forbidden: Event Lead role required" },
      { status: 403 }
    );
  }

  const body = await req.json();
  const { name, email, phone, bio, topic, photoUrl } = body;

  if (!name?.trim()) {
    return NextResponse.json(
      { error: "Name is required" },
      { status: 400 }
    );
  }

  const speaker = await prisma.speaker.create({
    data: {
      name: name.trim(),
      email: email?.trim() || null,
      phone: phone?.trim() || null,
      bio: bio?.trim() || null,
      topic: topic?.trim() || null,
      photoUrl: photoUrl?.trim() || null,
    },
  });

  await logAudit({
    userId: session.user.id,
    action: "CREATE",
    entityType: "Speaker",
    entityId: speaker.id,
    entityName: speaker.name,
    changes: { name: speaker.name, email: speaker.email, phone: speaker.phone, topic: speaker.topic },
  });

  return NextResponse.json(speaker, { status: 201 });
}
