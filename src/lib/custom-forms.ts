import { prisma } from '@/lib/db';
import { generateId } from '@/lib/utils';

export interface FormTemplate {
  id: string; title: string; description: string | null; category: string;
  fields: string; isActive: number; createdBy: string | null; createdAt: string; updatedAt: string;
}
export interface FormSubmission {
  id: string; formId: string; entityType: string | null; entityId: string | null;
  responses: string; completionPercent: number; submittedBy: string | null;
  status: string; reviewedBy: string | null; reviewNotes: string | null; createdAt: string; updatedAt: string;
}
export interface FormField {
  id: string; type: 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'textarea'; label: string; required: boolean; options?: string[];
}

export async function ensureFormTables(): Promise<void> {
  await prisma.$queryRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "FormTemplate" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "title" TEXT NOT NULL,
      "description" TEXT,
      "category" TEXT NOT NULL DEFAULT 'custom',
      "fields" TEXT NOT NULL DEFAULT '[]',
      "isActive" INTEGER NOT NULL DEFAULT 1,
      "createdBy" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await prisma.$queryRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "FormSubmission" (
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
    )
  `);
}

export async function getFormTemplates(options: { category?: string; limit?: number; offset?: number } = {}): Promise<{ templates: FormTemplate[]; total: number }> {
  await ensureFormTables();
  const { category, limit = 50, offset = 0 } = options;
  const where = category ? 'WHERE "category" = ?' : '';
  const params: unknown[] = category ? [category] : [];
  const countResult = await prisma.$queryRawUnsafe<{ count: number }[]>(`SELECT COUNT(*) as count FROM "FormTemplate" ${where}`, ...params);
  const total = Number(countResult[0]?.count ?? 0);
  const templates = await prisma.$queryRawUnsafe<FormTemplate[]>(`SELECT * FROM "FormTemplate" ${where} ORDER BY "updatedAt" DESC LIMIT ? OFFSET ?`, ...params, limit, offset);
  return { templates, total };
}

export async function createFormTemplate(data: { title: string; description?: string; category: string; fields: FormField[]; createdBy?: string }): Promise<string> {
  await ensureFormTables();
  const id = generateId();
  await prisma.$queryRawUnsafe(
    `INSERT INTO "FormTemplate" ("id","title","description","category","fields","isActive","createdBy","createdAt","updatedAt") VALUES (?,?,?,?,?,1,?,datetime('now'),datetime('now'))`,
    id, data.title, data.description ?? null, data.category, JSON.stringify(data.fields), data.createdBy ?? null,
  );
  return id;
}

export async function updateFormTemplate(id: string, data: Record<string, unknown>): Promise<void> {
  const allowedFields = ['title', 'description', 'category', 'fields', 'isActive'];
  const sets: string[] = ['"updatedAt" = datetime(\'now\')'];
  const params: unknown[] = [];
  for (const [key, val] of Object.entries(data)) {
    if (allowedFields.includes(key)) { sets.push(`"${key}" = ?`); params.push(key === 'fields' && Array.isArray(val) ? JSON.stringify(val) : val); }
  }
  params.push(id);
  await prisma.$queryRawUnsafe(`UPDATE "FormTemplate" SET ${sets.join(', ')} WHERE "id" = ?`, ...params);
}

export async function deleteFormTemplate(id: string): Promise<void> {
  await ensureFormTables();
  await prisma.$queryRawUnsafe(`DELETE FROM "FormTemplate" WHERE "id" = ?`, id);
}

export async function getFormSubmissions(options: { formId?: string; entityType?: string; entityId?: string; limit?: number; offset?: number } = {}): Promise<{ submissions: FormSubmission[]; total: number }> {
  await ensureFormTables();
  const { formId, entityType, entityId, limit = 50, offset = 0 } = options;
  const conditions: string[] = [];
  const params: unknown[] = [];
  if (formId) { conditions.push('"formId" = ?'); params.push(formId); }
  if (entityType) { conditions.push('"entityType" = ?'); params.push(entityType); }
  if (entityId) { conditions.push('"entityId" = ?'); params.push(entityId); }
  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const countResult = await prisma.$queryRawUnsafe<{ count: number }[]>(`SELECT COUNT(*) as count FROM "FormSubmission" ${where}`, ...params);
  const total = Number(countResult[0]?.count ?? 0);
  const submissions = await prisma.$queryRawUnsafe<FormSubmission[]>(`SELECT * FROM "FormSubmission" ${where} ORDER BY "createdAt" DESC LIMIT ? OFFSET ?`, ...params, limit, offset);
  return { submissions, total };
}

export async function createFormSubmission(data: { formId: string; entityType?: string; entityId?: string; responses: Record<string, unknown>; submittedBy?: string }): Promise<string> {
  await ensureFormTables();
  const id = generateId();
  const template = (await prisma.$queryRawUnsafe<FormTemplate[]>(`SELECT "fields" FROM "FormTemplate" WHERE "id" = ?`, data.formId))[0];
  let completionPercent = 100;
  if (template) {
    const fields: FormField[] = JSON.parse(template.fields);
    const required = fields.filter((f) => f.required);
    const filled = required.filter((f) => data.responses[f.id] != null && data.responses[f.id] !== '');
    completionPercent = required.length > 0 ? Math.round((filled.length / required.length) * 100) : 100;
  }
  const status = completionPercent >= 100 ? 'completed' : 'in-progress';
  await prisma.$queryRawUnsafe(
    `INSERT INTO "FormSubmission" ("id","formId","entityType","entityId","responses","completionPercent","submittedBy","status","createdAt","updatedAt") VALUES (?,?,?,?,?,?,?,?,datetime('now'),datetime('now'))`,
    id, data.formId, data.entityType ?? null, data.entityId ?? null, JSON.stringify(data.responses), completionPercent, data.submittedBy ?? null, status,
  );
  return id;
}
