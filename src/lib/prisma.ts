import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createFilteredClient> | undefined;
  prismaUnfiltered: PrismaClient | undefined;
};

function createPool() {
  return new pg.Pool({ connectionString: process.env.DATABASE_URL! });
}

function createBaseClient() {
  const pool = createPool();
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

/**
 * Creates a Prisma client with soft-delete filtering via $extends.
 * All User queries automatically filter out soft-deleted records (deletedAt IS NULL).
 */
function createFilteredClient() {
  const base = createBaseClient();
  return base.$extends({
    query: {
      user: {
        async findMany({ args, query }) {
          if (args.where?.deletedAt === undefined) {
            args.where = { ...args.where, deletedAt: null };
          }
          return query(args);
        },
        async findFirst({ args, query }) {
          if (args.where?.deletedAt === undefined) {
            args.where = { ...args.where, deletedAt: null };
          }
          return query(args);
        },
        async findUnique({ args, query }) {
          // findUnique can't filter on non-unique fields directly,
          // but we check after getting the result
          const result = await query(args);
          if (result && result.deletedAt !== null && result.deletedAt !== undefined) {
            return null;
          }
          return result;
        },
        async findFirstOrThrow({ args, query }) {
          if (args.where?.deletedAt === undefined) {
            args.where = { ...args.where, deletedAt: null };
          }
          return query(args);
        },
        async count({ args, query }) {
          if (args.where?.deletedAt === undefined) {
            args.where = { ...args.where, deletedAt: null };
          }
          return query(args);
        },
      },
    },
  });
}

/**
 * Default Prisma client with soft-delete middleware.
 * All User queries automatically filter out soft-deleted records.
 */
export const prisma = globalForPrisma.prisma ?? createFilteredClient();

/**
 * Unfiltered Prisma client — bypasses soft-delete filtering.
 * Use ONLY in edge cases: sign-in checks, reactivation, delete target lookups.
 */
export const prismaUnfiltered =
  globalForPrisma.prismaUnfiltered ?? createBaseClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaUnfiltered = prismaUnfiltered;
}
