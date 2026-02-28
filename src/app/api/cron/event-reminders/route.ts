import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isEmailConfigured } from "@/lib/email";
import { sendEventReminderEmail } from "@/lib/emails/triggers";

const CRON_SECRET = process.env.CRON_SECRET;

/**
 * Cron job: Send email reminders for events happening within 2 days.
 * Schedule: Daily at 09:00 UTC
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

  const now = new Date();
  const twoDaysFromNow = new Date(now);
  twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);

  // Find events happening within the next 2 days
  const upcomingEvents = await prisma.event.findMany({
    where: {
      date: {
        gte: now,
        lte: twoDaysFromNow,
      },
      status: "SCHEDULED",
    },
    select: { id: true, title: true, date: true },
  });

  let emailsSent = 0;

  for (const event of upcomingEvents) {
    await sendEventReminderEmail(event.id);
    emailsSent++;
  }

  return NextResponse.json({
    eventsFound: upcomingEvents.length,
    emailsSent,
    timestamp: now.toISOString(),
  });
}
