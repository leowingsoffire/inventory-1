import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { createSession } from '@/lib/session';
import { loginSchema, validateBody } from '@/lib/validation';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

// Hardcoded demo users for environments where SQLite may not be available (e.g., Vercel serverless)
const DEMO_USERS = [
  { id: 'demo-admin', username: 'admin', email: 'admin@unitech.sg', name: 'Admin User', displayName: 'Admin', password: 'admin123', role: 'dev_admin', avatar: null, profilePhoto: null, personalEmail: null, isActive: true },
  { id: 'demo-myo', username: 'myoadmin', email: 'myo@unitech.sg', name: 'Myo Min', displayName: 'Myo Min', password: 'myo123', role: 'dev_admin', avatar: null, profilePhoto: null, personalEmail: null, isActive: true },
  { id: 'demo-yu', username: 'yuadmin', email: 'yulius@unitech.sg', name: 'Yulius Herman', displayName: 'Yulius Herman', password: 'yu123', role: 'finance_controller', avatar: null, profilePhoto: null, personalEmail: null, isActive: true },
];

async function tryDatabaseLogin(login: string, password: string) {
  try {
    const { prisma } = await import('@/lib/db');
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: login },
          { email: login },
        ],
      },
    });

    if (!user) return null;
    if (!user.isActive) return { error: 'Account is deactivated. Contact administrator.', status: 403 };

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return null;

    const { password: _, resetToken: __, resetTokenExpiry: ___, ...safeUser } = user;
    return { user: safeUser };
  } catch (e) {
    console.error('Database login failed, falling back to demo auth:', e);
    return undefined; // Signal to use fallback
  }
}

function demoLogin(login: string, password: string) {
  const demoUser = DEMO_USERS.find(u => u.username === login || u.email === login);
  if (!demoUser) return null;
  if (!demoUser.isActive) return { error: 'Account is deactivated. Contact administrator.', status: 403 };
  if (demoUser.password !== password) return null;

  const { password: _, ...safeUser } = demoUser;
  return { user: safeUser };
}

async function handleLoginResult(result: { user: Record<string, unknown> } | null) {
  if (!result) return null;
  const u = result.user;
  await createSession(u.id as string, u.role as string, u.username as string);
  return result;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 10 attempts per IP per 15 minutes
    const ip = getClientIp(request);
    const rl = checkRateLimit(`login:${ip}`, 10, 15 * 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Too many login attempts. Try again in ${rl.resetIn} seconds.` },
        { status: 429 }
      );
    }

    const body = await request.json();
    const validation = validateBody(loginSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { login, password } = validation.data;

    // Try database first
    const dbResult = await tryDatabaseLogin(login, password);

    if (dbResult === undefined) {
      // Database unavailable — use demo fallback
      const fallbackResult = demoLogin(login, password);
      if (!fallbackResult) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }
      if ('error' in fallbackResult) {
        return NextResponse.json({ error: fallbackResult.error }, { status: fallbackResult.status });
      }
      const sessionResult = await handleLoginResult(fallbackResult);
      return NextResponse.json(sessionResult);
    }

    if (dbResult === null) {
      // DB worked but user not found or wrong password — also try demo
      const fallbackResult = demoLogin(login, password);
      if (!fallbackResult) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }
      if ('error' in fallbackResult) {
        return NextResponse.json({ error: fallbackResult.error }, { status: fallbackResult.status });
      }
      const sessionResult = await handleLoginResult(fallbackResult);
      return NextResponse.json(sessionResult);
    }

    if ('error' in dbResult) {
      return NextResponse.json({ error: dbResult.error }, { status: dbResult.status });
    }

    const sessionResult = await handleLoginResult(dbResult);
    return NextResponse.json(sessionResult);
  } catch (error) {
    console.error('Login error:', error);
    // Last resort — try demo login from body
    try {
      const body = await request.clone().json();
      const fallbackResult = demoLogin(body.login, body.password);
      if (fallbackResult && !('error' in fallbackResult)) {
        const sessionResult = await handleLoginResult(fallbackResult);
        return NextResponse.json(sessionResult);
      }
    } catch { /* ignore */ }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
