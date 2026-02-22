import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hasMinimumRole } from "@/lib/permissions";
import { logAudit, diffChanges } from "@/lib/audit";
import type { GlobalRole } from "@/generated/prisma/enums";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const speaker = await prisma.speaker.findUnique({
    where: { id },
    include: {
      events: {
        include: {
          event: { select: { id: true, title: true, date: true, status: true } },
        },
      },
      _count: { select: { events: true } },
    },
  });

  if (!speaker) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(speaker);
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

  if (!hasMinimumRole(session.user.globalRole as GlobalRole, "EVENT_LEAD")) {
    return NextResponse.json(
      { error: "Forbidden: Event Lead role required" },
      { status: 403 }
    );
  }

  const body = await req.json();
  const { name, email, bio, topic, photoUrl } = body;

  const before = await prisma.speaker.findUnique({ where: { id } });
  if (!before) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const speaker = await prisma.speaker.update({
    where: { id },
    data: {
      ...(name !== undefined && { name: name?.trim() ?? before.name }),
      ...(email !== undefined && { email: email?.trim() || null }),
      ...(bio !== undefined && { bio: bio?.trim() || null }),
      ...(topic !== undefined && { topic: topic?.trim() || null }),
      ...(photoUrl !== undefined && { photoUrl: photoUrl?.trim() || null }),
    },
    include: {
      events: true,
      _count: { select: { events: true } },
    },
  });

  const changes = diffChanges(
    {
      name: before.name,
      email: before.email,
      bio: before.bio,
      topic: before.topic,
      photoUrl: before.photoUrl,
    },
    {
      name: speaker.name,
      email: speaker.email,
      bio: speaker.bio,
      topic: speaker.topic,
      photoUrl: speaker.photoUrl,
    }
  );

  if (Object.keys(changes).length > 0) {
    await logAudit({
      userId: session.user.id,
      action: "UPDATE",
      entityType: "Speaker",
      entityId: id,
      entityName: speaker.name,
      changes,
    });
  }

  return NextResponse.json(speaker);
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

  if (!hasMinimumRole(session.user.globalRole as GlobalRole, "EVENT_LEAD")) {
    return NextResponse.json(
      { error: "Forbidden: Event Lead role required" },
      { status: 403 }
    );
  }

  const speaker = await prisma.speaker.findUnique({ where: { id } });
  if (!speaker) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.speaker.delete({ where: { id } });

  await logAudit({
    userId: session.user.id,
    action: "DELETE",
    entityType: "Speaker",
    entityId: id,
    entityName: speaker.name,
    changes: { name: speaker.name },
  });

  return NextResponse.json({ success: true });
}
