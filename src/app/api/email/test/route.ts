import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth-helpers";
import { isEmailConfigured, verifyConnection, renderAndSend } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { LOGO_CID } from "@/lib/emails/triggers";
import type { GlobalRole } from "@/generated/prisma/enums";
import React from "react";
import {
  EmailLayout,
  styles,
  Text,
} from "@/lib/emails/components/layout";

// All email templates
import { MemberInvitationEmail } from "@/lib/emails/templates/member-invitation";
import { VolunteerWelcomeEmail } from "@/lib/emails/templates/volunteer-welcome";
import { VolunteerPromotionEmail } from "@/lib/emails/templates/volunteer-promotion";
import { EventCreatedEmail } from "@/lib/emails/templates/event-created";
import { EventReminderEmail } from "@/lib/emails/templates/event-reminder";
import { TaskAssignedEmail } from "@/lib/emails/templates/task-assigned";
import { TaskDueSoonEmail } from "@/lib/emails/templates/task-due-soon";
import { TaskOverdueEmail } from "@/lib/emails/templates/task-overdue";
import { SpeakerInvitationEmail } from "@/lib/emails/templates/speaker-invitation";
import { VenueConfirmedEmail } from "@/lib/emails/templates/venue-confirmed";
import { WeeklyDigestEmail } from "@/lib/emails/templates/weekly-digest";

export const TEMPLATE_OPTIONS = [
  { value: "test", label: "Basic Test Email" },
  { value: "member-invitation", label: "Member Invitation" },
  { value: "volunteer-welcome", label: "Volunteer Welcome" },
  { value: "volunteer-promotion", label: "Volunteer Promotion" },
  { value: "event-created", label: "Event Created" },
  { value: "event-reminder", label: "Event Reminder" },
  { value: "task-assigned", label: "Task Assigned" },
  { value: "task-due-soon", label: "Task Due Soon" },
  { value: "task-overdue", label: "Task Overdue" },
  { value: "speaker-invitation", label: "Speaker Invitation" },
  { value: "venue-confirmed", label: "Venue Confirmed" },
  { value: "weekly-digest", label: "Weekly Digest" },
] as const;

export type TemplateType = (typeof TEMPLATE_OPTIONS)[number]["value"];

function TestEmail({ email, appName, logoUrl }: { email: string; appName?: string; logoUrl?: string }) {
  return React.createElement(
    EmailLayout,
    { preview: "This is a test email", appName, logoUrl },
    React.createElement(Text, { style: styles.h1 }, "Test Email ✅"),
    React.createElement(
      Text,
      { style: styles.paragraph },
      "If you're reading this, your SMTP configuration is working correctly!"
    ),
    React.createElement(
      Text,
      { style: styles.paragraph },
      `Sent to: ${email}`
    ),
    React.createElement(
      Text,
      { style: styles.paragraph },
      `Sent at: ${new Date().toISOString()}`
    ),
    React.createElement(
      "div",
      { style: styles.successBox },
      React.createElement(
        Text,
        { style: { ...styles.paragraph, margin: 0 } },
        "Your Gmail SMTP integration is properly configured. All email notifications will now be sent automatically."
      )
    )
  );
}

function buildTemplateElement(
  template: TemplateType,
  email: string,
  appName?: string,
  logoUrl?: string,
): { element: React.ReactElement; subject: string } {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const name = appName ?? "Meetup Manager";

  switch (template) {
    case "member-invitation":
      return {
        subject: `[Test] Member Invitation — ${name}`,
        element: React.createElement(MemberInvitationEmail, {
          name: "Jane Doe",
          email,
          role: "MEMBER",
          inviterName: "Admin User",
          appUrl,
          appName,
          logoUrl,
        }),
      };
    case "volunteer-welcome":
      return {
        subject: `[Test] Volunteer Welcome — ${name}`,
        element: React.createElement(VolunteerWelcomeEmail, {
          name: "Jane Doe",
          role: "VOLUNTEER",
          inviterName: "Admin User",
          appUrl,
          appName,
          logoUrl,
        }),
      };
    case "volunteer-promotion":
      return {
        subject: `[Test] Volunteer Promotion — ${name}`,
        element: React.createElement(VolunteerPromotionEmail, {
          name: "Jane Doe",
          newRole: "CORE_VOLUNTEER",
          permissions: ["Manage events", "Assign tasks", "Invite volunteers"],
          nextSteps: ["Check out your new dashboard", "Review upcoming events", "Reach out to the team"],
          appName,
          logoUrl,
        }),
      };
    case "event-created":
      return {
        subject: `[Test] Event Created — ${name}`,
        element: React.createElement(EventCreatedEmail, {
          eventTitle: "Sample Tech Meetup",
          date: new Date(Date.now() + 7 * 86400000).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
          venue: "Innovation Hub, Downtown",
          eventUrl: `${appUrl}/events/sample-123`,
          createdBy: "Admin User",
          appName,
          logoUrl,
        }),
      };
    case "event-reminder":
      return {
        subject: `[Test] Event Reminder — ${name}`,
        element: React.createElement(EventReminderEmail, {
          eventTitle: "Sample Tech Meetup",
          date: new Date(Date.now() + 2 * 86400000).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
          venue: "Innovation Hub, Downtown",
          location: "123 Main Street, Suite 400",
          eventUrl: `${appUrl}/events/sample-123`,
          daysUntil: 2,
          appName,
          logoUrl,
        }),
      };
    case "task-assigned":
      return {
        subject: `[Test] Task Assigned — ${name}`,
        element: React.createElement(TaskAssignedEmail, {
          taskTitle: "Prepare welcome slides",
          priority: "HIGH",
          deadline: new Date(Date.now() + 3 * 86400000).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
          eventName: "Sample Tech Meetup",
          taskUrl: `${appUrl}/events/sample-123`,
          assignedBy: "Admin User",
          appName,
          logoUrl,
        }),
      };
    case "task-due-soon":
      return {
        subject: `[Test] Task Due Soon — ${name}`,
        element: React.createElement(TaskDueSoonEmail, {
          taskTitle: "Prepare welcome slides",
          deadline: new Date(Date.now() + 86400000).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
          daysRemaining: 1,
          eventName: "Sample Tech Meetup",
          taskUrl: `${appUrl}/events/sample-123`,
          priority: "HIGH",
          appName,
          logoUrl,
        }),
      };
    case "task-overdue":
      return {
        subject: `[Test] Task Overdue — ${name}`,
        element: React.createElement(TaskOverdueEmail, {
          taskTitle: "Prepare welcome slides",
          deadline: new Date(Date.now() - 2 * 86400000).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
          overdueDays: 2,
          eventName: "Sample Tech Meetup",
          taskUrl: `${appUrl}/events/sample-123`,
          priority: "HIGH",
          isEscalation: false,
          appName,
          logoUrl,
        }),
      };
    case "speaker-invitation":
      return {
        subject: `[Test] Speaker Invitation — ${name}`,
        element: React.createElement(SpeakerInvitationEmail, {
          speakerName: "Dr. Jane Smith",
          eventTitle: "Sample Tech Meetup",
          topic: "The Future of AI in Web Development",
          date: new Date(Date.now() + 14 * 86400000).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
          venue: "Innovation Hub, Downtown",
          appName,
          logoUrl,
        }),
      };
    case "venue-confirmed":
      return {
        subject: `[Test] Venue Confirmed — ${name}`,
        element: React.createElement(VenueConfirmedEmail, {
          venueName: "Innovation Hub",
          address: "123 Main Street, Suite 400, Downtown",
          capacity: 150,
          confirmationDate: new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }),
          eventTitle: "Sample Tech Meetup",
          contactName: "Venue Manager",
          appName,
          logoUrl,
        }),
      };
    case "weekly-digest":
      return {
        subject: `[Test] Weekly Digest — ${name}`,
        element: React.createElement(WeeklyDigestEmail, {
          userName: "Jane Doe",
          assignedTasks: [
            { title: "Prepare welcome slides", eventTitle: "Sample Tech Meetup", priority: "HIGH", deadline: new Date(Date.now() + 3 * 86400000).toISOString(), taskUrl: `${appUrl}/events/sample-123` },
            { title: "Book catering", eventTitle: "Sample Tech Meetup", priority: "MEDIUM", deadline: new Date(Date.now() + 5 * 86400000).toISOString(), taskUrl: `${appUrl}/events/sample-123` },
          ],
          overdueTasks: [
            { title: "Send speaker confirmations", eventTitle: "Sample Tech Meetup", priority: "HIGH", deadline: new Date(Date.now() - 86400000).toISOString(), taskUrl: `${appUrl}/events/sample-123` },
          ],
          upcomingEvents: [
            { title: "Sample Tech Meetup", date: new Date(Date.now() + 7 * 86400000).toISOString(), venue: "Innovation Hub", eventUrl: `${appUrl}/events/sample-123` },
          ],
          summary: { totalTasks: 5, completedTasks: 2, totalEvents: 3, upcomingEventsCount: 1 },
          appUrl,
          appName,
          logoUrl,
        }),
      };
    case "test":
    default:
      return {
        subject: `Test Email — ${name}`,
        element: React.createElement(TestEmail, { email, appName, logoUrl }),
      };
  }
}

/**
 * POST /api/email/test
 * Send a test email to a specified email address (or the authenticated user's email).
 * Requires ADMIN or SUPER_ADMIN role.
 * Body: { email?: string } — optional target email; defaults to the caller's email.
 */
export async function POST(req: NextRequest) {
  const session = await getAuthSession(req);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = session.user.globalRole as GlobalRole;
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin or above required" }, { status: 403 });
  }

  if (!isEmailConfigured()) {
    return NextResponse.json(
      {
        error: "SMTP is not configured. Please set SMTP_HOST, SMTP_USER, SMTP_PASS in your .env file.",
        configured: false,
      },
      { status: 400 }
    );
  }

  // Verify connection first
  const verification = await verifyConnection();
  if (!verification.success) {
    return NextResponse.json(
      {
        error: `SMTP connection failed: ${verification.error}`,
        configured: true,
        connected: false,
      },
      { status: 500 }
    );
  }

  // Parse optional target email and template from request body
  let targetEmail: string | undefined;
  let template: TemplateType = "test";
  try {
    const body = await req.json().catch(() => ({}));
    targetEmail = typeof body.email === "string" ? body.email.trim() : undefined;
    if (typeof body.template === "string" && TEMPLATE_OPTIONS.some((t) => t.value === body.template)) {
      template = body.template as TemplateType;
    }
  } catch {
    // no body — use caller's email
  }

  const recipientEmail = targetEmail || session.user.email;
  if (!recipientEmail) {
    return NextResponse.json(
      { error: "No email address provided" },
      { status: 400 }
    );
  }

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(recipientEmail)) {
    return NextResponse.json(
      { error: "Invalid email address format" },
      { status: 400 }
    );
  }

  // Fetch branding
  let appName = "Meetup Manager";
  let logoUrl: string | undefined;
  let logoBase64: string | undefined;
  try {
    const settings = await prisma.appSetting.findMany({
      where: { key: { in: ["meetup_name", "logo_light"] } },
    });
    for (const s of settings) {
      if (s.key === "meetup_name" && s.value) appName = s.value;
      if (s.key === "logo_light" && s.value) {
        // Use CID reference — the image is embedded directly in the email
        logoUrl = `cid:${LOGO_CID}`;
        logoBase64 = s.value;
      }
    }
  } catch { /* use defaults */ }

  const { element, subject } = buildTemplateElement(template, recipientEmail, appName, logoUrl);

  const result = await renderAndSend(
    recipientEmail,
    subject,
    template === "test" ? "test" : `test-${template}`,
    element,
    { fromName: appName, logoBase64, logoCid: LOGO_CID }
  );

  if (result.success) {
    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      sentTo: recipientEmail,
    });
  }

  return NextResponse.json(
    {
      error: `Failed to send test email: ${result.error}`,
      configured: true,
      connected: true,
    },
    { status: 500 }
  );
}

/**
 * GET /api/email/test
 * Check SMTP configuration status.
 */
export async function GET(req: NextRequest) {
  const session = await getAuthSession(req);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const getRole = session.user.globalRole as GlobalRole;
  if (getRole !== "ADMIN" && getRole !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin or above required" }, { status: 403 });
  }

  const configured = isEmailConfigured();

  if (!configured) {
    return NextResponse.json({
      configured: false,
      connected: false,
      smtpHost: null,
      smtpUser: null,
    });
  }

  const verification = await verifyConnection();

  return NextResponse.json({
    configured: true,
    connected: verification.success,
    error: verification.error,
    smtpHost: process.env.SMTP_HOST,
    smtpUser: process.env.SMTP_USER ? `${process.env.SMTP_USER.slice(0, 3)}***` : null,
  });
}
