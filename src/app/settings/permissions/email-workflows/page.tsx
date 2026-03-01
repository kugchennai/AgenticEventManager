"use client";

import { PageHeader } from "@/components/design-system";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  UserPlus,
  Hand,
  TrendingUp,
  CalendarPlus,
  Bell,
  ClipboardCheck,
  Clock,
  AlertTriangle,
  Mic2,
  Building2,
  BarChart3,
  Users,
  Shield,
  Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Workflow definitions ──────────────────────────────────────────

interface Workflow {
  id: number;
  name: string;
  template: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  trigger: string;
  firedFrom: string;
  recipients: string;
  subject: string;
  description: string;
  conditions?: string[];
}

const WORKFLOWS: Workflow[] = [
  {
    id: 1,
    name: "Member Invitation",
    template: "member-invitation",
    icon: UserPlus,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
    trigger: "Admin adds a new member (or reactivates a soft-deleted one)",
    firedFrom: "POST /api/members",
    recipients: "The invited member's email",
    subject: "You've been invited to {appName}",
    description:
      "Welcome message with assigned role and link to sign in. Also sent when a previously removed member is reactivated.",
    conditions: [
      "Sent on both new member creation and soft-delete reactivation",
    ],
  },
  {
    id: 2,
    name: "Volunteer Welcome",
    template: "volunteer-welcome",
    icon: Hand,
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
    trigger: "A new volunteer is added with an email address",
    firedFrom: "POST /api/volunteers",
    recipients: "The volunteer's email",
    subject: "Welcome to the team, {name}!",
    description:
      "Welcome message with assigned role, what to expect, and a link to the app.",
    conditions: [
      "Only sent if the volunteer has an email address",
      "Skipped if SMTP is not configured",
    ],
  },
  {
    id: 3,
    name: "Volunteer Promotion",
    template: "volunteer-promotion",
    icon: TrendingUp,
    color: "text-violet-400",
    bg: "bg-violet-400/10",
    trigger: "A volunteer is promoted to Member (Event Lead role)",
    firedFrom: "POST /api/volunteers/[id]/convert",
    recipients: "The promoted volunteer's email",
    subject: "Congratulations! You've been promoted to Member",
    description:
      "New role details, new permissions list, and next steps after promotion.",
    conditions: [
      "Sent when an existing user is reactivated as member",
      "Sent when a new user is created from a volunteer record",
    ],
  },
  {
    id: 4,
    name: "Event Created / Scheduled",
    template: "event-created",
    icon: CalendarPlus,
    color: "text-accent",
    bg: "bg-accent/10",
    trigger:
      "Event is created, or an existing event status is changed to SCHEDULED",
    firedFrom: "POST /api/events, PATCH /api/events/[id]",
    recipients: "All Members, Admins, Super Admins + event members",
    subject: "New event: {title}",
    description:
      "Event title, date, venue, created by, and a direct link to the event page. Sent to all team members with Member role or above, plus any additional event members.",
    conditions: [
      "Recipients include all active users with EVENT_LEAD, ADMIN, or SUPER_ADMIN role",
      "Event members (if any additional) are also included",
      "Deduplicated — each email address only receives one copy",
    ],
  },
  {
    id: 5,
    name: "Event Reminder",
    template: "event-reminder",
    icon: Bell,
    color: "text-orange-400",
    bg: "bg-orange-400/10",
    trigger: "Scheduled events within the next 2 days (daily cron)",
    firedFrom: "GET /api/cron/event-reminders",
    recipients: "Event team members + confirmed speakers",
    subject: "Reminder: {title} is in {n} day(s)",
    description:
      "Countdown, event details, and a link to the event page. Includes a downloadable .ics calendar file for Google Calendar, Outlook, and Apple Calendar.",
    conditions: [
      "Runs daily at 09:00 UTC via Vercel Cron",
      "Only for events with status SCHEDULED",
      "Includes ICS calendar attachment",
    ],
  },
  {
    id: 6,
    name: "Task Assigned",
    template: "task-assigned",
    icon: ClipboardCheck,
    color: "text-cyan-400",
    bg: "bg-cyan-400/10",
    trigger: "A task's assignee or volunteer assignee is changed",
    firedFrom: "PATCH /api/checklists/[id]/tasks/[taskId]",
    recipients: "The newly assigned user or volunteer",
    subject: "Task assigned: {title}",
    description:
      "Task title, priority badge, deadline, event name, who assigned it, and a link to the event.",
    conditions: [
      "Sent when either assigneeId or volunteerAssigneeId changes",
      "Skipped if the assignee has no email",
    ],
  },
  {
    id: 7,
    name: "Task Due Soon",
    template: "task-due-soon",
    icon: Clock,
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
    trigger: "Task deadline is within the next 3 days (daily cron)",
    firedFrom: "GET /api/cron/reminders",
    recipients: "The assigned user or volunteer",
    subject: "Task due soon: {title}",
    description:
      "Urgency indicator, task details, deadline countdown, and a link to the event.",
    conditions: [
      "Runs daily at 09:00 UTC via Vercel Cron",
      "Only for tasks that are not DONE",
    ],
  },
  {
    id: 8,
    name: "Task Overdue",
    template: "task-overdue",
    icon: AlertTriangle,
    color: "text-red-400",
    bg: "bg-red-400/10",
    trigger: "Task deadline has passed and task is not DONE (daily cron)",
    firedFrom: "GET /api/cron/reminders",
    recipients: "Assigned user or volunteer (CC: Event Lead if 3+ days overdue)",
    subject: "OVERDUE: {title}",
    description:
      "Overdue duration, escalation warning, task details, and a link. If 3+ days overdue, the Event Lead is CC'd as an escalation.",
    conditions: [
      "0–2 days overdue: email to assignee only",
      "3+ days overdue: CC to Event Lead (escalation)",
      "Runs daily at 09:00 UTC via Vercel Cron",
    ],
  },
  {
    id: 9,
    name: "Speaker Invitation",
    template: "speaker-invitation",
    icon: Mic2,
    color: "text-pink-400",
    bg: "bg-pink-400/10",
    trigger: "A speaker is added (linked) to an event",
    firedFrom: "POST /api/events/[id]/speakers",
    recipients: "The speaker's email",
    subject: "Speaker invitation: {eventTitle}",
    description:
      "Event title, date, venue, and the speaker's topic. Invites the speaker to participate.",
    conditions: [
      "Only sent if the speaker has an email address",
    ],
  },
  {
    id: 10,
    name: "Venue Confirmed",
    template: "venue-confirmed",
    icon: Building2,
    color: "text-teal-400",
    bg: "bg-teal-400/10",
    trigger: "Venue partner status is changed to CONFIRMED",
    firedFrom: "PATCH /api/events/[id]/venues/[linkId]",
    recipients: "Event Lead(s) of the event",
    subject: "Venue confirmed: {venueName} for {eventTitle}",
    description:
      "Venue name, address, capacity, contact name, and confirmation date.",
    conditions: [
      "Only triggered on status transition to CONFIRMED",
      "Sent to all event members with LEAD role",
    ],
  },
  {
    id: 11,
    name: "Weekly Digest",
    template: "weekly-digest",
    icon: BarChart3,
    color: "text-indigo-400",
    bg: "bg-indigo-400/10",
    trigger: "Every Monday at 09:00 UTC (weekly cron)",
    firedFrom: "GET /api/cron/weekly-digest",
    recipients: "All active members (non-VIEWER) individually",
    subject: "Weekly digest: {n} active tasks, {n} upcoming events",
    description:
      "Personalized summary with active tasks, completed this week, overdue tasks, and upcoming events for the next 14 days.",
    conditions: [
      "Sent in batches of 10 for performance",
      "Each member receives a personalized digest",
      "Runs every Monday at 09:00 UTC via Vercel Cron",
    ],
  },
];

// ─── Recipient badge ──────────────────────────────────────────────

function RecipientBadge({ text }: { text: string }) {
  // Determine icon based on recipient text
  const lower = text.toLowerCase();
  let Icon = Mail;
  let badgeColor = "text-muted bg-muted/10";

  if (lower.includes("all") || lower.includes("member") || lower.includes("admin")) {
    Icon = Users;
    badgeColor = "text-accent bg-accent/10";
  } else if (lower.includes("lead")) {
    Icon = Shield;
    badgeColor = "text-emerald-400 bg-emerald-400/10";
  } else if (lower.includes("super")) {
    Icon = Crown;
    badgeColor = "text-amber-400 bg-amber-400/10";
  } else if (lower.includes("speaker")) {
    Icon = Mic2;
    badgeColor = "text-pink-400 bg-pink-400/10";
  } else if (lower.includes("volunteer")) {
    Icon = Hand;
    badgeColor = "text-blue-400 bg-blue-400/10";
  }

  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full", badgeColor)}>
      <Icon className="h-3 w-3" />
      {text}
    </span>
  );
}

// ─── Page ────────────────────────────────────────────────────────

export default function EmailWorkflowsPage() {
  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <Link
          href="/settings/permissions"
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Features & Permissions
        </Link>
      </div>

      <PageHeader
        title="Email Workflows"
        description="Complete reference for all 11 automated email notifications — who receives what, when, and why"
      />

      {/* Flow overview */}
      <div className="mb-8 bg-surface border border-border rounded-xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-accent/10 text-accent">
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">How it works</h3>
            <p className="text-xs text-muted">All emails are fire-and-forget — they never block API responses</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
          <span className="bg-background border border-border rounded-lg px-3 py-1.5 font-medium">API Route / Cron Job</span>
          <span className="text-muted">→</span>
          <span className="bg-background border border-border rounded-lg px-3 py-1.5 font-medium">Trigger Function</span>
          <span className="text-muted">→</span>
          <span className="bg-background border border-border rounded-lg px-3 py-1.5 font-medium">React Email Template</span>
          <span className="text-muted">→</span>
          <span className="bg-background border border-border rounded-lg px-3 py-1.5 font-medium">SMTP (Gmail)</span>
          <span className="text-muted">→</span>
          <span className="bg-background border border-border rounded-lg px-3 py-1.5 font-medium">EmailLog (DB)</span>
        </div>
      </div>

      {/* Workflow cards */}
      <div className="space-y-4">
        {WORKFLOWS.map((w) => {
          const Icon = w.icon;
          return (
            <div
              key={w.id}
              className="bg-surface border border-border rounded-xl p-5 hover:border-border/80 transition-colors"
            >
              {/* Header */}
              <div className="flex items-start gap-3 mb-4">
                <div className={cn("p-2 rounded-lg shrink-0", w.bg)}>
                  <Icon className={cn("h-5 w-5", w.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold">{w.id}. {w.name}</h3>
                    <span className="text-[10px] font-mono text-muted bg-background border border-border rounded px-1.5 py-0.5">
                      {w.template}
                    </span>
                  </div>
                  <p className="text-sm text-muted mt-1">{w.description}</p>
                </div>
              </div>

              {/* Details grid */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted mb-1">When</p>
                  <p className="text-sm">{w.trigger}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted mb-1">Recipients</p>
                  <RecipientBadge text={w.recipients} />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted mb-1">Subject</p>
                  <p className="text-sm font-mono text-muted">{w.subject}</p>
                </div>
              </div>

              {/* Fired from */}
              <div className="mb-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted mb-1">Fired From</p>
                <span className="text-xs font-mono bg-background border border-border rounded px-2 py-1">
                  {w.firedFrom}
                </span>
              </div>

              {/* Conditions */}
              {w.conditions && w.conditions.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted mb-1.5">Conditions</p>
                  <ul className="space-y-1">
                    {w.conditions.map((c, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted">
                        <span className="h-1.5 w-1.5 rounded-full bg-accent mt-1.5 shrink-0" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend / footer note */}
      <div className="mt-8 mb-4 p-4 bg-surface border border-border rounded-xl">
        <h3 className="font-semibold text-sm mb-2">Key Notes</h3>
        <ul className="space-y-1.5 text-sm text-muted">
          <li className="flex items-start gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
            All emails use branded React Email templates with your configured group name and logo
          </li>
          <li className="flex items-start gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
            Every sent email is logged to the database with status tracking (Pending → Sent / Failed)
          </li>
          <li className="flex items-start gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
            If SMTP is not configured, all email functions silently skip — no errors are thrown
          </li>
          <li className="flex items-start gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
            Cron-based emails (reminders, digest) run via Vercel Cron Jobs at 09:00 UTC
          </li>
          <li className="flex items-start gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
            Event creation emails are sent to all Members, Admins, and Super Admins
          </li>
        </ul>
      </div>
    </div>
  );
}
