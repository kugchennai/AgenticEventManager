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

  const volunteers = await prisma.volunteer.findMany({
    include: {
      _count: {
        select: { events: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(
    volunteers.map((v) => ({
      ...v,
      eventsCount: v._count.events,
      _count: undefined,
    }))
  );
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
  const { name, email, discordId, role } = body;

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json(
      { error: "Name is required" },
      { status: 400 }
    );
  }

  const volunteer = await prisma.volunteer.create({
    data: {
      name: name.trim(),
      email: email?.trim() || null,
      discordId: discordId?.trim() || null,
      role: role?.trim() || null,
    },
  });

  await logAudit({
    userId: session.user.id,
    action: "CREATE",
    entityType: "Volunteer",
    entityId: volunteer.id,
    entityName: volunteer.name,
    changes: { name: volunteer.name, email: volunteer.email, discordId: volunteer.discordId, role: volunteer.role },
  });

  return NextResponse.json(volunteer, { status: 201 });
}
