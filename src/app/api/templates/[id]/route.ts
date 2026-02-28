import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-helpers";
import { hasMinimumRole } from "@/lib/permissions";
import { logAudit, diffChanges } from "@/lib/audit";
import type { GlobalRole } from "@/generated/prisma/enums";

type DefaultTask = {
  title: string;
  relativeDays: number;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  section: "PRE_EVENT" | "ON_DAY" | "POST_EVENT";
};

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
const SECTIONS = ["PRE_EVENT", "ON_DAY", "POST_EVENT"] as const;

function inferSection(relativeDays: number): DefaultTask["section"] {
  if (relativeDays > 0) return "PRE_EVENT";
  if (relativeDays === 0) return "ON_DAY";
  return "POST_EVENT";
}

function validateDefaultTasks(tasks: unknown): DefaultTask[] {
  if (!Array.isArray(tasks)) return [];
  return tasks
    .filter((t): t is DefaultTask => {
      if (!t || typeof t !== "object") return false;
      const obj = t as Record<string, unknown>;
      return (
        typeof obj.title === "string" &&
        obj.title.trim().length > 0 &&
        typeof obj.relativeDays === "number" &&
        PRIORITIES.includes(obj.priority as (typeof PRIORITIES)[number])
      );
    })
    .map((t) => {
      const obj = t as Record<string, unknown>;
      const section = SECTIONS.includes(obj.section as (typeof SECTIONS)[number])
        ? (obj.section as DefaultTask["section"])
        : inferSection((t as DefaultTask).relativeDays);
      return {
        title: (t as DefaultTask).title.trim(),
        relativeDays: (t as DefaultTask).relativeDays,
        priority: (t as DefaultTask).priority,
        section,
      };
    });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getAuthSession(req);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const template = await prisma.sOPTemplate.findUnique({
    where: { id },
  });

  if (!template) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(template);
}

export async function PATCH(
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

  const before = await prisma.sOPTemplate.findUnique({ where: { id } });
  if (!before) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json();
  const { name, description, defaultTasks } = body;

  const updateData: { name?: string; description?: string | null; defaultTasks?: DefaultTask[] } =
    {};

  if (name !== undefined) {
    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
    }
    updateData.name = name.trim();
  }

  if (description !== undefined) {
    updateData.description =
      typeof description === "string" ? description.trim() || null : null;
  }

  if (defaultTasks !== undefined) {
    updateData.defaultTasks = validateDefaultTasks(defaultTasks);
  }

  const template = await prisma.sOPTemplate.update({
    where: { id },
    data: updateData,
  });

  const changes = diffChanges(
    {
      name: before.name,
      description: before.description,
      defaultTasks: before.defaultTasks,
    },
    {
      name: template.name,
      description: template.description,
      defaultTasks: template.defaultTasks,
    }
  );

  if (Object.keys(changes).length > 0) {
    await logAudit({
      userId: session.user.id,
      action: "UPDATE",
      entityType: "SOPTemplate",
      entityId: id,
      entityName: template.name,
      changes,
    });
  }

  return NextResponse.json(template);
}

export async function DELETE(
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

  const template = await prisma.sOPTemplate.findUnique({ where: { id } });
  if (!template) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.sOPTemplate.delete({ where: { id } });

  await logAudit({
    userId: session.user.id,
    action: "DELETE",
    entityType: "SOPTemplate",
    entityId: id,
    entityName: template.name,
    changes: { name: template.name },
  });

  return NextResponse.json({ success: true });
}
