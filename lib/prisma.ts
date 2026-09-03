import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/lib/generated/prisma/client";

/** Bump when Prisma models change so HMR does not keep a stale client. */
const PRISMA_SCHEMA_REVISION = "book_inventory.sale_price";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaSchemaRevision: string | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not defined in environment variables.");
  }

  const adapter = new PrismaMariaDb(connectionString);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

/** True if the cached client exposes the current schema models. */
function isClientUpToDate(client: PrismaClient): boolean {
  // After `prisma generate`, HMR can keep a stale PrismaClient on globalThis.
  if (typeof (client as { sessions?: unknown }).sessions === "undefined") {
    return false;
  }
  return globalForPrisma.prismaSchemaRevision === PRISMA_SCHEMA_REVISION;
}

function getPrismaClient(): PrismaClient {
  const cached = globalForPrisma.prisma;

  if (cached && isClientUpToDate(cached)) {
    return cached;
  }

  const client = createPrismaClient();

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
    globalForPrisma.prismaSchemaRevision = PRISMA_SCHEMA_REVISION;
  }

  return client;
}

export const prisma = getPrismaClient();
