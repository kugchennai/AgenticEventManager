# Meetup Manager

A full-stack app for organizing community meetups. Manage events, speakers, volunteers, and SOP checklists with role-based access control and Discord integration.

## Tech Stack

- **Next.js 16** (App Router + Turbopack)
- **TypeScript**
- **PostgreSQL** + **Prisma 7** ORM
- **NextAuth.js** (Google OAuth)
- **Tailwind CSS 4** + custom design system
- **Discord API** for notifications

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
# - DISCORD_BOT_TOKEN (optional, for Discord notifications)

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

## Features

- **Event Management** - Create, schedule, and track meetups
- **Speaker Directory** - Manage speakers, track confirmation status
- **Volunteer Management** - Assign roles, track participation
- **SOP Checklists** - Template-based task lists with deadlines, priorities, and ownership
- **Role-Based Access** - Admin, Event Lead, Volunteer, Viewer roles with event-level permissions
- **Audit Trail** - Full history of who changed what and when
- **Discord Integration** - Automated deadline reminders and event notifications
- **Assignment & Ownership** - Every task, speaker booking, and volunteer assignment has an accountable owner

## Roles

| Role | Permissions |
|------|------------|
| Viewer | Read-only access |
| Volunteer | Mark own assigned tasks complete |
| Event Lead | Full CRUD on events they lead |
| Admin | Full access + user management |

## Project Structure

```
src/
├── app/              # Next.js pages and API routes
├── components/
│   ├── design-system/  # Reusable UI components
│   └── layout/         # App shell (sidebar, top bar)
├── lib/              # Auth, Prisma, permissions, audit, Discord
└── generated/        # Prisma generated client
```
