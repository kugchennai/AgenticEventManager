import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth-helpers";
import { isEmailConfigured, verifyConnection, renderAndSend } from "@/lib/email";
import type { GlobalRole } from "@/generated/prisma/enums";
import React from "react";
import {
  EmailLayout,
  styles,
  Text,
} from "@/lib/emails/components/layout";

function TestEmail({ email }: { email: string }) {
  return React.createElement(
    EmailLayout,
    { preview: "This is a test email from Meetup Manager" },
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

  // Parse optional target email from request body
  let targetEmail: string | undefined;
  try {
    const body = await req.json().catch(() => ({}));
    targetEmail = typeof body.email === "string" ? body.email.trim() : undefined;
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

  const result = await renderAndSend(
    recipientEmail,
    "Test Email — Meetup Manager",
    "test",
    React.createElement(TestEmail, { email: recipientEmail })
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
