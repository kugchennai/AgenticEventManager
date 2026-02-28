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
  const session = await getAuthSession(req);
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

  const callerRole = session.user.globalRole as GlobalRole;
  const assignableRoles: GlobalRole[] = ["EVENT_LEAD", "VOLUNTEER", "VIEWER"];
  if (callerRole === "SUPER_ADMIN") assignableRoles.unshift("ADMIN");
  const role = assignableRoles.includes(globalRole) ? globalRole : "VIEWER";

  if (globalRole === "ADMIN" && callerRole !== "SUPER_ADMIN") {
    return NextResponse.json(
      { error: "Only Super Admin can assign the Admin role" },
      { status: 403 }
    );
  }

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
  const session = await getAuthSession(req);
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

  const assignableRoles: GlobalRole[] = ["EVENT_LEAD", "VOLUNTEER", "VIEWER"];
  const patchCallerRole = session.user.globalRole as GlobalRole;
  if (patchCallerRole === "SUPER_ADMIN") assignableRoles.unshift("ADMIN");

  if (!assignableRoles.includes(globalRole)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  if (globalRole === "ADMIN" && patchCallerRole !== "SUPER_ADMIN") {
    return NextResponse.json(
      { error: "Only Super Admin can assign the Admin role" },
      { status: 403 }
    );
  }

  const before = await prisma.user.findUnique({
    where: { id: userId },
    select: { globalRole: true },
  });

  if (before?.globalRole === "SUPER_ADMIN") {
    return NextResponse.json(
      { error: "Cannot change the Super Admin's role" },
      { status: 403 }
    );
  }

  if (userId === session.user.id) {
    return NextResponse.json(
      { error: "You cannot change your own role" },
      { status: 400 }
    );
  }

  const callerRole = session.user.globalRole as GlobalRole;
  if (callerRole === "ADMIN" && before?.globalRole === "ADMIN") {
    return NextResponse.json(
      { error: "Only a Super Admin can change another Admin's role" },
      { status: 403 }
    );
  }

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
