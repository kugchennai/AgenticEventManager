/**
 * Core email service using Nodemailer with Gmail SMTP.
 * All functions skip silently if SMTP is not configured (graceful degradation).
 */
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { prisma } from "./prisma";
import { render } from "@react-email/components";
import type { ReactElement } from "react";

// ─── Configuration ────────────────────────────────────────────────

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT ?? "587", 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM ?? SMTP_USER;

let cachedTransporter: Transporter | null = null;

/**
 * Check if SMTP is configured via environment variables.
 */
export function isEmailConfigured(): boolean {
  return !!(SMTP_HOST && SMTP_USER && SMTP_PASS);
}

/**
 * Get or create a reusable SMTP transporter.
 * Returns null if SMTP is not configured.
 */
function getTransporter(): Transporter | null {
  if (!isEmailConfigured()) return null;

  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
  }

  return cachedTransporter;
}

// ─── Types ────────────────────────────────────────────────────────

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  template: string;
  fromName?: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
    /** Content-ID for inline/embedded images (used with cid: references in HTML) */
    cid?: string;
  }>;
  cc?: string | string[];
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ─── Core Send Function ───────────────────────────────────────────

/**
 * Send an email and log it to the EmailLog table.
 * Fire-and-forget: catches all errors and logs them.
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const transporter = getTransporter();
  const recipients = Array.isArray(options.to) ? options.to.join(", ") : options.to;

  if (!transporter) {
    console.warn("[Email] SMTP not configured — skipping email to:", recipients);
    return { success: false, error: "SMTP not configured" };
  }

  // Create pending log entry
  let logId: string | undefined;
  try {
    const log = await prisma.emailLog.create({
      data: {
        to: recipients,
        subject: options.subject,
        template: options.template,
        status: "PENDING",
      },
    });
    logId = log.id;
  } catch (err) {
    console.error("[Email] Failed to create email log:", err);
  }

  // Build the from address using stored meetup name if provided
  const fromAddress = options.fromName && SMTP_USER
    ? `${options.fromName} <${SMTP_USER}>`
    : SMTP_FROM;

  try {
    const info = await transporter.sendMail({
      from: fromAddress,
      to: options.to,
      cc: options.cc,
      subject: options.subject,
      html: options.html,
      text: options.text,
      attachments: options.attachments,
    });

    // Update log to SENT
    if (logId) {
      await prisma.emailLog.update({
        where: { id: logId },
        data: { status: "SENT", sentAt: new Date() },
      }).catch((e: unknown) => console.error("[Email] Failed to update log:", e));
    }

    return { success: true, messageId: info.messageId };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("[Email] Send failed:", errorMessage);

    // Update log to FAILED
    if (logId) {
      await prisma.emailLog.update({
        where: { id: logId },
        data: { status: "FAILED", error: errorMessage },
      }).catch((e: unknown) => console.error("[Email] Failed to update log:", e));
    }

    return { success: false, error: errorMessage };
  }
}

// ─── React Email Renderer ─────────────────────────────────────────

/**
 * Render a React Email component and send it.
 * This is the main function all email workflows should use.
 */
export async function renderAndSend(
  to: string | string[],
  subject: string,
  template: string,
  component: ReactElement,
  options?: {
    attachments?: SendEmailOptions["attachments"];
    cc?: string | string[];
    fromName?: string;
    /** Raw base64 data URI of a logo to embed as a CID attachment */
    logoBase64?: string;
    /** CID identifier (without "cid:" prefix) for the logo attachment */
    logoCid?: string;
  }
): Promise<SendEmailResult> {
  if (!isEmailConfigured()) {
    return { success: false, error: "SMTP not configured" };
  }

  try {
    const html = await render(component);
    const text = await render(component, { plainText: true });

    // Build attachments list, auto-embedding logo as CID if provided
    const allAttachments: SendEmailOptions["attachments"] = [
      ...(options?.attachments ?? []),
    ];

    if (options?.logoBase64 && options?.logoCid) {
      const match = options.logoBase64.match(/^data:(image\/[a-z+]+);base64,(.+)$/i);
      if (match) {
        allAttachments.push({
          filename: `logo.${match[1].split("/")[1].replace("+xml", "")}`,
          content: Buffer.from(match[2], "base64"),
          contentType: match[1],
          cid: options.logoCid,
        });
      }
    }

    return sendEmail({
      to,
      subject,
      html,
      text,
      template,
      fromName: options?.fromName,
      attachments: allAttachments.length > 0 ? allAttachments : undefined,
      cc: options?.cc,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("[Email] Render failed:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Verify the SMTP connection is working.
 */
export async function verifyConnection(): Promise<{ success: boolean; error?: string }> {
  const transporter = getTransporter();
  if (!transporter) {
    return { success: false, error: "SMTP not configured" };
  }

  try {
    await transporter.verify();
    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return { success: false, error: errorMessage };
  }
}
