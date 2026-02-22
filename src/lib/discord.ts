/**
 * Discord bot helper functions using raw fetch.
 * All functions skip silently if no bot token is available.
 */

const DISCORD_API = "https://discord.com/api/v10";

export interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface DiscordEmbed {
  title: string;
  description?: string;
  color?: number;
  fields?: DiscordEmbedField[];
  timestamp?: string;
}

function getBotToken(customToken?: string | null): string | null {
  const token = customToken ?? process.env.DISCORD_BOT_TOKEN;
  return token && token.trim().length > 0 ? token : null;
}

async function sendRequest(
  channelId: string,
  body: object,
  token: string | null
): Promise<boolean> {
  if (!token) return false;
  try {
    const res = await fetch(`${DISCORD_API}/channels/${channelId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bot ${token}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("[Discord] API error:", res.status, err);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[Discord] Request failed:", err);
    return false;
  }
}

/**
 * Post a plain text message to a Discord channel.
 */
export async function sendDiscordMessage(
  channelId: string,
  content: string,
  botToken?: string | null
): Promise<boolean> {
  const token = getBotToken(botToken);
  if (!token) return false;
  return sendRequest(channelId, { content }, token);
}

/**
 * Send a rich embed to a Discord channel.
 */
export async function sendDiscordEmbed(
  channelId: string,
  embed: DiscordEmbed,
  botToken?: string | null
): Promise<boolean> {
  const token = getBotToken(botToken);
  if (!token) return false;
  const payload: Record<string, unknown> = {
    title: embed.title,
  };
  if (embed.description) payload.description = embed.description;
  if (embed.color != null) payload.color = embed.color;
  if (embed.fields?.length) payload.fields = embed.fields;
  if (embed.timestamp) payload.timestamp = embed.timestamp;
  return sendRequest(channelId, { embeds: [payload] }, token);
}

/**
 * Notify when a task is assigned.
 */
export async function notifyTaskAssigned(
  task: { title: string; deadline?: Date | string | null; assigneeName: string; eventTitle: string },
  channelId: string,
  botToken?: string | null
): Promise<boolean> {
  const token = getBotToken(botToken);
  if (!token) return false;
  const deadlineStr = task.deadline
    ? new Date(task.deadline).toLocaleDateString(undefined, {
        dateStyle: "medium",
      })
    : "No deadline";
  return sendDiscordEmbed(
    channelId,
    {
      title: "Task Assigned",
      description: `You've been assigned a new task for **${task.eventTitle}**.`,
      color: 0x5865f2,
      fields: [
        { name: "Task", value: task.title, inline: false },
        { name: "Deadline", value: deadlineStr, inline: true },
      ],
      timestamp: new Date().toISOString(),
    },
    token
  );
}

/**
 * Notify about tasks approaching their deadline.
 */
export async function notifyDeadlineApproaching(
  tasks: { title: string; deadline: Date | string; ownerName: string; eventTitle: string }[],
  channelId: string,
  botToken?: string | null
): Promise<boolean> {
  const token = getBotToken(botToken);
  if (!token) return false;
  if (tasks.length === 0) return true;
  const fields: DiscordEmbedField[] = tasks.slice(0, 10).map((t) => ({
    name: t.title,
    value: `Event: ${t.eventTitle}\nOwner: ${t.ownerName}\nDeadline: ${new Date(t.deadline).toLocaleDateString(undefined, { dateStyle: "medium" })}`,
    inline: false,
  }));
  if (tasks.length > 10) {
    fields.push({
      name: "...",
      value: `${tasks.length - 10} more task(s)`,
      inline: false,
    });
  }
  return sendDiscordEmbed(
    channelId,
    {
      title: "⏰ Deadlines Approaching",
      description: `**${tasks.length}** task(s) have deadlines within the next 3 days.`,
      color: 0xfee75c,
      fields,
      timestamp: new Date().toISOString(),
    },
    token
  );
}

/**
 * Notify when tasks are overdue.
 */
export async function notifyOverdueTasks(
  tasks: { title: string; deadline: Date | string; ownerName: string; eventTitle: string }[],
  channelId: string,
  botToken?: string | null
): Promise<boolean> {
  const token = getBotToken(botToken);
  if (!token) return false;
  if (tasks.length === 0) return true;
  const fields: DiscordEmbedField[] = tasks.slice(0, 10).map((t) => ({
    name: t.title,
    value: `Event: ${t.eventTitle}\nOwner: ${t.ownerName}\nOverdue since: ${new Date(t.deadline).toLocaleDateString(undefined, { dateStyle: "medium" })}`,
    inline: false,
  }));
  if (tasks.length > 10) {
    fields.push({
      name: "...",
      value: `${tasks.length - 10} more overdue task(s)`,
      inline: false,
    });
  }
  return sendDiscordEmbed(
    channelId,
    {
      title: "🚨 Overdue Tasks",
      description: `**${tasks.length}** task(s) are past their deadline.`,
      color: 0xed4245,
      fields,
      timestamp: new Date().toISOString(),
    },
    token
  );
}

/**
 * Notify when an event is created.
 */
export async function notifyEventCreated(
  event: { title: string; date: Date | string; venue?: string | null },
  channelId: string,
  botToken?: string | null
): Promise<boolean> {
  const token = getBotToken(botToken);
  if (!token) return false;
  const fields: DiscordEmbedField[] = [
    { name: "Date", value: new Date(event.date).toLocaleDateString(undefined, { dateStyle: "full" }), inline: true },
  ];
  if (event.venue) {
    fields.push({ name: "Venue", value: event.venue, inline: true });
  }
  return sendDiscordEmbed(
    channelId,
    {
      title: "🎉 New Event Created",
      description: event.title,
      color: 0x57f287,
      fields,
      timestamp: new Date().toISOString(),
    },
    token
  );
}
