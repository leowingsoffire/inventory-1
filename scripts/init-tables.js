// Build-time script to create all raw SQL tables in dev.db
// This ensures tables exist before deployment to Vercel
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: { db: { url: `file:${require('path').join(__dirname, '..', 'prisma', 'dev.db')}` } },
});

const TABLES = [
  `CREATE TABLE IF NOT EXISTS "ApprovalRequest" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'purchase',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "requesterId" TEXT NOT NULL,
    "amount" REAL,
    "entityId" TEXT,
    "entityType" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "currentLevel" INTEGER NOT NULL DEFAULT 1,
    "totalLevels" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "ApprovalStep" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "requestId" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "approverId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "comment" TEXT,
    "signature" TEXT,
    "decidedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "ScheduledTask" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'preventive',
    "assetId" TEXT,
    "assignedTo" TEXT,
    "frequency" TEXT NOT NULL DEFAULT 'monthly',
    "dayOfWeek" INTEGER,
    "dayOfMonth" INTEGER,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "lastRunAt" DATETIME,
    "nextRunAt" DATETIME NOT NULL,
    "isActive" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "SLAPolicy" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "name" TEXT NOT NULL,
    "priority" TEXT NOT NULL UNIQUE,
    "responseTimeMinutes" INTEGER NOT NULL,
    "resolutionTimeMinutes" INTEGER NOT NULL,
    "escalationAfterMinutes" INTEGER NOT NULL,
    "notifyOnBreach" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "Contract" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "contractNumber" TEXT NOT NULL UNIQUE,
    "type" TEXT NOT NULL DEFAULT 'license',
    "vendorId" TEXT,
    "customerId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "renewalDate" DATETIME,
    "autoRenew" INTEGER NOT NULL DEFAULT 0,
    "value" REAL NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'SGD',
    "billingCycle" TEXT NOT NULL DEFAULT 'annually',
    "status" TEXT NOT NULL DEFAULT 'active',
    "totalSeats" INTEGER,
    "usedSeats" INTEGER,
    "contactPerson" TEXT,
    "contactEmail" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "AssetHandover" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "assetId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'check-out',
    "fromEmployeeId" TEXT,
    "toEmployeeId" TEXT NOT NULL,
    "handoverDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "signature" TEXT,
    "condition" TEXT NOT NULL DEFAULT 'good',
    "accessories" TEXT NOT NULL DEFAULT '[]',
    "notes" TEXT,
    "handoverBy" TEXT,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "AuditEntry" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL DEFAULT 'update',
    "fieldName" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "userId" TEXT,
    "userName" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "EmailLog" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "to" TEXT NOT NULL,
    "cc" TEXT,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "templateId" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "sentAt" DATETIME,
    "error" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "FormTemplate" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'custom',
    "fields" TEXT NOT NULL DEFAULT '[]',
    "isActive" INTEGER NOT NULL DEFAULT 1,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "FormSubmission" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "formId" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "responses" TEXT NOT NULL DEFAULT '{}',
    "completionPercent" INTEGER NOT NULL DEFAULT 0,
    "submittedBy" TEXT,
    "status" TEXT NOT NULL DEFAULT 'in-progress',
    "reviewedBy" TEXT,
    "reviewNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "Location" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'office',
    "address" TEXT,
    "floor" TEXT,
    "room" TEXT,
    "rack" TEXT,
    "parentId" TEXT,
    "contactPerson" TEXT,
    "contactPhone" TEXT,
    "isActive" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "AssetTransfer" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "assetId" TEXT NOT NULL,
    "fromLocationId" TEXT,
    "toLocationId" TEXT NOT NULL,
    "requestedBy" TEXT,
    "approvedBy" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reason" TEXT,
    "notes" TEXT,
    "requestedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" DATETIME,
    "completedAt" DATETIME
  )`,
  `CREATE TABLE IF NOT EXISTS "KBArticle" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL UNIQUE,
    "content" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT 'general',
    "tags" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'published',
    "authorId" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "AutomationRule" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "trigger" TEXT NOT NULL,
    "conditions" TEXT NOT NULL DEFAULT '[]',
    "actions" TEXT NOT NULL DEFAULT '[]',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" INTEGER NOT NULL DEFAULT 1,
    "requiresApproval" INTEGER NOT NULL DEFAULT 0,
    "autoApproveBelow" REAL,
    "createdBy" TEXT,
    "executionCount" INTEGER NOT NULL DEFAULT 0,
    "lastExecutedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "AutomationLog" (
    "id" TEXT PRIMARY KEY NOT NULL,
    "ruleId" TEXT NOT NULL,
    "ruleName" TEXT NOT NULL,
    "trigger" TEXT NOT NULL,
    "entityId" TEXT,
    "entityType" TEXT,
    "action" TEXT NOT NULL,
    "result" TEXT NOT NULL DEFAULT 'success',
    "details" TEXT,
    "executedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
];

async function main() {
  console.log('Initializing raw SQL tables in dev.db...');
  let created = 0;
  for (const sql of TABLES) {
    try {
      await prisma.$queryRawUnsafe(sql);
      created++;
      const match = sql.match(/"(\w+)"/);
      console.log(`  ✓ ${match ? match[1] : 'table'}`);
    } catch (e) {
      console.error(`  ✗ Failed:`, e.message);
    }
  }
  console.log(`Done: ${created}/${TABLES.length} tables ready.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
