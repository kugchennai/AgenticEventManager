import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL?.toLowerCase();

/**
 * Mobile authentication endpoint
 * 
 * POST /api/auth/token
 * Body: { email: string, name?: string, image?: string, googleId?: string }
 * 
 * Returns: { accessToken: string, refreshToken: string, user: {...} }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, name, image, googleId } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase();
    const isSuperAdmin = normalizedEmail === SUPER_ADMIN_EMAIL;

    // Check if user is allowed to sign in
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, globalRole: true },
    });

    // Check for unlinked volunteer
    const unlinkedVolunteer = await prisma.volunteer.findFirst({
      where: { email: normalizedEmail, userId: null },
      select: { id: true },
    });

    // Only allow sign in if user exists, is super admin, or has volunteer record
    if (!existingUser && !isSuperAdmin && !unlinkedVolunteer) {
      return NextResponse.json(
        { error: "Unauthorized. No account found." },
        { status: 401 }
      );
    }

    // Create or update user
    const user = await prisma.user.upsert({
      where: { email: normalizedEmail },
      update: {
        name: name ?? undefined,
        image: image ?? undefined,
        ...(isSuperAdmin ? { globalRole: "SUPER_ADMIN" } : {}),
      },
      create: {
        email: normalizedEmail,
        name: name ?? normalizedEmail,
        image: image ?? undefined,
        globalRole: isSuperAdmin
          ? "SUPER_ADMIN"
          : unlinkedVolunteer
          ? "VOLUNTEER"
          : "VIEWER",
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        globalRole: true,
      },
    });

    // Link volunteer profile if unlinked
    if (unlinkedVolunteer) {
      await prisma.volunteer.update({
        where: { id: unlinkedVolunteer.id },
        data: { userId: user.id },
      });
    }

    // Create OAuth account record if googleId provided
    if (googleId) {
      await prisma.account.upsert({
        where: {
          provider_providerAccountId: {
            provider: "google",
            providerAccountId: googleId,
          },
        },
        update: {},
        create: {
          userId: user.id,
          type: "oauth",
          provider: "google",
          providerAccountId: googleId,
        },
      });
    }

    // Generate access token (JWT)
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET!);
    const accessToken = await new SignJWT({
      id: user.id,
      email: user.email,
      globalRole: user.globalRole,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d") // 7 days
      .sign(secret);

    // Generate refresh token
    const refreshToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      },
    });

    return NextResponse.json({
      accessToken,
      refreshToken,
      expiresIn: 7 * 24 * 60 * 60, // 7 days in seconds
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        globalRole: user.globalRole,
      },
    });
  } catch (error) {
    console.error("Token generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate token" },
      { status: 500 }
    );
  }
}
