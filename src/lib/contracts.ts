import { prisma } from '@/lib/db';
import { generateId } from '@/lib/utils';

export interface Contract {
  id: string;
  contractNumber: string;
  type: string;
  vendorId: string | null;
  customerId: string | null;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  renewalDate: string | null;
  autoRenew: number;
  value: number;
  currency: string;
  billingCycle: string;
  status: string;
  totalSeats: number | null;
  usedSeats: number | null;
  contactPerson: string | null;
  contactEmail: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function ensureContractTable(): Promise<void> {
  await prisma.$queryRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Contract" (
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
    )
  `);
}

export async function getContracts(options: {
  type?: string; status?: string; search?: string; limit?: number; offset?: number;
} = {}): Promise<{ contracts: Contract[]; total: number }> {
  await ensureContractTable();
  const { type, status, search, limit = 100, offset = 0 } = options;
  const conditions: string[] = [];
  const params: unknown[] = [];
  if (type) { conditions.push('"type" = ?'); params.push(type); }
  if (status) { conditions.push('"status" = ?'); params.push(status); }
  if (search) { conditions.push('("title" LIKE ? OR "contractNumber" LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const countResult = await prisma.$queryRawUnsafe<{ count: number }[]>(`SELECT COUNT(*) as count FROM "Contract" ${where}`, ...params);
  const total = Number(countResult[0]?.count ?? 0);
  const contracts = await prisma.$queryRawUnsafe<Contract[]>(`SELECT * FROM "Contract" ${where} ORDER BY "endDate" ASC LIMIT ? OFFSET ?`, ...params, limit, offset);
  return { contracts, total };
}

export async function getContract(id: string): Promise<Contract | null> {
  await ensureContractTable();
  const results = await prisma.$queryRawUnsafe<Contract[]>(`SELECT * FROM "Contract" WHERE "id" = ?`, id);
  return results[0] ?? null;
}

export async function createContract(data: {
  type: string; title: string; description?: string; startDate: string; endDate: string;
  renewalDate?: string; autoRenew?: boolean; value: number; currency?: string; billingCycle: string;
  totalSeats?: number; usedSeats?: number; contactPerson?: string; contactEmail?: string;
  vendorId?: string; customerId?: string; notes?: string;
}): Promise<string> {
  await ensureContractTable();
  const id = generateId();
  const countResult = await prisma.$queryRawUnsafe<{ count: number }[]>(`SELECT COUNT(*) as count FROM "Contract"`);
  const num = Number(countResult[0]?.count ?? 0) + 1;
  const contractNumber = `CTR${String(num).padStart(7, '0')}`;
  await prisma.$queryRawUnsafe(
    `INSERT INTO "Contract" ("id","contractNumber","type","vendorId","customerId","title","description","startDate","endDate","renewalDate","autoRenew","value","currency","billingCycle","status","totalSeats","usedSeats","contactPerson","contactEmail","notes","createdAt","updatedAt")
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'),datetime('now'))`,
    id, contractNumber, data.type, data.vendorId ?? null, data.customerId ?? null, data.title, data.description ?? null,
    data.startDate, data.endDate, data.renewalDate ?? null, data.autoRenew ? 1 : 0, data.value,
    data.currency ?? 'SGD', data.billingCycle, 'active', data.totalSeats ?? null, data.usedSeats ?? null,
    data.contactPerson ?? null, data.contactEmail ?? null, data.notes ?? null,
  );
  return id;
}

export async function updateContract(id: string, data: Record<string, unknown>): Promise<void> {
  const allowedFields = ['type', 'title', 'description', 'startDate', 'endDate', 'renewalDate', 'autoRenew', 'value', 'currency', 'billingCycle', 'status', 'totalSeats', 'usedSeats', 'contactPerson', 'contactEmail', 'vendorId', 'customerId', 'notes'];
  const sets: string[] = ['"updatedAt" = datetime(\'now\')'];
  const params: unknown[] = [];
  for (const [key, val] of Object.entries(data)) {
    if (allowedFields.includes(key)) { sets.push(`"${key}" = ?`); params.push(val); }
  }
  params.push(id);
  await prisma.$queryRawUnsafe(`UPDATE "Contract" SET ${sets.join(', ')} WHERE "id" = ?`, ...params);
}

export async function deleteContract(id: string): Promise<void> {
  await ensureContractTable();
  await prisma.$queryRawUnsafe(`DELETE FROM "Contract" WHERE "id" = ?`, id);
}

export async function getExpiringContracts(daysAhead: number = 30): Promise<Contract[]> {
  await ensureContractTable();
  return prisma.$queryRawUnsafe<Contract[]>(
    `SELECT * FROM "Contract" WHERE "status" = 'active' AND "endDate" <= datetime('now', '+' || ? || ' days') ORDER BY "endDate" ASC`, daysAhead,
  );
}

export async function getLicenseUtilization(): Promise<{ id: string; title: string; totalSeats: number; usedSeats: number; utilization: number }[]> {
  await ensureContractTable();
  const contracts = await prisma.$queryRawUnsafe<Contract[]>(
    `SELECT * FROM "Contract" WHERE "type" = 'license' AND "totalSeats" IS NOT NULL AND "totalSeats" > 0 AND "status" = 'active'`,
  );
  return contracts.map((c) => ({
    id: c.id, title: c.title, totalSeats: c.totalSeats!, usedSeats: c.usedSeats ?? 0,
    utilization: Math.round(((c.usedSeats ?? 0) / c.totalSeats!) * 100),
  }));
}
