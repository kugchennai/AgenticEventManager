# Contributing to Meetup Manager

Thanks for your interest in contributing! This guide covers everything you need to get set up, work with the database, and submit changes.

---

## Table of Contents

- [Getting Started](#getting-started)
- [Database Management](#database-management)
- [Clean Database & Redeploy on Vercel](#clean-database--redeploy-on-vercel)
- [Common Database Errors](#common-database-errors)
- [Development Workflow](#development-workflow)
- [Code Style & Conventions](#code-style--conventions)
- [Quick Reference Checklist](#quick-reference-checklist)

---

## Getting Started

### 1. Fork & Clone

```bash
# Fork the repo on GitHub, then:
git clone https://github.com/<your-username>/event-manager.git
cd event-manager
npm install
```

### 2. Environment Setup

Copy the example env file and fill in the required values:

```bash
cp .env.example .env
```

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (pooled / connection pooler) |
| `DIRECT_URL` | PostgreSQL direct connection string (used for migrations) |
| `AUTH_SECRET` | NextAuth secret — generate with `openssl rand -base64 32` |
| `AUTH_GOOGLE_ID` | Google OAuth Client ID (from Google Cloud Console) |
| `AUTH_GOOGLE_SECRET` | Google OAuth Client Secret |
| `SUPER_ADMIN_EMAIL` | Your email address — grants Super Admin on first sign-in |
| `DISCORD_BOT_TOKEN` | *(optional)* Discord bot token for notifications |
| `CRON_SECRET` | *(optional)* Secret for authenticating Vercel Cron jobs |

### 3. Initialize the Database

```bash
npx prisma generate
npx prisma migrate dev
npx tsx prisma/seed.ts
```

### 4. Start the Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Database Management

### Local Development

| Command | What it does |
|---------|-------------|
| `npx prisma generate` | Generate the Prisma client from `schema.prisma` |
| `npx prisma migrate dev` | Create and apply migrations in development |
| `npx prisma migrate reset --force` | Drop all tables, re-apply every migration, and run the seed script |
| `npx prisma studio` | Open a visual database explorer at `localhost:5555` |
| `npx tsx prisma/seed.ts` | Run the seed script to populate default data |

### Production (Neon DB + Vercel)

Vercel has no interactive terminal, so migrations must be run either **from your local machine** or **as part of the Vercel build process**.

#### Option 1 — Run Migrations from Your Local Terminal

This is the simplest approach. Point your local CLI at the remote Neon database:

1. Update your `.env` with the Neon **production** `DATABASE_URL` and `DIRECT_URL`.
2. Run migrations:
   ```bash
   npx prisma migrate deploy
   ```
3. Seed the database (if needed):
   ```bash
   npx tsx prisma/seed.ts
   ```
4. Verify everything looks correct:
   ```bash
   npx prisma studio
   ```

> **Tip:** Switch your `.env` back to your local database URL when you're done.

#### Option 2 — Run Migrations During the Vercel Build

**Via Vercel Dashboard:**

Go to **Settings → General → Build & Development Settings** and set the build command to:

```
npx prisma generate && npx prisma migrate deploy && next build
```

**Via `package.json`:**

Update the `build` script:

```json
{
  "scripts": {
    "build": "prisma generate && prisma migrate deploy && next build"
  }
}
```

#### Seeding on Vercel

For **one-time seeding** (e.g., after a fresh database), temporarily add the seed step to the build command:

```
npx prisma generate && npx prisma migrate deploy && npx tsx prisma/seed.ts && next build
```

> **Important:** Revert the build command after the first successful deploy so the seed script doesn't run on every deployment.

---

## Clean Database & Redeploy on Vercel

Use this when you need a full database reset in production.

1. **Delete / recreate the database** in the [Neon Console](https://console.neon.tech).
2. **Update local `.env`** with the new `DATABASE_URL` and `DIRECT_URL`.
3. **Update Vercel environment variables:**
   - Go to **Vercel Dashboard → Settings → Environment Variables**.
   - Set `DATABASE_URL` and `DIRECT_URL` with the new values.
   - Enable for **Production**, **Preview**, and **Development**.
4. **Run migrations** from your local terminal:
   ```bash
   npx prisma migrate deploy
   ```
5. **Seed the database:**
   ```bash
   npx tsx prisma/seed.ts
   ```
6. **Verify** with Prisma Studio:
   ```bash
   npx prisma studio
   ```
7. **Redeploy on Vercel** — pick one:
   - Push a new commit to trigger a build.
   - Vercel Dashboard → **Deployments** → **"..."** → **Redeploy**.
   - Or run `npx vercel --prod` from your terminal.

---

## Common Database Errors

| Error Code | Message | Fix |
|:----------:|---------|-----|
| **P2021** | Table does not exist | Run `npx prisma migrate deploy` |
| **P1001** | Can't reach database server | Check that `DATABASE_URL` is correct and the Neon database is active |
| **P2002** | Unique constraint failed | Duplicate data — check the seed script or reset the database |
| **P1003** | Database does not exist | Create the database in the Neon Console first |
| **P3009** | Migration failed | Run `npx prisma migrate reset --force` locally, then redeploy |

---

## Development Workflow

### Branch Naming

Use a prefix that describes the type of change:

```
feature/add-rsvp-tracking
fix/speaker-card-overflow
chore/update-dependencies
```

### Before Submitting a PR

```bash
# Lint
npm run lint

# Type check
npx tsc --noEmit

# End-to-end tests
npm run test:e2e
```

### Pull Requests

- Create PRs against the `main` branch.
- Include a clear description of what changed and why.
- Link related issues if applicable.

---

## Code Style & Conventions

| Area | Convention |
|------|-----------|
| **Language** | TypeScript in strict mode — no `any` unless absolutely necessary |
| **Styling** | Tailwind CSS utility classes only — no inline `style` attributes |
| **Database** | All queries go through Prisma — no raw SQL unless there's a strong reason |
| **Audit logging** | Every CRUD operation must be audit-logged via the `logAudit()` helper |
| **Authorization** | All API routes must include role-based access checks using `permissions.ts` |
| **Components** | Use the design system components in `src/components/design-system/` |

---

## Quick Reference Checklist

Full database reset + production redeploy:

- [ ] Delete / recreate database in Neon Console
- [ ] Update `DATABASE_URL` and `DIRECT_URL` in local `.env`
- [ ] Update `DATABASE_URL` and `DIRECT_URL` in Vercel environment variables
- [ ] Run `npx prisma migrate deploy` from local terminal
- [ ] Run `npx tsx prisma/seed.ts` from local terminal
- [ ] Verify with `npx prisma studio`
- [ ] Redeploy on Vercel
