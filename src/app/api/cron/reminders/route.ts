import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyDeadlineApproaching, notifyOverdueTasks } from "@/lib/discord";
import { isEmailConfigured } from "@/lib/email";
import { sendTaskDueSoonEmail, sendTaskOverdueEmail } from "@/lib/emails/triggers";

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(req: NextRequest) {
  // Require CRON_SECRET for security
  if (!CRON_SECRET) {
    console.error("CRON_SECRET environment variable is not set");
    return NextResponse.json(
      { error: "Server misconfiguration" },
      { status: 500 }
    );
  }

  // Validate the secret from Authorization header or query param
  const authHeader = req.headers.get("authorization");
  const secret = authHeader?.replace(/^Bearer\s+/i, "") ?? req.nextUrl.searchParams.get("secret");
  
  if (secret !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const threeDaysFromNow = new Date(now);
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

  const tasks = await prisma.sOPTask.findMany({
    where: {
      status: { not: "DONE" },
      deadline: { not: null },
    },
    include: {
      checklist: {
        include: {
          event: true,
        },
      },
      owner: { select: { name: true } },
    },
  });

  const approaching: { title: string; deadline: Date; ownerName: string; eventTitle: string }[] = [];
  const overdue: { title: string; deadline: Date; ownerName: string; eventTitle: string }[] = [];

  for (const t of tasks) {
    const deadline = t.deadline!;
    const eventTitle = t.checklist.event.title;
    const ownerName = t.owner?.name ?? "Unassigned";

    if (deadline < now) {
      overdue.push({
        title: t.title,
        deadline,
        ownerName,
        eventTitle,
      });
    } else if (deadline <= threeDaysFromNow) {
      approaching.push({
        title: t.title,
        deadline,
        ownerName,
        eventTitle,
      });
    }
  }

  const config = await prisma.discordConfig.findFirst({
    orderBy: { createdAt: "desc" },
  });

  const summary: { approachingSent: boolean; overdueSent: boolean; emailsSent: number } = {
    approachingSent: false,
    overdueSent: false,
    emailsSent: 0,
  };

  // Discord notifications
  if (config?.reminderEnabled && config.channelId) {
    const token = config.botToken ?? process.env.DISCORD_BOT_TOKEN;
    if (token?.trim()) {
      if (approaching.length > 0) {
        summary.approachingSent = await notifyDeadlineApproaching(
          approaching,
          config.channelId,
          config.botToken
        );
      }
      if (overdue.length > 0) {
        summary.overdueSent = await notifyOverdueTasks(
          overdue,
          config.channelId,
          config.botToken
        );
      }
    }
  }

  // Email notifications (fire-and-forget, per-task)
  if (isEmailConfigured()) {
    for (const t of tasks) {
      const deadline = t.deadline!;
      if (deadline < now) {
        const overdueDays = Math.ceil((now.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24));
        sendTaskOverdueEmail(t.id, overdueDays, overdueDays >= 3);
        summary.emailsSent++;
      } else if (deadline <= threeDaysFromNow) {
        const daysRemaining = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        sendTaskDueSoonEmail(t.id, daysRemaining);
        summary.emailsSent++;
      }
    }
  }

  return NextResponse.json({
    approaching: approaching.length,
    overdue: overdue.length,
    ...summary,
  });
}
