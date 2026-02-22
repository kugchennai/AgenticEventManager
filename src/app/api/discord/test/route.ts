import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hasMinimumRole } from "@/lib/permissions";
import { sendDiscordMessage } from "@/lib/discord";
import type { GlobalRole } from "@/generated/prisma/enums";

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasMinimumRole(session.user.globalRole as GlobalRole, "ADMIN")) {
    return NextResponse.json({ error: "Forbidden: Admin role required" }, { status: 403 });
  }

  const config = await prisma.discordConfig.findFirst({
    orderBy: { createdAt: "desc" },
  });

  if (!config?.channelId) {
    return NextResponse.json(
      { error: "Discord channel not configured. Save a channel ID first." },
      { status: 400 }
    );
  }

  const token = config.botToken ?? process.env.DISCORD_BOT_TOKEN;
  if (!token || !token.trim()) {
    return NextResponse.json(
      { error: "No bot token configured. Add a bot token in settings or set DISCORD_BOT_TOKEN." },
      { status: 400 }
    );
  }

  const ok = await sendDiscordMessage(
    config.channelId,
    "Meetup Manager bot is connected!",
    config.botToken
  );

  if (!ok) {
    return NextResponse.json(
      { error: "Failed to send test message. Check your bot token and channel permissions." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
