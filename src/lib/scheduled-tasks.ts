import { prisma } from '@/lib/db';

export interface ScheduledTask {
  id: string;
  title: string;
  description: string | null;
  type: string;
  assetId: string | null;
  assignedTo: string | null;
  frequency: string;
  dayOfWeek: number | null;
  dayOfMonth: number | null;
  priority: string;
  lastRunAt: string | null;
  nextRunAt: string;
  isActive: number;
  createdAt: string;
}

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function ensureScheduledTaskTable(): Promise<void> {
  await prisma.$queryRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "ScheduledTask" (
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
    )
  `);
}

export function calculateNextRun(frequency: string, dayOfWeek?: number | null, dayOfMonth?: number | null, fromDate?: Date): string {
  const d = fromDate ? new Date(fromDate) : new Date();
  switch (frequency) {
    case 'daily': d.setDate(d.getDate() + 1); break;
    case 'weekly': {
      d.setDate(d.getDate() + 7);
      if (dayOfWeek != null) { const diff = ((dayOfWeek - d.getDay()) + 7) % 7; d.setDate(d.getDate() + (diff || 7)); }
      break;
    }
    case 'biweekly': d.setDate(d.getDate() + 14); break;
    case 'monthly': {
      d.setMonth(d.getMonth() + 1);
      if (dayOfMonth != null) d.setDate(Math.min(dayOfMonth, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()));
      break;
    }
    case 'quarterly': d.setMonth(d.getMonth() + 3); break;
    case 'yearly': d.setFullYear(d.getFullYear() + 1); break;
  }
  return d.toISOString();
}

export async function getScheduledTasks(options: { activeOnly?: boolean; limit?: number; offset?: number } = {}): Promise<{ tasks: ScheduledTask[]; total: number }> {
  await ensureScheduledTaskTable();
  const { activeOnly = false, limit = 100, offset = 0 } = options;
  const where = activeOnly ? 'WHERE "isActive" = 1' : '';
  const countResult = await prisma.$queryRawUnsafe<{ count: number }[]>(`SELECT COUNT(*) as count FROM "ScheduledTask" ${where}`);
  const total = Number(countResult[0]?.count ?? 0);
  const tasks = await prisma.$queryRawUnsafe<ScheduledTask[]>(
    `SELECT * FROM "ScheduledTask" ${where} ORDER BY "nextRunAt" ASC LIMIT ? OFFSET ?`, limit, offset,
  );
  return { tasks, total };
}

export async function getOverdueTasks(): Promise<ScheduledTask[]> {
  await ensureScheduledTaskTable();
  return prisma.$queryRawUnsafe<ScheduledTask[]>(
    `SELECT * FROM "ScheduledTask" WHERE "isActive" = 1 AND "nextRunAt" <= datetime('now') ORDER BY "nextRunAt" ASC`,
  );
}

export async function createScheduledTask(data: {
  title: string; description?: string; type: string; assetId?: string; assignedTo?: string;
  frequency: string; dayOfWeek?: number; dayOfMonth?: number; priority?: string;
}): Promise<string> {
  await ensureScheduledTaskTable();
  const id = generateId();
  const nextRun = calculateNextRun(data.frequency, data.dayOfWeek, data.dayOfMonth);
  await prisma.$queryRawUnsafe(
    `INSERT INTO "ScheduledTask" ("id","title","description","type","assetId","assignedTo","frequency","dayOfWeek","dayOfMonth","priority","nextRunAt","isActive","createdAt")
     VALUES (?,?,?,?,?,?,?,?,?,?,?,1,datetime('now'))`,
    id, data.title, data.description ?? null, data.type, data.assetId ?? null, data.assignedTo ?? null,
    data.frequency, data.dayOfWeek ?? null, data.dayOfMonth ?? null, data.priority ?? 'medium', nextRun,
  );
  return id;
}

export async function updateScheduledTask(id: string, data: Record<string, unknown>): Promise<void> {
  const allowedFields = ['title', 'description', 'type', 'assetId', 'assignedTo', 'frequency', 'dayOfWeek', 'dayOfMonth', 'priority', 'isActive', 'nextRunAt'];
  const sets: string[] = [];
  const params: unknown[] = [];
  for (const [key, val] of Object.entries(data)) {
    if (allowedFields.includes(key)) { sets.push(`"${key}" = ?`); params.push(val); }
  }
  if (sets.length === 0) return;
  params.push(id);
  await prisma.$queryRawUnsafe(`UPDATE "ScheduledTask" SET ${sets.join(', ')} WHERE "id" = ?`, ...params);
}

export async function deleteScheduledTask(id: string): Promise<void> {
  await ensureScheduledTaskTable();
  await prisma.$queryRawUnsafe(`DELETE FROM "ScheduledTask" WHERE "id" = ?`, id);
}

export async function generateTicketFromTask(task: ScheduledTask): Promise<string> {
  const ticketId = generateId();
  await prisma.maintenance.create({
    data: {
      id: ticketId,
      title: `[Scheduled] ${task.title}`,
      description: task.description ?? `Auto-generated from scheduled task: ${task.title}`,
      type: task.type === 'preventive' ? 'inspection' : task.type,
      priority: task.priority,
      status: 'open',
      assetId: task.assetId ?? '',
      assignedTo: task.assignedTo,
    },
  });
  const nextRun = calculateNextRun(task.frequency, task.dayOfWeek, task.dayOfMonth);
  await prisma.$queryRawUnsafe(
    `UPDATE "ScheduledTask" SET "lastRunAt" = datetime('now'), "nextRunAt" = ? WHERE "id" = ?`,
    nextRun, task.id,
  );
  return ticketId;
}
