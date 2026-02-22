import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canUserAccessEvent } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const canEdit = await canUserAccessEvent(session.user.id, eventId, "update");
  if (!canEdit) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { volunteerId, assignedRole } = body;

  if (!volunteerId) {
    return NextResponse.json({ error: "volunteerId is required" }, { status: 400 });
  }

  const existing = await prisma.eventVolunteer.findUnique({
    where: { eventId_volunteerId: { eventId, volunteerId } },
  });

  if (existing) {
    return NextResponse.json({ error: "Volunteer already linked to this event" }, { status: 409 });
  }

  const link = await prisma.eventVolunteer.create({
    data: {
      eventId,
      volunteerId,
      assignedRole: assignedRole || null,
    },
    include: {
      volunteer: { select: { id: true, name: true, email: true } },
    },
  });

  await logAudit({
    userId: session.user.id,
    action: "CREATE",
    entityType: "EventVolunteer",
    entityId: link.id,
    entityName: link.volunteer.name,
    changes: { eventId, volunteerId, assignedRole },
  });

  return NextResponse.json(link, { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const canEdit = await canUserAccessEvent(session.user.id, eventId, "update");
  if (!canEdit) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const volunteerId = searchParams.get("volunteerId");

  if (!volunteerId) {
    return NextResponse.json({ error: "volunteerId query param is required" }, { status: 400 });
  }

  const link = await prisma.eventVolunteer.findUnique({
    where: { eventId_volunteerId: { eventId, volunteerId } },
    include: { volunteer: { select: { name: true } } },
  });

  if (!link) {
    return NextResponse.json({ error: "Link not found" }, { status: 404 });
  }

  await prisma.eventVolunteer.delete({ where: { id: link.id } });

  await logAudit({
    userId: session.user.id,
    action: "DELETE",
    entityType: "EventVolunteer",
    entityId: link.id,
    entityName: link.volunteer.name,
    changes: { eventId, volunteerId },
  });

  return NextResponse.json({ success: true });
}
