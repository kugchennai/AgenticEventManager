import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-helpers";
import { hasMinimumRole } from "@/lib/permissions";
import type { GlobalRole } from "@/generated/prisma/enums";

export async function GET(req: NextRequest) {
  const session = await getAuthSession(req);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasMinimumRole(session.user.globalRole as GlobalRole, "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const entityType = searchParams.get("entityType");
  const userId = searchParams.get("userId");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = 50;

  const where: Record<string, unknown> = {};
  if (entityType) where.entityType = entityType;
  if (userId) where.userId = userId;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  const missing = logs.filter((l) => !l.entityName);
  if (missing.length > 0) {
    const grouped: Record<string, string[]> = {};
    for (const l of missing) {
      (grouped[l.entityType] ??= []).push(l.entityId);
    }

    const nameMap = new Map<string, string>();

    const lookups: Promise<void>[] = [];
    if (grouped["Event"]?.length) {
      lookups.push(
        prisma.event.findMany({ where: { id: { in: grouped["Event"] } }, select: { id: true, title: true } })
          .then((rows) => rows.forEach((r) => nameMap.set(r.id, r.title)))
      );
    }
    if (grouped["Speaker"]?.length) {
      lookups.push(
        prisma.speaker.findMany({ where: { id: { in: grouped["Speaker"] } }, select: { id: true, name: true } })
          .then((rows) => rows.forEach((r) => nameMap.set(r.id, r.name)))
      );
    }
    if (grouped["Volunteer"]?.length) {
      lookups.push(
        prisma.volunteer.findMany({ where: { id: { in: grouped["Volunteer"] } }, select: { id: true, name: true } })
          .then((rows) => rows.forEach((r) => nameMap.set(r.id, r.name)))
      );
    }
    if (grouped["SOPTask"]?.length) {
      lookups.push(
        prisma.sOPTask.findMany({ where: { id: { in: grouped["SOPTask"] } }, select: { id: true, title: true } })
          .then((rows) => rows.forEach((r) => nameMap.set(r.id, r.title)))
      );
    }
    if (grouped["SOPTemplate"]?.length) {
      lookups.push(
        prisma.sOPTemplate.findMany({ where: { id: { in: grouped["SOPTemplate"] } }, select: { id: true, name: true } })
          .then((rows) => rows.forEach((r) => nameMap.set(r.id, r.name)))
      );
    }
    if (grouped["User"]?.length) {
      lookups.push(
        prisma.user.findMany({ where: { id: { in: grouped["User"] } }, select: { id: true, name: true } })
          .then((rows) => rows.forEach((r) => { if (r.name) nameMap.set(r.id, r.name); }))
      );
    }

    if (grouped["EventVolunteer"]?.length) {
      lookups.push(
        prisma.eventVolunteer.findMany({ where: { id: { in: grouped["EventVolunteer"] } }, include: { volunteer: { select: { name: true } } } })
          .then((rows) => rows.forEach((r) => nameMap.set(r.id, r.volunteer.name)))
      );
    }
    if (grouped["EventSpeaker"]?.length) {
      lookups.push(
        prisma.eventSpeaker.findMany({ where: { id: { in: grouped["EventSpeaker"] } }, include: { speaker: { select: { name: true } } } })
          .then((rows) => rows.forEach((r) => nameMap.set(r.id, r.speaker.name)))
      );
    }

    await Promise.all(lookups);

    for (const l of missing) {
      const name = nameMap.get(l.entityId);
      if (name) (l as Record<string, unknown>).entityName = name;
    }
  }

  return NextResponse.json({
    logs,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
