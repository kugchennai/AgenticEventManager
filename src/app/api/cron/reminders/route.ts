import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyDeadlineApproaching, notifyOverdueTasks } from "@/lib/discord";

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(req: NextRequest) {
  if (CRON_SECRET) {
    const authHeader = req.headers.get("authorization");
    const secret = authHeader?.replace(/^Bearer\s+/i, "") ?? req.nextUrl.searchParams.get("secret");
    if (secret !== CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
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

  const summary: { approachingSent: boolean; overdueSent: boolean } = {
    approachingSent: false,
    overdueSent: false,
  };

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

  return NextResponse.json({
    approaching: approaching.length,
    overdue: overdue.length,
    ...summary,
  });
}
