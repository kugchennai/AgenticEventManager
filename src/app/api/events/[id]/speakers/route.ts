import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-helpers";
import { canUserAccessEvent } from "@/lib/permissions";
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

  const canEdit = await canUserAccessEvent(session.user.id, eventId, "update");
  if (!canEdit) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { speakerId } = body;

  if (!speakerId) {
    return NextResponse.json({ error: "speakerId is required" }, { status: 400 });
  }

  const existing = await prisma.eventSpeaker.findUnique({
    where: { eventId_speakerId: { eventId, speakerId } },
  });

  if (existing) {
    return NextResponse.json({ error: "Speaker already linked to this event" }, { status: 409 });
  }

  const link = await prisma.eventSpeaker.create({
    data: {
      eventId,
      speakerId,
    },
    include: {
      speaker: { select: { id: true, name: true, email: true, topic: true } },
    },
  });

  await logAudit({
    userId: session.user.id,
    action: "CREATE",
    entityType: "EventSpeaker",
    entityId: link.id,
    entityName: link.speaker.name,
    changes: { eventId, speakerId },
  });

  return NextResponse.json(link, { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;
  const session = await getAuthSession(req);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const canEdit = await canUserAccessEvent(session.user.id, eventId, "update");
  if (!canEdit) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const speakerId = searchParams.get("speakerId");

  if (!speakerId) {
    return NextResponse.json({ error: "speakerId query param is required" }, { status: 400 });
  }

  const link = await prisma.eventSpeaker.findUnique({
    where: { eventId_speakerId: { eventId, speakerId } },
    include: { speaker: { select: { name: true } } },
  });

  if (!link) {
    return NextResponse.json({ error: "Link not found" }, { status: 404 });
  }

  await prisma.eventSpeaker.delete({ where: { id: link.id } });

  await logAudit({
    userId: session.user.id,
    action: "DELETE",
    entityType: "EventSpeaker",
    entityId: link.id,
    entityName: link.speaker.name,
    changes: { eventId, speakerId },
  });

  return NextResponse.json({ success: true });
}
