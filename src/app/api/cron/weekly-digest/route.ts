import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isEmailConfigured } from "@/lib/email";
import { sendWeeklyDigestEmail } from "@/lib/emails/triggers";

const CRON_SECRET = process.env.CRON_SECRET;

/**
 * Cron job: Send weekly digest emails to all active members.
 * Schedule: Every Monday at 09:00 UTC
 */
export async function GET(req: NextRequest) {
  if (!CRON_SECRET) {
    console.error("CRON_SECRET environment variable is not set");
    return NextResponse.json(
      { error: "Server misconfiguration" },
      { status: 500 }
    );
  }

  const authHeader = req.headers.get("authorization");
  const secret =
    authHeader?.replace(/^Bearer\s+/i, "") ??
    req.nextUrl.searchParams.get("secret");

  if (secret !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isEmailConfigured()) {
    return NextResponse.json({
      skipped: true,
      reason: "SMTP not configured",
    });
  }

  // Get all active (non-deleted) users with at least VOLUNTEER role
  const users = await prisma.user.findMany({
    where: {
      globalRole: { not: "VIEWER" },
      email: { not: null },
    },
    select: { id: true },
  });

  let emailsSent = 0;
  const batchSize = 10;

  // Process users in batches to avoid timeout
  for (let i = 0; i < users.length; i += batchSize) {
    const batch = users.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (user) => {
        await sendWeeklyDigestEmail(user.id);
        emailsSent++;
      })
    );
  }

  return NextResponse.json({
    usersProcessed: users.length,
    emailsSent,
    timestamp: new Date().toISOString(),
  });
}
