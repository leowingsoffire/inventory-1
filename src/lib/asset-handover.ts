import { prisma } from '@/lib/db';

export interface AssetHandover {
  id: string;
  assetId: string;
  type: string;
  fromEmployeeId: string | null;
  toEmployeeId: string;
  handoverDate: string;
  signature: string | null;
  condition: string;
  accessories: string;
  notes: string | null;
  handoverBy: string | null;
  status: string;
  createdAt: string;
}

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function ensureAssetHandoverTable(): Promise<void> {
  await prisma.$queryRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "AssetHandover" (
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
    )
  `);
}

export async function getHandovers(options: { assetId?: string; employeeId?: string; limit?: number; offset?: number } = {}): Promise<{ handovers: AssetHandover[]; total: number }> {
  await ensureAssetHandoverTable();
  const { assetId, employeeId, limit = 50, offset = 0 } = options;
  const conditions: string[] = [];
  const params: unknown[] = [];
  if (assetId) { conditions.push('"assetId" = ?'); params.push(assetId); }
  if (employeeId) { conditions.push('("fromEmployeeId" = ? OR "toEmployeeId" = ?)'); params.push(employeeId, employeeId); }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const countResult = await prisma.$queryRawUnsafe<{ count: number }[]>(`SELECT COUNT(*) as count FROM "AssetHandover" ${where}`, ...params);
  const total = Number(countResult[0]?.count ?? 0);
  const handovers = await prisma.$queryRawUnsafe<AssetHandover[]>(`SELECT * FROM "AssetHandover" ${where} ORDER BY "createdAt" DESC LIMIT ? OFFSET ?`, ...params, limit, offset);
  return { handovers, total };
}

export async function createHandover(data: {
  assetId: string; type: string; fromEmployeeId?: string; toEmployeeId: string;
  signature?: string; condition: string; accessories?: string[]; notes?: string; handoverBy?: string;
}): Promise<string> {
  await ensureAssetHandoverTable();
  const id = generateId();
  await prisma.$queryRawUnsafe(
    `INSERT INTO "AssetHandover" ("id","assetId","type","fromEmployeeId","toEmployeeId","handoverDate","signature","condition","accessories","notes","handoverBy","status","createdAt")
     VALUES (?,?,?,?,?,datetime('now'),?,?,?,?,?,'completed',datetime('now'))`,
    id, data.assetId, data.type, data.fromEmployeeId ?? null, data.toEmployeeId,
    data.signature ?? null, data.condition, JSON.stringify(data.accessories ?? []),
    data.notes ?? null, data.handoverBy ?? null,
  );
  return id;
}
