import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthSession } from "@/lib/auth-helpers";
import { hasMinimumRole } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
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

export async function GET(req: Request) {
  const session = await getAuthSession(req);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const templates = await prisma.sOPTemplate.findMany({
    orderBy: { name: "asc" },
  });

  return NextResponse.json(templates);
}

export async function POST(req: NextRequest) {
  const session = await getAuthSession(req);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasMinimumRole(session.user.globalRole as GlobalRole, "ADMIN")) {
    return NextResponse.json({ error: "Forbidden: Admin role required" }, { status: 403 });
  }

  const body = await req.json();
  const { name, description, defaultTasks } = body;

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const tasks = validateDefaultTasks(defaultTasks ?? []);

  const template = await prisma.sOPTemplate.create({
    data: {
      name: name.trim(),
      description: typeof description === "string" ? description.trim() || null : null,
      defaultTasks: tasks,
    },
  });

  await logAudit({
    userId: session.user.id,
    action: "CREATE",
    entityType: "SOPTemplate",
    entityId: template.id,
    entityName: template.name,
    changes: { name: template.name, description: template.description, taskCount: tasks.length },
  });

  return NextResponse.json(template, { status: 201 });
}
