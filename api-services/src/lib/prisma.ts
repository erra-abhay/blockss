import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * Returns a Prisma client extension with the search_path set to the tenant's schema.
 * This ensures that any queries executed with this extended client will only operate
 * on the tenant's isolated data.
 */
export function getTenantPrisma(tenantSlug: string) {
  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          const [, result] = await prisma.$transaction([
            prisma.$executeRawUnsafe(`SET search_path TO "${tenantSlug}", public;`),
            query(args),
          ]);
          return result;
        },
      },
    },
  });
}

/**
 * Creates a PostgreSQL schema for the tenant and runs migrations to create tables.
 * Note: You would normally run a raw SQL dump or call Prisma Migrate programmatically.
 * Since Prisma Migrate programmatic API is private, we execute raw SQL for the tenant tables.
 */
export async function runMigrationForTenant(tenantSlug: string) {
  await prisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${tenantSlug}";`);
  
  // Create per-tenant tables
  const sql = `
    SET search_path TO "${tenantSlug}";

    CREATE TABLE IF NOT EXISTS "Certificate" (
        "id" TEXT NOT NULL,
        "recipientName" TEXT NOT NULL,
        "recipientEmail" TEXT NOT NULL,
        "courseName" TEXT NOT NULL,
        "issueDate" TIMESTAMP(3) NOT NULL,
        "expiryDate" TIMESTAMP(3),
        "certificateHash" TEXT NOT NULL,
        "txHash" TEXT,
        "blockNumber" BIGINT,
        "localPdfPath" TEXT,
        "status" public."CertStatus" NOT NULL DEFAULT 'PENDING',
        "metadata" JSONB,
        "templateId" TEXT,
        "batchId" TEXT,
        "issuedById" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id")
    );

    CREATE UNIQUE INDEX IF NOT EXISTS "Certificate_certificateHash_key" ON "Certificate"("certificateHash");

    CREATE TABLE IF NOT EXISTS "Template" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "htmlContent" TEXT NOT NULL,
        "thumbnailUrl" TEXT,
        "isDefault" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
    );

    CREATE TABLE IF NOT EXISTS "IssuanceBatch" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "status" public."BatchStatus" NOT NULL,
        "totalCount" INTEGER NOT NULL,
        "processed" INTEGER NOT NULL DEFAULT 0,
        "failed" INTEGER NOT NULL DEFAULT 0,
        "csvPath" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "completedAt" TIMESTAMP(3),

        CONSTRAINT "IssuanceBatch_pkey" PRIMARY KEY ("id")
    );
  `;

  // We split statements since Prisma $executeRawUnsafe might complain about multi-statements depending on driver
  // Let's do it safely in a transaction
  await prisma.$transaction([
    prisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${tenantSlug}";`),
    prisma.$executeRawUnsafe(`SET search_path TO "${tenantSlug}";`),
    prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Certificate" (
          "id" TEXT NOT NULL,
          "recipientName" TEXT NOT NULL,
          "recipientEmail" TEXT NOT NULL,
          "courseName" TEXT NOT NULL,
          "issueDate" TIMESTAMP(3) NOT NULL,
          "expiryDate" TIMESTAMP(3),
          "certificateHash" TEXT NOT NULL,
          "txHash" TEXT,
          "blockNumber" BIGINT,
          "localPdfPath" TEXT,
          "status" public."CertStatus" NOT NULL DEFAULT 'PENDING',
          "metadata" JSONB,
          "templateId" TEXT,
          "batchId" TEXT,
          "issuedById" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL,
          CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id")
      );
    `),
    prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "Certificate_certificateHash_key" ON "Certificate"("certificateHash");`),
    prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Template" (
          "id" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "htmlContent" TEXT NOT NULL,
          "thumbnailUrl" TEXT,
          "isDefault" BOOLEAN NOT NULL DEFAULT false,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
      );
    `),
    prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "IssuanceBatch" (
          "id" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "status" public."BatchStatus" NOT NULL,
          "totalCount" INTEGER NOT NULL,
          "processed" INTEGER NOT NULL DEFAULT 0,
          "failed" INTEGER NOT NULL DEFAULT 0,
          "csvPath" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "completedAt" TIMESTAMP(3),
          CONSTRAINT "IssuanceBatch_pkey" PRIMARY KEY ("id")
      );
    `)
  ]);
}
