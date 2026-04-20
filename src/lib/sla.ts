import { prisma } from '@/lib/db';
import { generateId } from '@/lib/utils';

export interface SLAPolicy {
  id: string;
  name: string;
  priority: string;
  responseTimeMinutes: number;
  resolutionTimeMinutes: number;
  escalationAfterMinutes: number;
  notifyOnBreach: number;
  createdAt: string;
}

export interface SLAStatus {
  status: 'on-track' | 'at-risk' | 'breached';
  responseBreached: boolean;
  resolutionBreached: boolean;
  responseTimeLeftMinutes: number;
  resolutionTimeLeftMinutes: number;
  responsePercent: number;
  resolutionPercent: number;
}

const DEFAULT_POLICIES = [
  { name: 'Critical', priority: 'critical', responseTimeMinutes: 15, resolutionTimeMinutes: 240, escalationAfterMinutes: 120 },
  { name: 'High', priority: 'high', responseTimeMinutes: 60, resolutionTimeMinutes: 480, escalationAfterMinutes: 300 },
  { name: 'Medium', priority: 'medium', responseTimeMinutes: 240, resolutionTimeMinutes: 1440, escalationAfterMinutes: 720 },
  { name: 'Low', priority: 'low', responseTimeMinutes: 1440, resolutionTimeMinutes: 4320, escalationAfterMinutes: 2880 },
];

export async function ensureSLAPoliciesTable(): Promise<void> {
  await prisma.$queryRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "SLAPolicy" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "name" TEXT NOT NULL,
      "priority" TEXT NOT NULL UNIQUE,
      "responseTimeMinutes" INTEGER NOT NULL,
      "resolutionTimeMinutes" INTEGER NOT NULL,
      "escalationAfterMinutes" INTEGER NOT NULL,
      "notifyOnBreach" INTEGER NOT NULL DEFAULT 1,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  const count = await prisma.$queryRawUnsafe<{ count: number }[]>(`SELECT COUNT(*) as count FROM "SLAPolicy"`);
  if (Number(count[0]?.count ?? 0) === 0) {
    for (const p of DEFAULT_POLICIES) {
      await prisma.$queryRawUnsafe(
        `INSERT INTO "SLAPolicy" ("id","name","priority","responseTimeMinutes","resolutionTimeMinutes","escalationAfterMinutes","notifyOnBreach","createdAt") VALUES (?,?,?,?,?,?,1,datetime('now'))`,
        generateId(), p.name, p.priority, p.responseTimeMinutes, p.resolutionTimeMinutes, p.escalationAfterMinutes,
      );
    }
  }
}

export async function getSLAPolicies(): Promise<SLAPolicy[]> {
  await ensureSLAPoliciesTable();
  return prisma.$queryRawUnsafe<SLAPolicy[]>(`SELECT * FROM "SLAPolicy" ORDER BY "responseTimeMinutes" ASC`);
}

export async function getSLAPolicy(priority: string): Promise<SLAPolicy | null> {
  await ensureSLAPoliciesTable();
  const results = await prisma.$queryRawUnsafe<SLAPolicy[]>(`SELECT * FROM "SLAPolicy" WHERE "priority" = ?`, priority);
  return results[0] ?? null;
}

export async function updateSLAPolicy(id: string, data: { responseTimeMinutes?: number; resolutionTimeMinutes?: number; escalationAfterMinutes?: number }): Promise<void> {
  const sets: string[] = [];
  const params: unknown[] = [];
  if (data.responseTimeMinutes !== undefined) { sets.push('"responseTimeMinutes" = ?'); params.push(data.responseTimeMinutes); }
  if (data.resolutionTimeMinutes !== undefined) { sets.push('"resolutionTimeMinutes" = ?'); params.push(data.resolutionTimeMinutes); }
  if (data.escalationAfterMinutes !== undefined) { sets.push('"escalationAfterMinutes" = ?'); params.push(data.escalationAfterMinutes); }
  if (sets.length === 0) return;
  params.push(id);
  await prisma.$queryRawUnsafe(`UPDATE "SLAPolicy" SET ${sets.join(', ')} WHERE "id" = ?`, ...params);
}

export function calculateSLAStatus(ticket: { priority: string; createdAt: string; status: string; resolvedAt?: string | null }, policy: SLAPolicy): SLAStatus {
  const created = new Date(ticket.createdAt).getTime();
  const now = ticket.resolvedAt ? new Date(ticket.resolvedAt).getTime() : Date.now();
  const elapsed = (now - created) / 60000;

  const responseTimeLeft = policy.responseTimeMinutes - elapsed;
  const resolutionTimeLeft = policy.resolutionTimeMinutes - elapsed;
  const responseBreached = responseTimeLeft <= 0;
  const resolutionBreached = resolutionTimeLeft <= 0;
  const responsePercent = Math.min(100, Math.max(0, (elapsed / policy.responseTimeMinutes) * 100));
  const resolutionPercent = Math.min(100, Math.max(0, (elapsed / policy.resolutionTimeMinutes) * 100));

  let status: SLAStatus['status'] = 'on-track';
  if (resolutionBreached || responseBreached) status = 'breached';
  else if (resolutionPercent >= 75) status = 'at-risk';

  return { status, responseBreached, resolutionBreached, responseTimeLeftMinutes: responseTimeLeft, resolutionTimeLeftMinutes: resolutionTimeLeft, responsePercent, resolutionPercent };
}
