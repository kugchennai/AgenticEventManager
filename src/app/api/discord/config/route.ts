import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { hasMinimumRole } from "@/lib/permissions";
import type { GlobalRole } from "@/generated/prisma/enums";

export async function GET() {
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

  if (!config) {
    return NextResponse.json({
      botToken: null,
      guildId: null,
      channelId: null,
      reminderEnabled: false,
    });
  }

  return NextResponse.json({
    id: config.id,
    botToken: config.botToken ? "********" : null,
    guildId: config.guildId,
    channelId: config.channelId,
    reminderEnabled: config.reminderEnabled,
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasMinimumRole(session.user.globalRole as GlobalRole, "ADMIN")) {
    return NextResponse.json({ error: "Forbidden: Admin role required" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const {
    botToken,
    guildId,
    channelId,
    reminderEnabled,
  }: {
    botToken?: string | null;
    guildId?: string | null;
    channelId?: string | null;
    reminderEnabled?: boolean;
  } = body;

  const data: {
    botToken?: string | null;
    guildId?: string | null;
    channelId?: string | null;
    reminderEnabled?: boolean;
  } = {};

  if (botToken !== undefined) {
    data.botToken = typeof botToken === "string" && botToken.trim() ? botToken.trim() : null;
  }
  if (guildId !== undefined) {
    data.guildId = typeof guildId === "string" && guildId.trim() ? guildId.trim() : null;
  }
  if (channelId !== undefined) {
    data.channelId = typeof channelId === "string" && channelId.trim() ? channelId.trim() : null;
  }
  if (reminderEnabled !== undefined) {
    data.reminderEnabled = Boolean(reminderEnabled);
  }

  const existing = await prisma.discordConfig.findFirst({
    orderBy: { createdAt: "desc" },
  });

  let config;
  if (existing) {
    config = await prisma.discordConfig.update({
      where: { id: existing.id },
      data,
    });
  } else {
    config = await prisma.discordConfig.create({
      data: {
        botToken: data.botToken ?? null,
        guildId: data.guildId ?? null,
        channelId: data.channelId ?? null,
        reminderEnabled: data.reminderEnabled ?? false,
      },
    });
  }

  return NextResponse.json({
    id: config.id,
    botToken: config.botToken ? "********" : null,
    guildId: config.guildId,
    channelId: config.channelId,
    reminderEnabled: config.reminderEnabled,
  });
}
