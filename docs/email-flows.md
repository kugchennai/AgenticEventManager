# Email Notification Flows

Complete reference for all automated email notifications in Meetup Manager.

> **Tech stack:** [Nodemailer](https://nodemailer.com/) (SMTP transport) + [React Email](https://react.email/) (JSX templates)

---

## Table of Contents

1. [Member Invitation](#1-member-invitation)
2. [Volunteer Welcome](#2-volunteer-welcome)
3. [Volunteer Promotion](#3-volunteer-promotion)
4. [Event Created / Scheduled](#4-event-created--scheduled)
5. [Event Reminder](#5-event-reminder)
6. [Task Assigned](#6-task-assigned)
7. [Task Due Soon](#7-task-due-soon)
8. [Task Overdue](#8-task-overdue)
9. [Speaker Invitation](#9-speaker-invitation)
10. [Venue Confirmed](#10-venue-confirmed)
11. [Weekly Digest](#11-weekly-digest)

---

## Flow Diagram

```
┌────────────────────┐     ┌─────────────────┐     ┌─────────────┐
│   API Route /       │     │  Trigger         │     │  SMTP        │
│   Cron Job          │────▶│  Function        │────▶│  (Gmail)     │
│                     │     │  (fire & forget) │     │              │
└────────────────────┘     └─────────────────┘     └──────┬──────┘
                                                          │
                                                          ▼
                                                   ┌─────────────┐
                                                   │  EmailLog    │
                                                   │  (database)  │
                                                   └─────────────┘
```

All emails are **fire-and-forget** — they never block the API response. Failures are logged to the `EmailLog` table but don't affect the user-facing operation.

---

## 1. Member Invitation

| Field | Details |
|-------|---------|
| **Template** | `member-invitation.tsx` |
| **Trigger function** | `sendMemberInvitationEmail(userId)` |
| **Fired from** | `POST /api/members` |
| **When** | Admin adds a new member (or reactivates a soft-deleted one) |
| **Recipient** | The invited member's email |
| **Subject** | `You've been invited to Meetup Manager` |
| **Content** | Welcome message, assigned role, link to sign in |

### Trigger points in code:
- New user created → email sent with role and inviter name
- Soft-deleted user reactivated → same email sent

---

## 2. Volunteer Welcome

| Field | Details |
|-------|---------|
| **Template** | `volunteer-welcome.tsx` |
| **Trigger function** | `sendVolunteerWelcomeEmail(name, email, role, inviterName)` |
| **Fired from** | `POST /api/volunteers` |
| **When** | A new volunteer is added with an email address |
| **Recipient** | The volunteer's email |
| **Subject** | `Welcome to the team, {name}!` |
| **Content** | Welcome message, assigned role, what to expect, link to app |

### Conditions:
- Only sent if the volunteer has an email address
- Skipped if SMTP is not configured

---

## 3. Volunteer Promotion

| Field | Details |
|-------|---------|
| **Template** | `volunteer-promotion.tsx` |
| **Trigger function** | `sendVolunteerPromotionEmail(name, email)` |
| **Fired from** | `POST /api/volunteers/[id]/convert` |
| **When** | A volunteer is promoted to Member (Event Lead role) |
| **Recipient** | The volunteer's email |
| **Subject** | `Congratulations! You've been promoted to Member` |
| **Content** | New role details, new permissions list, next steps |

### Trigger points in code:
- Existing user reactivated as member → email sent
- New user created from volunteer → email sent

---

## 4. Event Created / Scheduled

| Field | Details |
|-------|---------|
| **Template** | `event-created.tsx` |
| **Trigger function** | `sendEventCreatedEmail(eventId)` |
| **Fired from** | `POST /api/events` and `PATCH /api/events/[id]` |
| **When** | Event is created with status `SCHEDULED`, or updated to `SCHEDULED` |
| **Recipients** | All Members (EVENT_LEAD), Admins, and Super Admins + event members |
| **Subject** | `New event: {title}` |
| **Content** | Event title, date, venue, created by, link to event page |

### Conditions:
- All active users with `EVENT_LEAD`, `ADMIN`, or `SUPER_ADMIN` role receive this email
- Event members (if any additional) are also included
- Deduplicated — each email address only receives one copy
- Skips if no recipients are found

---

## 5. Event Reminder

| Field | Details |
|-------|---------|
| **Template** | `event-reminder.tsx` |
| **Trigger function** | `sendEventReminderEmail(eventId)` |
| **Fired from** | `GET /api/cron/event-reminders` (daily cron) |
| **When** | Scheduled events within the next 2 days |
| **Recipients** | All event team members + confirmed speakers |
| **Subject** | `Reminder: {title} is in {n} day(s)` |
| **Content** | Countdown, event details, link to event page |
| **Attachment** | `event.ics` calendar file (RFC 5545) |

### Cron schedule:
- **Frequency:** Daily at 09:00 UTC
- **Path:** `/api/cron/event-reminders`
- **Logic:** Finds all `SCHEDULED` events with dates between now and 2 days from now

### ICS Calendar File:
The `.ics` attachment lets recipients add the event to any calendar app (Google Calendar, Outlook, Apple Calendar).

---

## 6. Task Assigned

| Field | Details |
|-------|---------|
| **Template** | `task-assigned.tsx` |
| **Trigger function** | `sendTaskAssignedEmail(taskId, assignedByName)` |
| **Fired from** | `PATCH /api/checklists/[id]/tasks/[taskId]` |
| **When** | A task's `assigneeId` or `volunteerAssigneeId` is changed |
| **Recipient** | The newly assigned user or volunteer |
| **Subject** | `Task assigned: {title}` |
| **Content** | Task title, priority badge, deadline, event name, assigned by, link |

### Conditions:
- Sent when either `assigneeId` or `volunteerAssigneeId` changes
- Resolves the recipient from whichever assignee field was set
- Skipped if the assignee has no email

---

## 7. Task Due Soon

| Field | Details |
|-------|---------|
| **Template** | `task-due-soon.tsx` |
| **Trigger function** | `sendTaskDueSoonEmail(taskId, daysRemaining)` |
| **Fired from** | `GET /api/cron/reminders` (daily cron) |
| **When** | Task deadline is within the next 3 days |
| **Recipient** | The assigned user or volunteer |
| **Subject** | `Task due soon: {title}` |
| **Content** | Urgency indicator, task details, deadline countdown, link |

### Cron schedule:
- **Frequency:** Daily at 09:00 UTC
- **Path:** `/api/cron/reminders`
- **Logic:** Finds tasks with deadlines between now and 3 days from now that are not `DONE`

---

## 8. Task Overdue

| Field | Details |
|-------|---------|
| **Template** | `task-overdue.tsx` |
| **Trigger function** | `sendTaskOverdueEmail(taskId, overdueDays, ccEventLead)` |
| **Fired from** | `GET /api/cron/reminders` (daily cron) |
| **When** | Task deadline has passed and task is not `DONE` |
| **Recipient** | The assigned user or volunteer |
| **CC** | Event Lead (if task is 3+ days overdue — escalation) |
| **Subject** | `OVERDUE: {title}` |
| **Content** | Overdue duration, escalation warning, task details, link |

### Escalation logic:
- **0–2 days overdue:** Email sent to assignee only
- **3+ days overdue:** Email sent to assignee **+ CC to Event Lead** as escalation
- The template shows an escalation notice when CC is active

---

## 9. Speaker Invitation

| Field | Details |
|-------|---------|
| **Template** | `speaker-invitation.tsx` |
| **Trigger function** | `sendSpeakerInvitationEmail(eventSpeakerId)` |
| **Fired from** | `POST /api/events/[id]/speakers` |
| **When** | A speaker is added (linked) to an event |
| **Recipient** | The speaker's email |
| **Subject** | `Speaker invitation: {eventTitle}` |
| **Content** | Event title, date, venue, speaker's topic |

### Conditions:
- Only sent if the speaker has an email address
- Uses the EventSpeaker link ID to resolve speaker + event data

---

## 10. Venue Confirmed

| Field | Details |
|-------|---------|
| **Template** | `venue-confirmed.tsx` |
| **Trigger function** | `sendVenueConfirmedEmail(eventVenuePartnerId, eventId)` |
| **Fired from** | `PATCH /api/events/[id]/venues/[linkId]` |
| **When** | Venue partner status is changed to `CONFIRMED` |
| **Recipients** | Event Lead(s) of the event |
| **Subject** | `Venue confirmed: {venueName} for {eventTitle}` |
| **Content** | Venue name, address, capacity, contact name, confirmation date |

### Conditions:
- Only triggered when status transitions to `CONFIRMED`
- Sent to all event members with `LEAD` role

---

## 11. Weekly Digest

| Field | Details |
|-------|---------|
| **Template** | `weekly-digest.tsx` |
| **Trigger function** | `sendWeeklyDigestEmail(userId)` |
| **Fired from** | `GET /api/cron/weekly-digest` (weekly cron) |
| **When** | Every Monday at 09:00 UTC |
| **Recipient** | Each active member individually |
| **Subject** | `Weekly digest: {n} active tasks, {n} upcoming events` |
| **Content** | Summary stats, assigned tasks, overdue tasks, upcoming events (14 days) |

### Cron schedule:
- **Frequency:** Every Monday at 09:00 UTC
- **Path:** `/api/cron/weekly-digest`
- **Logic:** Queries all active users (non-VIEWER), sends personalized digest in batches of 10

### Digest includes:
- **Summary cards:** Total active tasks, completed this week, upcoming events count
- **Overdue tasks:** Listed with urgency styling
- **Assigned tasks:** Up to 20 incomplete tasks sorted by deadline
- **Upcoming events:** Next 14 days of scheduled/live events

---

## Architecture

### File Structure

```
src/lib/
├── email.ts                          # Core SMTP service (transporter, sendEmail, renderAndSend)
└── emails/
    ├── ics.ts                        # ICS calendar file generator
    ├── components/
    │   └── layout.tsx                # Shared branded layout (EmailLayout, DetailTable, etc.)
    ├── templates/
    │   ├── member-invitation.tsx     # #1
    │   ├── volunteer-welcome.tsx     # #2
    │   ├── volunteer-promotion.tsx   # #3
    │   ├── event-created.tsx         # #4
    │   ├── event-reminder.tsx        # #5
    │   ├── task-assigned.tsx         # #6
    │   ├── task-due-soon.tsx         # #7
    │   ├── task-overdue.tsx          # #8
    │   ├── speaker-invitation.tsx    # #9
    │   ├── venue-confirmed.tsx       # #10
    │   └── weekly-digest.tsx         # #11
    └── triggers.ts                   # High-level trigger functions
```

### Core Service (`email.ts`)

| Export | Purpose |
|--------|---------|
| `isEmailConfigured()` | Returns `true` if all SMTP env vars are set |
| `sendEmail(options)` | Low-level send via nodemailer, logs to `EmailLog` |
| `renderAndSend(to, subject, template, component, options?)` | Renders React Email component to HTML, then sends |
| `verifyConnection()` | Tests SMTP connectivity (used by test endpoint) |

### EmailLog Database Model

Every email is tracked in the `EmailLog` table:

| Column | Type | Description |
|--------|------|-------------|
| `id` | String (CUID) | Primary key |
| `to` | String | Recipient email(s) |
| `subject` | String | Email subject line |
| `template` | String | Template identifier (e.g., `member_invitation`) |
| `status` | Enum | `PENDING` → `SENT` or `FAILED` |
| `error` | String? | Error message if failed |
| `sentAt` | DateTime? | Timestamp when successfully sent |
| `createdAt` | DateTime | When the send was initiated |

### API Endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/email/test` | `GET` | Super Admin | Check SMTP config status |
| `/api/email/test` | `POST` | Super Admin | Send a test email to your inbox |
| `/api/email/log` | `GET` | Admin+ | View paginated email logs (filter by template, status) |

### Cron Jobs

| Path | Schedule | Purpose |
|------|----------|---------|
| `/api/cron/reminders` | Daily 09:00 UTC | Task due soon + task overdue emails |
| `/api/cron/event-reminders` | Daily 09:00 UTC | Event reminder emails (2 days before) |
| `/api/cron/weekly-digest` | Monday 09:00 UTC | Weekly digest for all active members |

---

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SMTP_HOST` | Yes | — | SMTP server hostname (`smtp.gmail.com`) |
| `SMTP_PORT` | No | `587` | SMTP port (587 for TLS, 465 for SSL) |
| `SMTP_USER` | Yes | — | SMTP username (Gmail address) |
| `SMTP_PASS` | Yes | — | SMTP password (Gmail App Password) |
| `SMTP_FROM` | No | `SMTP_USER` | Sender display name (`"App Name <email>"`) |
| `CRON_SECRET` | Yes (prod) | — | Shared secret for cron job authentication |

### Gmail Setup

1. Enable **2-Step Verification**: [myaccount.google.com/security](https://myaccount.google.com/security)
2. Generate an **App Password**: [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Add to `.env`:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=xxxx-xxxx-xxxx-xxxx
   SMTP_FROM="Meetup Manager <your-email@gmail.com>"
   ```
4. Verify: Sign in as Super Admin → `POST /api/email/test`

### Graceful Degradation

All email functions check `isEmailConfigured()` first. If SMTP is not configured:
- No emails are sent
- No errors are thrown
- API routes work normally without email side effects
- A startup warning is logged: `⚠️ SMTP is not configured`

---

## Template Design

All templates share a consistent branded layout via `EmailLayout`:

- **Header:** App name with amber/gold accent bar (#F59E0B)
- **Content:** White card with rounded corners, clean typography
- **Footer:** "This is an automated message" disclaimer
- **Responsive:** Works across Gmail, Outlook, Apple Mail, and mobile clients
- **Inline CSS:** All styles are inlined for maximum email client compatibility

### Reusable Components

| Component | Purpose |
|-----------|---------|
| `EmailLayout` | Wraps all templates with header/footer/branding |
| `DetailTable` | Key-value detail rows (used in event/task emails) |
| `DetailItem` | Single row in a detail table |
| `PriorityBadge` | Colored badge for task priority (HIGH/MEDIUM/LOW) |

### Style Variants

| Box Style | Color | Usage |
|-----------|-------|-------|
| `infoBox` | Blue (#3B82F6) | Informational callouts |
| `warningBox` | Amber (#F59E0B) | Due soon warnings |
| `dangerBox` | Red (#EF4444) | Overdue alerts, errors |
| `successBox` | Green (#10B981) | Confirmations, promotions |
