# Copilot Instructions

## Git Branch Rule

**Before committing**, check if you're on the `main` branch. If so, create a new feature branch first before committing and pushing changes. Never commit directly to main.

## Git Push Rule

**Before every `git push`**, remind the user to:
1. Check if there are any pending Prisma schema changes that need a migration (`npx prisma migrate status`)
2. Ask use to add migrations in the server side in the vercel dashboard if there are new schema changes. If yes give the command to be added the dashboard: `npx prisma migrate deploy` (note: this command is safe to run multiple times as it will only apply pending migrations)
3. Ensure `src/generated/prisma/` files are up to date with the schema

This applies regardless of which chat or conversation the push is requested in.
