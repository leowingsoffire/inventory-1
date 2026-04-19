import { PrismaClient } from '@prisma/client';

function getDbUrl(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  
  if (process.env.VERCEL) {
    try {
      const fs = require('fs');
      const path = require('path');
      const tmpDb = '/tmp/dev.db';
      if (!fs.existsSync(tmpDb)) {
        const src = path.join(process.cwd(), 'prisma', 'dev.db');
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, tmpDb);
          console.log('Copied dev.db to /tmp/dev.db');
        } else {
          console.error('Source dev.db not found at:', src);
        }
      }
      return `file:${tmpDb}`;
    } catch (e) {
      console.error('Error setting up Vercel DB:', e);
      return 'file:/tmp/dev.db';
    }
  }
  
  return 'file:./dev.db';
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: { db: { url: getDbUrl() } },
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
