import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canUserAccessEvent } from "@/lib/permissions";
import { logAudit, diffChanges } from "@/lib/audit";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, name: true, image: true, email: true } },
      members: {
        include: {
          user: { select: { id: true, name: true, image: true, email: true } },
        },
      },
      speakers: {
        include: {
          speaker: true,
          owner: { select: { id: true, name: true, image: true } },
        },
      },
      volunteers: {
        include: {
          volunteer: true,
          owner: { select: { id: true, name: true, image: true } },
        },
      },
      checklists: {
        include: {
          tasks: {
            include: {
              owner: { select: { id: true, name: true, image: true } },
              assignee: { select: { id: true, name: true, image: true } },
              volunteerAssignee: { select: { id: true, name: true } },
            },
            orderBy: { sortOrder: "asc" },
          },
        },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!event) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(event);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const canEdit = await canUserAccessEvent(session.user.id, id, "update");
  if (!canEdit) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { title, description, date, venue, status } = body;

  const before = await prisma.event.findUnique({ where: { id } });
  if (!before) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const event = await prisma.event.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(date !== undefined && { date: new Date(date) }),
      ...(venue !== undefined && { venue }),
      ...(status !== undefined && { status }),
    },
    include: {
      createdBy: { select: { id: true, name: true, image: true } },
    },
  });

  const changes = diffChanges(
    { title: before.title, description: before.description, date: before.date, venue: before.venue, status: before.status },
    { title: event.title, description: event.description, date: event.date, venue: event.venue, status: event.status }
  );

  if (Object.keys(changes).length > 0) {
    await logAudit({
      userId: session.user.id,
      action: "UPDATE",
      entityType: "Event",
      entityId: id,
      entityName: event.title,
      changes,
    });
  }

  return NextResponse.json(event);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const canDelete = await canUserAccessEvent(session.user.id, id, "delete");
  if (!canDelete) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const eventToDelete = await prisma.event.findUnique({ where: { id }, select: { title: true } });
  await prisma.event.delete({ where: { id } });

  await logAudit({
    userId: session.user.id,
    action: "DELETE",
    entityType: "Event",
    entityId: id,
    entityName: eventToDelete?.title,
  });

  return NextResponse.json({ success: true });
}
