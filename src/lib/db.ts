import { PrismaClient } from '@prisma/client';

const VERCEL_DB_PATH = '/tmp/dev.db';

function getDbUrl(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  
  if (process.env.VERCEL) {
    try {
      const fs = require('fs');
      const path = require('path');
      if (!fs.existsSync(VERCEL_DB_PATH)) {
        const src = path.join(process.cwd(), 'prisma', 'dev.db');
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, VERCEL_DB_PATH);
        }
      }
      return `file:${VERCEL_DB_PATH}`;
    } catch {
      return `file:${VERCEL_DB_PATH}`;
    }
  }
  
  return 'file:./dev.db';
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const _prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: { db: { url: getDbUrl() } },
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = _prisma;

export const prisma = _prisma;
