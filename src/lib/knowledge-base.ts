import { prisma } from '@/lib/db';
import { generateId } from '@/lib/utils';

export interface KBArticle {
  id: string;
  title: string;
  slug: string;
  content: string;
  category: string;
  tags: string;
  status: string;
  authorId: string | null;
  viewCount: number;
  version: number;
  createdAt: string;
  updatedAt: string;
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 100);
}

export async function ensureKBArticleTable(): Promise<void> {
  await prisma.$queryRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "KBArticle" (
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
    )
  `);
}

export async function getKBArticles(options: {
  search?: string; category?: string; status?: string; limit?: number; offset?: number;
} = {}): Promise<{ articles: KBArticle[]; total: number }> {
  await ensureKBArticleTable();
  const { search, category, status, limit = 50, offset = 0 } = options;
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (search) {
    conditions.push(`("title" LIKE ? OR "content" LIKE ?)`);
    params.push(`%${search}%`, `%${search}%`);
  }
  if (category) { conditions.push(`"category" = ?`); params.push(category); }
  if (status) { conditions.push(`"status" = ?`); params.push(status); }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await prisma.$queryRawUnsafe<{ count: number }[]>(
    `SELECT COUNT(*) as count FROM "KBArticle" ${where}`, ...params,
  );
  const total = Number(countResult[0]?.count ?? 0);

  const articles = await prisma.$queryRawUnsafe<KBArticle[]>(
    `SELECT * FROM "KBArticle" ${where} ORDER BY "updatedAt" DESC LIMIT ? OFFSET ?`,
    ...params, limit, offset,
  );
  return { articles, total };
}

export async function getKBArticle(id: string): Promise<KBArticle | null> {
  await ensureKBArticleTable();
  const results = await prisma.$queryRawUnsafe<KBArticle[]>(
    `SELECT * FROM "KBArticle" WHERE "id" = ?`, id,
  );
  if (results.length > 0) {
    await prisma.$queryRawUnsafe(`UPDATE "KBArticle" SET "viewCount" = "viewCount" + 1 WHERE "id" = ?`, id);
  }
  return results[0] ?? null;
}

export async function createKBArticle(data: {
  title: string; content: string; category: string; tags?: string[]; authorId?: string;
}): Promise<string> {
  await ensureKBArticleTable();
  const id = generateId();
  let slug = slugify(data.title);
  const existing = await prisma.$queryRawUnsafe<{ id: string }[]>(
    `SELECT "id" FROM "KBArticle" WHERE "slug" = ?`, slug,
  );
  if (existing.length > 0) slug = `${slug}-${Date.now()}`;

  await prisma.$queryRawUnsafe(
    `INSERT INTO "KBArticle" ("id","title","slug","content","category","tags","status","authorId","viewCount","version","createdAt","updatedAt")
     VALUES (?,?,?,?,?,?,?,?,0,1,datetime('now'),datetime('now'))`,
    id, data.title, slug, data.content, data.category,
    JSON.stringify(data.tags ?? []), 'published', data.authorId ?? null,
  );
  return id;
}

export async function updateKBArticle(id: string, data: Record<string, unknown>): Promise<void> {
  await ensureKBArticleTable();
  const sets: string[] = ['"updatedAt" = datetime(\'now\')', '"version" = "version" + 1'];
  const params: unknown[] = [];
  for (const [key, val] of Object.entries(data)) {
    if (['title', 'content', 'category', 'tags', 'status', 'slug'].includes(key)) {
      sets.push(`"${key}" = ?`);
      params.push(key === 'tags' && Array.isArray(val) ? JSON.stringify(val) : val);
    }
  }
  params.push(id);
  await prisma.$queryRawUnsafe(`UPDATE "KBArticle" SET ${sets.join(', ')} WHERE "id" = ?`, ...params);
}

export async function deleteKBArticle(id: string): Promise<void> {
  await ensureKBArticleTable();
  await prisma.$queryRawUnsafe(`DELETE FROM "KBArticle" WHERE "id" = ?`, id);
}
