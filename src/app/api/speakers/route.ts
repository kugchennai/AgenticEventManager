import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hasMinimumRole } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import type { GlobalRole } from "@/generated/prisma/enums";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const speakers = await prisma.speaker.findMany({
    include: {
      _count: { select: { events: true } },
      events: {
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
      eventCount: speaker._count.events,
      statusCounts,
    };
  });

  return NextResponse.json(speakersWithStatusCounts);
}

export async function POST(req: NextRequest) {
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
    changes: { name: speaker.name, email: speaker.email, topic: speaker.topic },
  });

  return NextResponse.json(speaker, { status: 201 });
}
