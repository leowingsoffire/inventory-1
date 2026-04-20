import { prisma } from '@/lib/db';
import { generateId } from '@/lib/utils';

export type NotificationType =
  | 'warranty-expiry'
  | 'invoice-overdue'
  | 'approval-needed'
  | 'ticket-assigned'
  | 'change-approved'
  | 'change-rejected'
  | 'general';

export interface NotificationData {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export async function ensureNotificationTable(): Promise<void> {
  await prisma.$queryRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Notification" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "userId" TEXT NOT NULL,
      "type" TEXT NOT NULL DEFAULT 'general',
      "title" TEXT NOT NULL,
      "message" TEXT NOT NULL,
      "link" TEXT,
      "isRead" BOOLEAN NOT NULL DEFAULT 0,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
    )
  `);
}

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  link?: string,
): Promise<void> {
  await ensureNotificationTable();
  const id = generateId();
  await prisma.$queryRawUnsafe(
    `INSERT INTO "Notification" ("id", "userId", "type", "title", "message", "link", "isRead", "createdAt")
     VALUES (?, ?, ?, ?, ?, ?, 0, datetime('now'))`,
    id, userId, type, title, message, link ?? null,
  );
}

export async function createNotificationForRole(
  role: string,
  type: NotificationType,
  title: string,
  message: string,
  link?: string,
): Promise<void> {
  await ensureNotificationTable();
  const users = await prisma.$queryRawUnsafe<{ id: string }[]>(
    `SELECT "id" FROM "User" WHERE "role" = ? AND "isActive" = 1`,
    role,
  );
  await Promise.all(users.map(user => createNotification(user.id, type, title, message, link)));
}

export async function createNotificationForAllAdmins(
  type: NotificationType,
  title: string,
  message: string,
  link?: string,
): Promise<void> {
  await ensureNotificationTable();
  const admins = await prisma.$queryRawUnsafe<{ id: string }[]>(
    `SELECT "id" FROM "User" WHERE "role" IN ('admin', 'manager') AND "isActive" = 1`,
  );
  await Promise.all(admins.map(admin => createNotification(admin.id, type, title, message, link)));
}

export async function getNotifications(
  userId: string,
  options: { unreadOnly?: boolean; limit?: number; offset?: number } = {},
): Promise<NotificationData[]> {
  await ensureNotificationTable();
  const { unreadOnly = false, limit = 50, offset = 0 } = options;
  const where = unreadOnly ? `AND "isRead" = 0` : '';
  return prisma.$queryRawUnsafe<NotificationData[]>(
    `SELECT * FROM "Notification" WHERE "userId" = ? ${where} ORDER BY "createdAt" DESC LIMIT ? OFFSET ?`,
    userId, limit, offset,
  );
}

export async function getUnreadCount(userId: string): Promise<number> {
  await ensureNotificationTable();
  const result = await prisma.$queryRawUnsafe<{ count: number }[]>(
    `SELECT COUNT(*) as count FROM "Notification" WHERE "userId" = ? AND "isRead" = 0`,
    userId,
  );
  return Number(result[0]?.count ?? 0);
}

export async function markAsRead(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const placeholders = ids.map(() => '?').join(',');
  await prisma.$queryRawUnsafe(
    `UPDATE "Notification" SET "isRead" = 1 WHERE "id" IN (${placeholders})`,
    ...ids,
  );
}

export async function markAllAsRead(userId: string): Promise<void> {
  await prisma.$queryRawUnsafe(
    `UPDATE "Notification" SET "isRead" = 1 WHERE "userId" = ?`,
    userId,
  );
}

export async function deleteNotification(id: string): Promise<void> {
  await prisma.$queryRawUnsafe(
    `DELETE FROM "Notification" WHERE "id" = ?`,
    id,
  );
}

export async function deleteOldNotifications(userId: string, daysOld: number = 30): Promise<void> {
  await prisma.$queryRawUnsafe(
    `DELETE FROM "Notification" WHERE "userId" = ? AND "createdAt" < datetime('now', '-' || ? || ' days')`,
    userId, daysOld,
  );
}
