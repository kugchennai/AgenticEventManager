/**
 * ICS calendar file generator.
 * Generates RFC 5545 compliant .ics content for event invitations.
 */

export interface ICSEventOptions {
  title: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  location?: string;
  organizer?: string;
  url?: string;
}

/**
 * Format a Date to ICS datetime format (UTC): YYYYMMDDTHHMMSSZ
 */
function formatICSDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/**
 * Escape special characters in ICS text fields.
 */
function escapeICS(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/**
 * Generate a UID for the ICS event.
 */
function generateUID(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${random}@meetup-manager`;
}

/**
 * Generate an ICS calendar file content string.
 * If no endDate is provided, defaults to 2 hours after startDate.
 */
export function generateICS(options: ICSEventOptions): string {
  const {
    title,
    description,
    startDate,
    location,
    url,
  } = options;

  const endDate = options.endDate ?? new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Meetup Manager//Event//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${generateUID()}`,
    `DTSTAMP:${formatICSDate(new Date())}`,
    `DTSTART:${formatICSDate(startDate)}`,
    `DTEND:${formatICSDate(endDate)}`,
    `SUMMARY:${escapeICS(title)}`,
  ];

  if (description) {
    lines.push(`DESCRIPTION:${escapeICS(description)}`);
  }

  if (location) {
    lines.push(`LOCATION:${escapeICS(location)}`);
  }

  if (url) {
    lines.push(`URL:${escapeICS(url)}`);
  }

  lines.push("END:VEVENT", "END:VCALENDAR");

  return lines.join("\r\n");
}
