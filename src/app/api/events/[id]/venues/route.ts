import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-helpers";
import { canUserAccessEvent } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";

/**
 * Checks if a task title matches "venue confirmation" pattern.
 */
function isVenueConfirmationTask(title: string): boolean {
  const lower = title.toLowerCase();
  return lower.includes("venue") && lower.includes("confirm");
}

/**
 * Resets venue confirmation SOP tasks for an event to TODO.
 */
async function resetVenueConfirmationTasks(eventId: string, userId: string, reason: string) {
  const checklists = await prisma.sOPChecklist.findMany({
    where: { eventId },
    include: { tasks: true },
  });

  for (const checklist of checklists) {
    for (const task of checklist.tasks) {
      if (isVenueConfirmationTask(task.title) && task.status === "DONE") {
        await prisma.sOPTask.update({
          where: { id: task.id },
          data: { status: "TODO", completedAt: null },
        });

        await logAudit({
          userId,
          action: "UPDATE",
          entityType: "SOPTask",
          entityId: task.id,
          entityName: task.title,
          changes: {
            status: { from: "DONE", to: "TODO" },
            reason,
          },
        });
      }
    }
  }
}

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
  const { venuePartnerId } = body;

  if (!venuePartnerId) {
    return NextResponse.json({ error: "venuePartnerId is required" }, { status: 400 });
  }

  const existing = await prisma.eventVenuePartner.findUnique({
    where: { eventId_venuePartnerId: { eventId, venuePartnerId } },
  });

  if (existing) {
    return NextResponse.json({ error: "Venue partner already linked to this event" }, { status: 409 });
  }

  const link = await prisma.eventVenuePartner.create({
    data: {
      eventId,
      venuePartnerId,
    },
    include: {
      venuePartner: { select: { id: true, name: true, email: true, address: true, capacity: true } },
    },
  });

  await logAudit({
    userId: session.user.id,
    action: "CREATE",
    entityType: "EventVenuePartner",
    entityId: link.id,
    entityName: link.venuePartner.name,
    changes: { eventId, venuePartnerId },
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
  const venuePartnerId = searchParams.get("venuePartnerId");

  if (!venuePartnerId) {
    return NextResponse.json({ error: "venuePartnerId query param is required" }, { status: 400 });
  }

  const link = await prisma.eventVenuePartner.findUnique({
    where: { eventId_venuePartnerId: { eventId, venuePartnerId } },
    include: { venuePartner: { select: { name: true } } },
  });

  if (!link) {
    return NextResponse.json({ error: "Link not found" }, { status: 404 });
  }

  const wasConfirmed = link.status === "CONFIRMED";

  await prisma.eventVenuePartner.delete({ where: { id: link.id } });

  // If the removed venue was confirmed, clear event.venue and reset SOP tasks
  if (wasConfirmed) {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (event && event.venue === link.venuePartner.name) {
      await prisma.event.update({
        where: { id: eventId },
        data: { venue: null },
      });
    }

    await resetVenueConfirmationTasks(
      eventId,
      session.user.id,
      `Venue partner "${link.venuePartner.name}" unlinked from event`
    );
  }

  await logAudit({
    userId: session.user.id,
    action: "DELETE",
    entityType: "EventVenuePartner",
    entityId: link.id,
    entityName: link.venuePartner.name,
    changes: { eventId, venuePartnerId },
  });

  return NextResponse.json({ success: true });
}

export { resetVenueConfirmationTasks, isVenueConfirmationTask };
