import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-helpers";
import { hasMinimumRole } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import type { GlobalRole } from "@/generated/prisma/enums";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getAuthSession(req);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasMinimumRole(session.user.globalRole as GlobalRole, "ADMIN")) {
    return NextResponse.json({ error: "Forbidden: Admin role required" }, { status: 403 });
  }

  const volunteer = await prisma.volunteer.findUnique({ where: { id } });
  if (!volunteer) {
    return NextResponse.json({ error: "Volunteer not found" }, { status: 404 });
  }

  if (volunteer.userId) {
    return NextResponse.json(
      { error: "This volunteer is already linked to a member account" },
      { status: 409 }
    );
  }

  if (!volunteer.email) {
    return NextResponse.json(
      { error: "Volunteer must have an email address to be converted to a member" },
      { status: 400 }
    );
  }

  const normalizedEmail = volunteer.email.trim().toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    await prisma.volunteer.update({
      where: { id },
      data: { userId: existingUser.id },
    });

    await logAudit({
      userId: session.user.id,
      action: "UPDATE",
      entityType: "Volunteer",
      entityId: id,
      entityName: volunteer.name,
      changes: { action: "linked_to_existing_member", memberEmail: normalizedEmail },
    });

    return NextResponse.json({
      user: existingUser,
      linked: true,
      message: "Volunteer linked to existing member account",
    });
  }

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      name: volunteer.name,
      globalRole: "VOLUNTEER",
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      globalRole: true,
    },
  });

  await prisma.volunteer.update({
    where: { id },
    data: { userId: user.id },
  });

  await logAudit({
    userId: session.user.id,
    action: "CREATE",
    entityType: "User",
    entityId: user.id,
    entityName: user.name ?? user.email ?? undefined,
    changes: { convertedFromVolunteer: volunteer.name, globalRole: "VOLUNTEER" },
  });

  return NextResponse.json({
    user,
    linked: false,
    message: "Volunteer converted to member",
  }, { status: 201 });
}
