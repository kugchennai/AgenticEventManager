import { auth } from "./auth";
import { redirect } from "next/navigation";
import type { GlobalRole } from "@/generated/prisma/enums";
import { hasMinimumRole } from "./permissions";
import { getToken } from "next-auth/jwt";
import { prisma } from "./prisma";
import type { NextRequest } from "next/server";

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

/**
 * Get authenticated session from either cookie or Bearer token
 * Supports both web (cookie) and mobile (Bearer token) authentication
 * Use this in API routes instead of auth() directly
 */
export async function getAuthSession(req?: Request | NextRequest) {
  // Try cookie-based auth first (web clients)
  const session = await auth();
  if (session?.user) {
    return session;
  }

  // If no cookie session and request provided, try Bearer token (mobile clients)
  if (req) {
    return await getSessionFromBearer(req);
  }

  return null;
}

/**
 * Extract Bearer token from Authorization header or cookie
 * Validates JWT signature and expiration
 */
export async function getTokenFromRequest(req: NextRequest | Request) {
  // Try Authorization header first
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    try {
      const decoded = await getToken({
        token,
        secret: process.env.AUTH_SECRET!,
      });
      return decoded;
    } catch {
      return null;
    }
  }

  // Fallback to cookie-based token
  try {
    const token = await getToken({
      req: req as any,
      secret: process.env.AUTH_SECRET!,
    });
    return token;
  } catch {
    return null;
  }
}

/**
 * Get session from Bearer token or cookie
 * Returns session object compatible with NextAuth session
 */
export async function getSessionFromBearer(req: NextRequest | Request) {
  const token = await getTokenFromRequest(req);
  if (!token?.id) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: token.id as string },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        globalRole: true,
      },
    });

    if (!user) return null;

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        globalRole: user.globalRole,
      },
      expires: new Date((token.exp || 0) * 1000).toISOString(),
    };
  } catch {
    return null;
  }
}
