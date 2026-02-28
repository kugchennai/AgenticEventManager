# Meetup Manager

A full-stack app for organizing community meetups. Manage events, speakers, volunteers, venue partners, and SOP checklists with role-based access control, audit logging, and Discord integration.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router + Turbopack) |
| Language | TypeScript |
| Database | PostgreSQL + Prisma 7 (driver adapter with raw `pg` pool) |
| Auth | NextAuth.js v5 (Google OAuth, JWT sessions) + custom mobile token auth |
| Styling | Tailwind CSS 4 + custom design system |
| Animations | Motion (Framer Motion successor) |
| Icons | Lucide React |
| Testing | Playwright (E2E) |
| Deployment | Vercel (with Cron Jobs) |
| Notifications | Discord Bot API |

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database

### Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your:
# - DATABASE_URL (PostgreSQL connection string)
# - AUTH_SECRET (run: openssl rand -base64 32)
# - AUTH_GOOGLE_ID + AUTH_GOOGLE_SECRET (from Google Cloud Console)
# - SUPER_ADMIN_EMAIL (your email for initial super admin)
# - DISCORD_BOT_TOKEN (optional, for Discord notifications)
# - CRON_SECRET (optional, for scheduled reminders)

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed default SOP template
npx tsx prisma/seed.ts

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Features

### Dashboard

- **Bento grid layout** with responsive 3-4 column grid
- **Next Event hero card** — title, date, venue, status badge, SOP progress bar (tasks completed / total), direct link to detail
- **Stat cards** — total events (with today / upcoming / past breakdown), speakers count, volunteers count
- **My Tasks panel** — top 10 incomplete tasks assigned to the current user with inline checkbox to toggle status, priority badge, deadline, and link to parent event
- **Overdue Tasks panel** — up to 10 overdue tasks with owner avatars and red-highlighted deadlines
- **Recent Activity feed** — last 10 audit log entries with relative timestamps
- **Role-aware rendering** — volunteers see only their scoped data; "New Event" button only visible for Event Lead+

### Event Management

- **Full lifecycle** — create, edit, and delete events with status progression: `DRAFT → SCHEDULED → LIVE → COMPLETED`
- **Card grid listing** with smart date badges ("Today" with pulse-glow, "Upcoming", "Ended"), speaker / volunteer / checklist counts, and member avatar stacks
- **Filter tabs** — Upcoming / Past / All with live counts
- **5-tab detail view**:
  - **Overview** — bento grid with About section, SOP progress bar (percentage + task count), stat cards for speakers / volunteers / venue partners, and event lead info
  - **Speakers** — linked speakers with status badges; add/remove via searchable picker modal
  - **Volunteers** — linked volunteers with status + role; dual-tab picker (From Members / From Directory); convert-to-member button for admins
  - **Venue Partners** — expandable cards with contact info, capacity, cost, confirmation date, and notes; status dropdown (INQUIRY / PENDING / CONFIRMED / DECLINED / CANCELLED); venue confirmation conflict modal; auto-syncs `event.venue` field and SOP tasks when a venue partner is confirmed
  - **SOP Checklist** — grouped tasks (Pre-Event / On-Day / Post-Event) with color-coded section headers, per-section progress bars, collapse/expand all, inline editing (priority, deadline, assignee), self-assign mode for volunteers, overdue highlighting, and venue-confirmation guard on venue tasks
- **SOP template integration** — select a template at creation to auto-generate checklists with tasks, priorities, and deadlines calculated relative to the event date
- **Volunteer scoping** — `VOLUNTEER` role users only see events they're assigned to (via volunteer profile or event membership)
- **Cascade deletion** — removing an event cascades to all linked speakers, volunteers, venues, and checklists

### Speaker Directory

- **Bento grid cards** with avatar (Google photo or gradient initials), name, email, phone, topic, and action buttons
- **Event contributions widget** — linked events with color-coded status badges per event
- **Status count aggregation** — API returns confirmed / invited / declined counts per speaker
- **CRUD via modal forms** with inline validation
- **Volunteer-scoped visibility** — volunteers only see speakers from their assigned events

### Volunteer Management

- **Data table** with columns: Name, Email, Discord, Role, Events, Actions
- **Event contributions widget** with status badges
- **Promote-to-Member flow** — configurable threshold (from App Settings), validates email, creates or reactivates user with `EVENT_LEAD` role, removes volunteer record after promotion; visible only for admins when the volunteer meets the threshold
- **Member-volunteer conflict guard** — prevents adding a volunteer whose email belongs to an existing member (409 response, directs to existing member)
- **Dual-source event linking** — volunteers can be linked from the directory or from the member list (auto-creates a Volunteer record for members)
- **User-volunteer link** — volunteers linked to user accounts can sign in and self-assign tasks
- **Task assignment** — event-level volunteers can be assigned to SOP checklist tasks; `VOLUNTEER` role users can self-assign ("Take" button) on unassigned tasks

### Venue Partner Management

- **Bento grid cards** showing venue details (address, capacity, contact, email, phone)
- **Full CRUD** with modal forms, delete confirmation, and event count / status breakdown per venue
- **Event linking** with status workflow: `INQUIRY → PENDING → CONFIRMED / DECLINED / CANCELLED`
- **Cost tracking** (Decimal), confirmation dates, and notes per event link
- **Volunteer-scoped visibility** — volunteers only see venues linked to their events

### SOP Templates & Checklists

- **Template management** — create, edit, duplicate ("Copy" suffix), and delete reusable templates
- **Three-section task editor** — Pre-Event, On-Day, Post-Event tasks with title, relative days (before/after event), and priority (LOW / MEDIUM / HIGH / CRITICAL)
- **Expandable preview** — view all tasks grouped by section with priority badges and relative day labels
- **Checklist generation** — apply a template to an event to bulk-create tasks with auto-calculated deadlines
- **Task features** — status (TODO / IN_PROGRESS / BLOCKED / DONE), priority, deadline, owner, assignee, volunteer assignee, blocked reason, sort order
- **Volunteer-restricted editing** — volunteers can only toggle status (TODO ↔ DONE) and self-assign/unassign; full editing for Event Lead+
- **Auto-completion tracking** — sets `completedAt` when status → DONE, clears it when un-done

### Members & Role Management

- **Member list** with avatar, name, email, role, event contributions, joined date
- **Inline role dropdown** — change roles with optimistic UI and rollback on failure
- **Add Member modal** — invite by email with optional name and role (scoped by caller: Super Admin can assign Admin; Admin can only assign Member)
- **Remove Member flow** — confirmation dialog showing ownership count (events, speakers, volunteers, venue partners, tasks); if the member owns entities, forces selection of an admin to reassign all ownership to; soft-deletes the user
- **Soft-delete reactivation** — re-adding a previously removed member restores their account
- **Volunteer collision detection** — adding an email belonging to a volunteer directs to the "Promote to Member" flow

### Audit Trail

- **Activity feed** with user avatar, action badge (CREATE / UPDATE / DELETE with color-coding), entity type label, entity name, and timestamp
- **Change diff display** — field-level before → after changes with strikethrough and highlight styling
- **Entity type filter** — filter by Event, Speaker, Volunteer, Task, Template, Event Speaker, Event Volunteer, Member
- **Paginated API** (50 per page) with entity name backfill for legacy logs
- **Tracked entities** — Event, Speaker, Volunteer, SOPTask, SOPTemplate, EventSpeaker, EventVolunteer, User, AppSetting, VenuePartner
- **Fire-and-forget logging** with `diffChanges()` utility for field-level diff computation

### Discord Integration

- **Bot notifications** (raw fetch, no SDK dependency):
  - Task assigned notification (blue embed)
  - Deadline approaching warning — tasks due within 3 days (yellow embed, batches up to 10)
  - Overdue task alerts (red embed, batches up to 10)
  - New event created notification (green embed)
- **Admin configuration** — set bot token, guild ID, channel ID, and enable/disable reminders
- **Test endpoint** — send a test message to verify bot connectivity
- **Scheduled reminders** — Vercel Cron job runs daily at 09:00 UTC, finds approaching and overdue tasks, sends Discord notifications if reminders are enabled
- **Graceful degradation** — all notification functions silently skip if no bot token is configured

### Authentication & Authorization

- **Google OAuth** (web) via NextAuth v5 with JWT-based sessions
- **Mobile token auth** — `POST /api/auth/token` issues access token (JWT, 7 day) + refresh token (opaque, 30 day); `POST /api/auth/refresh` rotates tokens
- **Dual auth support** — API routes accept both cookie sessions (web) and Bearer tokens (mobile) via unified `getAuthSession()` helper
- **Sign-in gates** — only the Super Admin email, existing non-deleted users, and emails matching volunteer records can sign in; volunteer emails auto-provision a `VOLUNTEER` account
- **Soft-delete enforcement** — deleted users are blocked from sign-in and JWT issuance
- **Middleware protection** — all routes except `/`, `/unauthorized`, `/api`, and static assets require authentication

### App Settings

- **Volunteer promotion threshold** — Super Admin-only setting to configure the minimum event contributions before a volunteer can be promoted to member
- **Key-value store** — extensible `AppSetting` model for future settings
- **Audit-logged** — all setting changes are tracked

---

## Roles & Permissions

### Global Roles (hierarchy 0 → 4)

| Role | Display Name | Level | Capabilities |
|------|-------------|-------|-------------|
| `VIEWER` | Temporary Viewer | 0 | Read-only access to assigned events |
| `VOLUNTEER` | Volunteer | 1 | Read assigned events, self-assign tasks, toggle own task status |
| `EVENT_LEAD` | Member | 2 | Create and manage events, read all events, manage speakers / volunteers / venues |
| `ADMIN` | Admin | 3 | Full access to all events, manage members (except other admins), audit log |
| `SUPER_ADMIN` | Super Admin | 4 | Everything + manage admins, app settings, member removal with ownership reassignment |

### Event Roles (per-event, hierarchy 0 → 3)

| Role | Level | Capabilities |
|------|-------|-------------|
| `VIEWER` | 0 | Read event data |
| `VOLUNTEER` | 1 | Read event data |
| `ORGANIZER` | 2 | Create / update within event |
| `LEAD` | 3 | Full event control including delete |

---

## Design System

12 reusable components built with Tailwind CSS + CVA patterns:

| Component | Description |
|-----------|-------------|
| **BentoGrid / BentoCard** | Responsive grid (1→4 columns) with configurable span, hover glow effects |
| **Button** | 4 variants (primary, secondary, ghost, danger) × 4 sizes (sm, md, lg, icon) |
| **EmptyState** | Centered placeholder with icon, title, description, and optional action |
| **EventContributions** | Expandable event list with status badges per linked entity |
| **Modal** | Portal-based dialog with backdrop blur, Escape close, scroll lock |
| **OwnerAvatar / AvatarStack** | Avatar with Google photo or gradient initials fallback; overlapping stack with "+N" overflow |
| **PageHeader** | Title bar with description and right-aligned action slot |
| **PriorityBadge** | Color-coded pill for LOW / MEDIUM / HIGH / CRITICAL (critical has pulse animation) |
| **Skeleton / CardSkeleton / TableRowSkeleton** | Shimmer loading placeholders for cards and tables |
| **StatCard** | Dashboard metric card with icon, value, trend indicator, and hover lift |
| **StatusBadge** | Universal status pill supporting task, speaker, volunteer, event, and venue statuses |

### Layout

| Component | Description |
|-----------|-------------|
| **AppShell** | Root wrapper with sidebar + top bar + main content (max 1400px) |
| **Sidebar** | Fixed left nav with role-based menu items, collapsible |
| **TopBar** | Header with `⌘K` search trigger, dark/light theme toggle, user menu |
| **CommandPalette** | `⌘K` palette with role-filtered commands, arrow key navigation |

---

## Database Models

```
User ──< EventMember >── Event
  │                        │
  │  ┌─ EventSpeaker >─────┤
  │  │                      │
  └──┤  EventVolunteer >────┤
     │                      │
     ├─ EventVenuePartner >─┤
     │                      │
     └─ SOPChecklist >──────┘
            │
            └──< SOPTask

Speaker ──< EventSpeaker
Volunteer ──< EventVolunteer
VenuePartner ──< EventVenuePartner

SOPTemplate (standalone, JSON defaultTasks)
AuditLog (standalone, tracks all changes)
AppSetting (key-value config store)
DiscordConfig (bot settings)
RefreshToken ──< User
```

---

## Project Structure

```
src/
├── app/
│   ├── api/              # REST API routes
│   │   ├── auth/         # Token auth + refresh endpoints
│   │   ├── events/       # Event CRUD + member management
│   │   ├── speakers/     # Speaker CRUD
│   │   ├── volunteers/   # Volunteer CRUD + convert-to-member
│   │   ├── venues/       # Venue partner CRUD
│   │   ├── checklists/   # Checklist + task CRUD
│   │   ├── templates/    # SOP template CRUD
│   │   ├── members/      # Member management + role changes
│   │   ├── dashboard/    # Aggregated dashboard data
│   │   ├── audit-log/    # Paginated audit logs
│   │   ├── settings/     # App settings CRUD
│   │   ├── discord/      # Discord config + test
│   │   └── cron/         # Scheduled reminder jobs
│   ├── dashboard/        # Dashboard page
│   ├── events/           # Event list + detail + new event pages
│   ├── speakers/         # Speaker directory page
│   ├── volunteers/       # Volunteer directory page
│   ├── venues/           # Venue partner directory page
│   ├── settings/         # Settings hub + sub-pages
│   │   ├── members/      # Member management page
│   │   ├── audit-log/    # Audit log viewer
│   │   ├── templates/    # SOP template editor
│   │   └── discord/      # Discord config page
│   └── login/            # Login page
├── components/
│   ├── design-system/    # 12 reusable UI components
│   └── layout/           # App shell, sidebar, top bar, command palette
├── lib/
│   ├── auth.ts           # NextAuth config + callbacks
│   ├── auth-helpers.ts   # Dual auth session resolver
│   ├── permissions.ts    # Role hierarchy + access checks
│   ├── audit.ts          # Audit logging + diff utility
│   ├── discord.ts        # Discord bot message helpers
│   ├── prisma.ts         # Prisma client (with soft-delete middleware)
│   └── utils.ts          # Shared utilities
├── generated/prisma/     # Generated Prisma client
└── types/                # TypeScript type extensions
```
