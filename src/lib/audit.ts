import { prisma } from '@/lib/db';
import { generateId } from '@/lib/utils';

export interface AuditEntry {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  fieldName: string | null;
  oldValue: string | null;
  newValue: string | null;
  userId: string | null;
  userName: string | null;
  createdAt: string;
}

export async function ensureAuditTable(): Promise<void> {
  await prisma.$queryRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "AuditEntry" (
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
    )
  `);
}

export function diffObjects(oldObj: Record<string, unknown>, newObj: Record<string, unknown>): { field: string; oldValue: string; newValue: string }[] {
  const changes: { field: string; oldValue: string; newValue: string }[] = [];
  for (const key of Object.keys(newObj)) {
    const oldVal = String(oldObj[key] ?? '');
    const newVal = String(newObj[key] ?? '');
    if (oldVal !== newVal && key !== 'updatedAt') {
      changes.push({ field: key, oldValue: oldVal, newValue: newVal });
    }
  }
  return changes;
}

export async function logAuditTrail(entityType: string, entityId: string, action: string, changes: { field: string; oldValue: string; newValue: string }[], userId?: string, userName?: string): Promise<void> {
  await ensureAuditTable();
  for (const change of changes) {
    await prisma.$queryRawUnsafe(
      `INSERT INTO "AuditEntry" ("id","entityType","entityId","action","fieldName","oldValue","newValue","userId","userName","createdAt")
       VALUES (?,?,?,?,?,?,?,?,?,datetime('now'))`,
      generateId(), entityType, entityId, action, change.field, change.oldValue, change.newValue, userId ?? null, userName ?? null,
    );
  }
}

export async function getAuditEntries(options: {
  entityType?: string; entityId?: string; userId?: string; action?: string;
  from?: string; to?: string; limit?: number; offset?: number;
} = {}): Promise<{ entries: AuditEntry[]; total: number }> {
  await ensureAuditTable();
  const { entityType, entityId, userId, action, from, to, limit = 50, offset = 0 } = options;
  const conditions: string[] = [];
  const params: unknown[] = [];
  if (entityType) { conditions.push('"entityType" = ?'); params.push(entityType); }
  if (entityId) { conditions.push('"entityId" = ?'); params.push(entityId); }
  if (userId) { conditions.push('"userId" = ?'); params.push(userId); }
  if (action) { conditions.push('"action" = ?'); params.push(action); }
  if (from) { conditions.push('"createdAt" >= ?'); params.push(from); }
  if (to) { conditions.push('"createdAt" <= ?'); params.push(to); }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const countResult = await prisma.$queryRawUnsafe<{ count: number }[]>(`SELECT COUNT(*) as count FROM "AuditEntry" ${where}`, ...params);
  const total = Number(countResult[0]?.count ?? 0);
  const entries = await prisma.$queryRawUnsafe<AuditEntry[]>(`SELECT * FROM "AuditEntry" ${where} ORDER BY "createdAt" DESC LIMIT ? OFFSET ?`, ...params, limit, offset);
  return { entries, total };
}
