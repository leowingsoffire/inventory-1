import { prisma } from '@/lib/db';
import { generateId } from '@/lib/utils';

export interface Location {
  id: string; name: string; type: string; address: string | null;
  floor: string | null; room: string | null; rack: string | null;
  parentId: string | null; contactPerson: string | null; contactPhone: string | null;
  isActive: number; createdAt: string;
}
export interface AssetTransfer {
  id: string; assetId: string; fromLocationId: string | null; toLocationId: string;
  requestedBy: string | null; approvedBy: string | null;
  status: string; reason: string | null; notes: string | null;
  requestedAt: string; approvedAt: string | null; completedAt: string | null;
}

export async function ensureLocationTables(): Promise<void> {
  await prisma.$queryRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Location" (
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
    )
  `);
  await prisma.$queryRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "AssetTransfer" (
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
    )
  `);
}

export async function getLocations(): Promise<Location[]> {
  await ensureLocationTables();
  return prisma.$queryRawUnsafe<Location[]>(`SELECT * FROM "Location" WHERE "isActive" = 1 ORDER BY "name" ASC`);
}

export async function createLocation(data: { name: string; type: string; address?: string; floor?: string; room?: string; rack?: string; parentId?: string; contactPerson?: string; contactPhone?: string }): Promise<string> {
  await ensureLocationTables();
  const id = generateId();
  await prisma.$queryRawUnsafe(
    `INSERT INTO "Location" ("id","name","type","address","floor","room","rack","parentId","contactPerson","contactPhone","isActive","createdAt") VALUES (?,?,?,?,?,?,?,?,?,?,1,datetime('now'))`,
    id, data.name, data.type, data.address ?? null, data.floor ?? null, data.room ?? null, data.rack ?? null,
    data.parentId ?? null, data.contactPerson ?? null, data.contactPhone ?? null,
  );
  return id;
}

export async function updateLocation(id: string, data: Record<string, unknown>): Promise<void> {
  const allowedFields = ['name', 'type', 'address', 'floor', 'room', 'rack', 'parentId', 'contactPerson', 'contactPhone', 'isActive'];
  const sets: string[] = [];
  const params: unknown[] = [];
  for (const [key, val] of Object.entries(data)) {
    if (allowedFields.includes(key)) { sets.push(`"${key}" = ?`); params.push(val); }
  }
  if (sets.length === 0) return;
  params.push(id);
  await prisma.$queryRawUnsafe(`UPDATE "Location" SET ${sets.join(', ')} WHERE "id" = ?`, ...params);
}

export async function deleteLocation(id: string): Promise<void> {
  await ensureLocationTables();
  await prisma.$queryRawUnsafe(`UPDATE "Location" SET "isActive" = 0 WHERE "id" = ?`, id);
}

export async function getLocationPath(locationId: string): Promise<string> {
  await ensureLocationTables();
  const path: string[] = [];
  let currentId: string | null = locationId;
  let depth = 0;
  while (currentId && depth < 10) {
    const locs: Location[] = await prisma.$queryRawUnsafe<Location[]>(`SELECT * FROM "Location" WHERE "id" = ?`, currentId);
    if (locs.length === 0) break;
    path.unshift(locs[0].name);
    currentId = locs[0].parentId;
    depth++;
  }
  return path.join(' > ');
}

export async function getTransfers(options: { assetId?: string; status?: string; limit?: number; offset?: number } = {}): Promise<{ transfers: AssetTransfer[]; total: number }> {
  await ensureLocationTables();
  const { assetId, status, limit = 50, offset = 0 } = options;
  const conditions: string[] = [];
  const params: unknown[] = [];
  if (assetId) { conditions.push('"assetId" = ?'); params.push(assetId); }
  if (status) { conditions.push('"status" = ?'); params.push(status); }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const countResult = await prisma.$queryRawUnsafe<{ count: number }[]>(`SELECT COUNT(*) as count FROM "AssetTransfer" ${where}`, ...params);
  const total = Number(countResult[0]?.count ?? 0);
  const transfers = await prisma.$queryRawUnsafe<AssetTransfer[]>(`SELECT * FROM "AssetTransfer" ${where} ORDER BY "requestedAt" DESC LIMIT ? OFFSET ?`, ...params, limit, offset);
  return { transfers, total };
}

export async function createTransfer(data: { assetId: string; fromLocationId?: string; toLocationId: string; requestedBy?: string; reason?: string; notes?: string }): Promise<string> {
  await ensureLocationTables();
  const id = generateId();
  await prisma.$queryRawUnsafe(
    `INSERT INTO "AssetTransfer" ("id","assetId","fromLocationId","toLocationId","requestedBy","status","reason","notes","requestedAt") VALUES (?,?,?,?,?,'pending',?,?,datetime('now'))`,
    id, data.assetId, data.fromLocationId ?? null, data.toLocationId, data.requestedBy ?? null, data.reason ?? null, data.notes ?? null,
  );
  return id;
}

export async function processTransfer(id: string, action: 'approve' | 'reject' | 'complete', userId?: string): Promise<void> {
  await ensureLocationTables();
  if (action === 'approve') {
    await prisma.$queryRawUnsafe(`UPDATE "AssetTransfer" SET "status" = 'approved', "approvedBy" = ?, "approvedAt" = datetime('now') WHERE "id" = ?`, userId ?? null, id);
  } else if (action === 'reject') {
    await prisma.$queryRawUnsafe(`UPDATE "AssetTransfer" SET "status" = 'rejected', "approvedBy" = ?, "approvedAt" = datetime('now') WHERE "id" = ?`, userId ?? null, id);
  } else if (action === 'complete') {
    const transfer = (await prisma.$queryRawUnsafe<AssetTransfer[]>(`SELECT * FROM "AssetTransfer" WHERE "id" = ?`, id))[0];
    if (transfer) {
      await prisma.$queryRawUnsafe(`UPDATE "AssetTransfer" SET "status" = 'completed', "completedAt" = datetime('now') WHERE "id" = ?`, id);
      const loc = (await prisma.$queryRawUnsafe<Location[]>(`SELECT "name" FROM "Location" WHERE "id" = ?`, transfer.toLocationId))[0];
      if (loc) {
        await prisma.asset.update({ where: { id: transfer.assetId }, data: { location: loc.name } });
      }
    }
  }
}
