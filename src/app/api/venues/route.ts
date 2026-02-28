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

  // For volunteers, scope venue partners to their assigned events
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

  const venueWhere =
    assignedEventIds !== null
      ? { events: { some: { eventId: { in: assignedEventIds } } } }
      : {};

  const eventFilter =
    assignedEventIds !== null
      ? { where: { eventId: { in: assignedEventIds } } }
      : {};

  const venues = await prisma.venuePartner.findMany({
    where: venueWhere,
    include: {
      events: {
        ...eventFilter,
        select: { status: true },
      },
    },
    orderBy: { name: "asc" },
  });

  const venuesWithStatusCounts = venues.map((venue) => {
    const statusCounts = venue.events.reduce(
      (acc, ev) => {
        acc[ev.status] = (acc[ev.status] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    const { events, ...rest } = venue;
    return {
      ...rest,
      eventCount: events.length,
      statusCounts,
    };
  });

  return NextResponse.json(venuesWithStatusCounts);
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
  const { name, contactName, email, phone, address, capacity, notes, website, photoUrl } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (!address?.trim()) {
    return NextResponse.json({ error: "Address is required" }, { status: 400 });
  }
  if (!contactName?.trim()) {
    return NextResponse.json({ error: "Contact person is required" }, { status: 400 });
  }
  if (!email?.trim()) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }
  if (capacity === undefined || capacity === null || capacity === "") {
    return NextResponse.json({ error: "Capacity is required" }, { status: 400 });
  }

  const venue = await prisma.venuePartner.create({
    data: {
      name: name.trim(),
      contactName: contactName.trim(),
      email: email.trim(),
      phone: phone?.trim() || null,
      address: address.trim(),
      capacity: Number(capacity),
      notes: notes?.trim() || null,
      website: website?.trim() || null,
      photoUrl: photoUrl?.trim() || null,
    },
  });

  await logAudit({
    userId: session.user.id,
    action: "CREATE",
    entityType: "VenuePartner",
    entityId: venue.id,
    entityName: venue.name,
    changes: { name: venue.name, address: venue.address, contactName: venue.contactName, email: venue.email, capacity: venue.capacity },
  });

  return NextResponse.json(venue, { status: 201 });
}
