import { prisma } from '@/lib/db';
import { createNotification, createNotificationForAllAdmins } from '@/lib/notifications';

export interface ApprovalRequest {
  id: string; type: string; title: string; description: string | null; requesterId: string;
  amount: number | null; entityId: string | null; entityType: string | null;
  status: string; currentLevel: number; totalLevels: number; createdAt: string; updatedAt: string;
}
export interface ApprovalStep {
  id: string; requestId: string; level: number; approverId: string; status: string;
  comment: string | null; signature: string | null; decidedAt: string | null; createdAt: string;
}

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function ensureApprovalTables(): Promise<void> {
  await prisma.$queryRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "ApprovalRequest" (
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
    )
  `);
  await prisma.$queryRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "ApprovalStep" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "requestId" TEXT NOT NULL,
      "level" INTEGER NOT NULL DEFAULT 1,
      "approverId" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'pending',
      "comment" TEXT,
      "signature" TEXT,
      "decidedAt" DATETIME,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

export async function getApprovalRequests(options: { requesterId?: string; approverId?: string; status?: string; limit?: number; offset?: number } = {}): Promise<{ requests: ApprovalRequest[]; total: number }> {
  await ensureApprovalTables();
  const { requesterId, approverId, status, limit = 50, offset = 0 } = options;
  let query = `SELECT DISTINCT r.* FROM "ApprovalRequest" r`;
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (approverId) {
    query += ` JOIN "ApprovalStep" s ON s."requestId" = r."id"`;
    conditions.push(`s."approverId" = ?`);
    params.push(approverId);
  }
  if (requesterId) { conditions.push(`r."requesterId" = ?`); params.push(requesterId); }
  if (status) { conditions.push(`r."status" = ?`); params.push(status); }
  const where = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '';
  const countResult = await prisma.$queryRawUnsafe<{ count: number }[]>(`SELECT COUNT(*) as count FROM (${query}${where})`, ...params);
  const total = Number(countResult[0]?.count ?? 0);
  const requests = await prisma.$queryRawUnsafe<ApprovalRequest[]>(`${query}${where} ORDER BY r."createdAt" DESC LIMIT ? OFFSET ?`, ...params, limit, offset);
  return { requests, total };
}

export async function getApprovalSteps(requestId: string): Promise<ApprovalStep[]> {
  await ensureApprovalTables();
  return prisma.$queryRawUnsafe<ApprovalStep[]>(`SELECT * FROM "ApprovalStep" WHERE "requestId" = ? ORDER BY "level" ASC`, requestId);
}

function getApprovalLevels(amount: number | null): number {
  if (!amount || amount < 500) return 1;
  if (amount < 5000) return 2;
  return 3;
}

export async function createApprovalRequest(data: {
  type: string; title: string; description?: string; requesterId: string; amount?: number;
  entityId?: string; entityType?: string; approverIds: string[];
}): Promise<string> {
  await ensureApprovalTables();
  const id = generateId();
  const totalLevels = data.type === 'purchase' ? getApprovalLevels(data.amount ?? null) : Math.min(data.approverIds.length, 3);
  await prisma.$queryRawUnsafe(
    `INSERT INTO "ApprovalRequest" ("id","type","title","description","requesterId","amount","entityId","entityType","status","currentLevel","totalLevels","createdAt","updatedAt")
     VALUES (?,?,?,?,?,?,?,?,'pending',1,?,datetime('now'),datetime('now'))`,
    id, data.type, data.title, data.description ?? null, data.requesterId, data.amount ?? null,
    data.entityId ?? null, data.entityType ?? null, totalLevels,
  );
  for (let i = 0; i < Math.min(data.approverIds.length, totalLevels); i++) {
    await prisma.$queryRawUnsafe(
      `INSERT INTO "ApprovalStep" ("id","requestId","level","approverId","status","createdAt") VALUES (?,?,?,?,'pending',datetime('now'))`,
      generateId(), id, i + 1, data.approverIds[i],
    );
  }
  try {
    const firstApprover = data.approverIds[0];
    if (firstApprover) await createNotification(firstApprover, 'approval-needed', `Approval Required: ${data.title}`, `${data.type} request needs your approval`, '/approvals');
  } catch { /* non-critical */ }
  return id;
}

export async function processApproval(stepId: string, approved: boolean, comment?: string, signature?: string): Promise<void> {
  await ensureApprovalTables();
  await prisma.$queryRawUnsafe(
    `UPDATE "ApprovalStep" SET "status" = ?, "comment" = ?, "signature" = ?, "decidedAt" = datetime('now') WHERE "id" = ?`,
    approved ? 'approved' : 'rejected', comment ?? null, signature ?? null, stepId,
  );
  const step = (await prisma.$queryRawUnsafe<ApprovalStep[]>(`SELECT * FROM "ApprovalStep" WHERE "id" = ?`, stepId))[0];
  if (!step) return;
  const request = (await prisma.$queryRawUnsafe<ApprovalRequest[]>(`SELECT * FROM "ApprovalRequest" WHERE "id" = ?`, step.requestId))[0];
  if (!request) return;

  if (!approved) {
    await prisma.$queryRawUnsafe(`UPDATE "ApprovalRequest" SET "status" = 'rejected', "updatedAt" = datetime('now') WHERE "id" = ?`, request.id);
    try { await createNotification(request.requesterId, 'change-rejected', `Request Rejected: ${request.title}`, comment ?? 'Your request was rejected', '/approvals'); } catch { /* */ }
  } else if (step.level >= request.totalLevels) {
    await prisma.$queryRawUnsafe(`UPDATE "ApprovalRequest" SET "status" = 'approved', "currentLevel" = ?, "updatedAt" = datetime('now') WHERE "id" = ?`, step.level, request.id);
    try { await createNotification(request.requesterId, 'change-approved', `Request Approved: ${request.title}`, 'Your request has been fully approved', '/approvals'); } catch { /* */ }
  } else {
    await prisma.$queryRawUnsafe(`UPDATE "ApprovalRequest" SET "currentLevel" = ?, "updatedAt" = datetime('now') WHERE "id" = ?`, step.level + 1, request.id);
    const nextStep = (await prisma.$queryRawUnsafe<ApprovalStep[]>(`SELECT * FROM "ApprovalStep" WHERE "requestId" = ? AND "level" = ?`, request.id, step.level + 1))[0];
    if (nextStep) { try { await createNotification(nextStep.approverId, 'approval-needed', `Approval Required: ${request.title}`, `Level ${step.level + 1} approval needed`, '/approvals'); } catch { /* */ } }
  }
}

export async function getPendingApprovalsCount(userId: string): Promise<number> {
  await ensureApprovalTables();
  const result = await prisma.$queryRawUnsafe<{ count: number }[]>(
    `SELECT COUNT(*) as count FROM "ApprovalStep" s JOIN "ApprovalRequest" r ON r."id" = s."requestId" WHERE s."approverId" = ? AND s."status" = 'pending' AND s."level" = r."currentLevel"`,
    userId,
  );
  return Number(result[0]?.count ?? 0);
}
