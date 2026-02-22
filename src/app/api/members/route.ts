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

  if (!hasMinimumRole(session.user.globalRole as GlobalRole, "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      globalRole: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasMinimumRole(session.user.globalRole as GlobalRole, "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { email, name, globalRole } = body;

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existing) {
    return NextResponse.json(
      { error: "A member with this email already exists" },
      { status: 409 }
    );
  }

  const validRoles: GlobalRole[] = ["ADMIN", "EVENT_LEAD", "VOLUNTEER", "VIEWER"];
  const role = validRoles.includes(globalRole) ? globalRole : "VIEWER";

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      name: name?.trim() || null,
      globalRole: role,
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      globalRole: true,
      createdAt: true,
    },
  });

  await logAudit({
    userId: session.user.id,
    action: "CREATE",
    entityType: "User",
    entityId: user.id,
    entityName: user.name ?? user.email ?? undefined,
    changes: { globalRole: role },
  });

  return NextResponse.json(user, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasMinimumRole(session.user.globalRole as GlobalRole, "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { userId, globalRole } = body;

  if (!userId || !globalRole) {
    return NextResponse.json({ error: "Missing userId or globalRole" }, { status: 400 });
  }

  const validRoles: GlobalRole[] = ["ADMIN", "EVENT_LEAD", "VOLUNTEER", "VIEWER"];
  if (!validRoles.includes(globalRole)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  if (userId === session.user.id && globalRole !== "ADMIN") {
    return NextResponse.json(
      { error: "You cannot change your own role" },
      { status: 400 }
    );
  }

  const before = await prisma.user.findUnique({
    where: { id: userId },
    select: { globalRole: true },
  });

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { globalRole },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      globalRole: true,
    },
  });

  await logAudit({
    userId: session.user.id,
    action: "UPDATE",
    entityType: "User",
    entityId: userId,
    entityName: updated.name ?? updated.email ?? undefined,
    changes: { globalRole: { from: before?.globalRole, to: globalRole } },
  });

  return NextResponse.json(updated);
}
