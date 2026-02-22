import { prisma } from "./prisma";
import type { GlobalRole, EventRole } from "@/generated/prisma/enums";

type Action = "create" | "read" | "update" | "delete" | "manage";

const ROLE_HIERARCHY: Record<string, number> = {
  VIEWER: 0,
  VOLUNTEER: 1,
  EVENT_LEAD: 2,
  ADMIN: 3,
  SUPER_ADMIN: 4,
};

const EVENT_ROLE_HIERARCHY: Record<string, number> = {
  VIEWER: 0,
  VOLUNTEER: 1,
  ORGANIZER: 2,
  LEAD: 3,
};

export function hasMinimumRole(userRole: GlobalRole, requiredRole: GlobalRole): boolean {
  return (ROLE_HIERARCHY[userRole] ?? 0) >= (ROLE_HIERARCHY[requiredRole] ?? 0);
}

export function hasMinimumEventRole(userRole: EventRole, requiredRole: EventRole): boolean {
  return (EVENT_ROLE_HIERARCHY[userRole] ?? 0) >= (EVENT_ROLE_HIERARCHY[requiredRole] ?? 0);
}

export async function canUserAccessEvent(
  userId: string,
  eventId: string,
  action: Action
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { globalRole: true },
  });

  if (!user) return false;
  if (user.globalRole === "SUPER_ADMIN" || user.globalRole === "ADMIN") return true;
  if (action === "read" && hasMinimumRole(user.globalRole, "VIEWER")) return true;

  const membership = await prisma.eventMember.findUnique({
    where: { eventId_userId: { eventId, userId } },
    select: { eventRole: true },
  });

  if (!membership) {
    return action === "read";
  }

  switch (action) {
    case "read":
      return true;
    case "create":
    case "update":
      return hasMinimumEventRole(membership.eventRole, "ORGANIZER");
    case "delete":
    case "manage":
      return hasMinimumEventRole(membership.eventRole, "LEAD");
    default:
      return false;
  }
}

export async function getUserEventRole(
  userId: string,
  eventId: string
): Promise<EventRole | null> {
  const membership = await prisma.eventMember.findUnique({
    where: { eventId_userId: { eventId, userId } },
    select: { eventRole: true },
  });
  return membership?.eventRole ?? null;
}
