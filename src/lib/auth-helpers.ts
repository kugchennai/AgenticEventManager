import { auth } from "./auth";
import { redirect } from "next/navigation";
import type { GlobalRole } from "@/generated/prisma/enums";
import { hasMinimumRole } from "./permissions";

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    redirect("/");
  }
  return session;
}

export async function requireRole(minRole: GlobalRole) {
  const session = await requireAuth();
  if (!hasMinimumRole(session.user.globalRole as GlobalRole, minRole)) {
    redirect("/dashboard");
  }
  return session;
}

export async function getSession() {
  return await auth();
}
