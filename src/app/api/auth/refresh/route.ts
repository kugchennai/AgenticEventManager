import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

/**
 * Token refresh endpoint
 * 
 * POST /api/auth/refresh
 * Body: { refreshToken: string }
 * 
 * Returns: { accessToken: string, refreshToken: string, user: {...} }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return NextResponse.json(
        { error: "Refresh token is required" },
        { status: 400 }
      );
    }

    // Find and validate refresh token
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            globalRole: true,
            deletedAt: true,
          },
        },
      },
    });

    if (!tokenRecord) {
      return NextResponse.json(
        { error: "Invalid refresh token" },
        { status: 401 }
      );
    }

    // Block soft-deleted users from refreshing tokens
    if (tokenRecord.user.deletedAt) {
      await prisma.refreshToken.delete({ where: { id: tokenRecord.id } });
      return NextResponse.json(
        { error: "This account has been deactivated." },
        { status: 401 }
      );
    }

    // Check if token is expired
    if (tokenRecord.expiresAt < new Date()) {
      // Delete expired token
      await prisma.refreshToken.delete({
        where: { id: tokenRecord.id },
      });

      return NextResponse.json(
        { error: "Refresh token expired" },
        { status: 401 }
      );
    }

    // Generate new access token
    const secret = new TextEncoder().encode(process.env.AUTH_SECRET!);
    const accessToken = await new SignJWT({
      id: tokenRecord.user.id,
      email: tokenRecord.user.email,
      globalRole: tokenRecord.user.globalRole,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d") // 7 days
      .sign(secret);

    // Rotate refresh token for security
    const newRefreshToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    // Delete old refresh token and create new one
    await prisma.$transaction([
      prisma.refreshToken.delete({
        where: { id: tokenRecord.id },
      }),
      prisma.refreshToken.create({
        data: {
          token: newRefreshToken,
          userId: tokenRecord.user.id,
          expiresAt,
        },
      }),
    ]);

    return NextResponse.json({
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: 7 * 24 * 60 * 60, // 7 days in seconds
      user: {
        id: tokenRecord.user.id,
        name: tokenRecord.user.name,
        email: tokenRecord.user.email,
        image: tokenRecord.user.image,
        globalRole: tokenRecord.user.globalRole,
      },
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    return NextResponse.json(
      { error: "Failed to refresh token" },
      { status: 500 }
    );
  }
}
