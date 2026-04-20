import { prisma } from '@/lib/db';

export interface EmailLog {
  id: string;
  to: string;
  cc: string | null;
  subject: string;
  body: string;
  templateId: string | null;
  entityType: string | null;
  entityId: string | null;
  status: string;
  sentAt: string | null;
  error: string | null;
  createdAt: string;
}

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function ensureEmailLogTable(): Promise<void> {
  await prisma.$queryRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "EmailLog" (
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
    )
  `);
}

export async function sendEmail(data: {
  to: string; cc?: string; subject: string; body: string;
  templateId?: string; entityType?: string; entityId?: string;
}): Promise<string> {
  await ensureEmailLogTable();
  const id = generateId();
  // Stub: logs to DB only — connect SMTP/SendGrid via SystemConfig later
  await prisma.$queryRawUnsafe(
    `INSERT INTO "EmailLog" ("id","to","cc","subject","body","templateId","entityType","entityId","status","sentAt","createdAt")
     VALUES (?,?,?,?,?,?,?,?,'sent',datetime('now'),datetime('now'))`,
    id, data.to, data.cc ?? null, data.subject, data.body,
    data.templateId ?? null, data.entityType ?? null, data.entityId ?? null,
  );
  return id;
}

export async function renderTemplate(templateName: string, variables: Record<string, string>): Promise<{ subject: string; body: string } | null> {
  try {
    const templates = await prisma.emailTemplate.findMany({ where: { name: templateName, isActive: true }, take: 1 });
    if (templates.length === 0) return null;
    const tmpl = templates[0];
    let subject = tmpl.subject;
    let body = tmpl.body;
    for (const [key, val] of Object.entries(variables)) {
      const re = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      subject = subject.replace(re, val);
      body = body.replace(re, val);
    }
    return { subject, body };
  } catch { return null; }
}

export async function getEmailLogs(options: {
  entityType?: string; entityId?: string; status?: string; search?: string;
  limit?: number; offset?: number;
} = {}): Promise<{ emails: EmailLog[]; total: number }> {
  await ensureEmailLogTable();
  const { entityType, entityId, status, search, limit = 50, offset = 0 } = options;
  const conditions: string[] = [];
  const params: unknown[] = [];
  if (entityType) { conditions.push('"entityType" = ?'); params.push(entityType); }
  if (entityId) { conditions.push('"entityId" = ?'); params.push(entityId); }
  if (status) { conditions.push('"status" = ?'); params.push(status); }
  if (search) { conditions.push('("to" LIKE ? OR "subject" LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const countResult = await prisma.$queryRawUnsafe<{ count: number }[]>(`SELECT COUNT(*) as count FROM "EmailLog" ${where}`, ...params);
  const total = Number(countResult[0]?.count ?? 0);
  const emails = await prisma.$queryRawUnsafe<EmailLog[]>(`SELECT * FROM "EmailLog" ${where} ORDER BY "createdAt" DESC LIMIT ? OFFSET ?`, ...params, limit, offset);
  return { emails, total };
}
