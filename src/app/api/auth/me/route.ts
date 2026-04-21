import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

// Demo users for fallback when DB is unavailable
const DEMO_USERS: Record<string, { id: string; username: string; email: string; name: string; displayName: string; role: string; avatar: string | null; profilePhoto: string | null; personalEmail: string | null; isActive: boolean }> = {
  'demo-admin': { id: 'demo-admin', username: 'admin', email: 'admin@unitech.sg', name: 'Admin User', displayName: 'Admin', role: 'dev_admin', avatar: null, profilePhoto: null, personalEmail: null, isActive: true },
  'demo-myo': { id: 'demo-myo', username: 'myoadmin', email: 'myo@unitech.sg', name: 'Myo Min', displayName: 'Myo Min', role: 'dev_admin', avatar: null, profilePhoto: null, personalEmail: null, isActive: true },
  'demo-yu': { id: 'demo-yu', username: 'yuadmin', email: 'yulius@unitech.sg', name: 'Yulius Herman', displayName: 'Yulius Herman', role: 'finance_controller', avatar: null, profilePhoto: null, personalEmail: null, isActive: true },
};

export async function GET() {
  const session = await getSession();
  if (!session?.userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Try to fetch full user from database
  try {
    const { prisma } = await import('@/lib/db');
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        displayName: true,
        role: true,
        avatar: true,
        profilePhoto: true,
        personalEmail: true,
        isActive: true,
      },
    });

    if (user) {
      return NextResponse.json({ user });
    }
  } catch {
    // Database unavailable, try demo fallback
  }

  // Fallback to demo user data
  const demoUser = DEMO_USERS[session.userId];
  if (demoUser) {
    return NextResponse.json({ user: demoUser });
  }

  // Session has a userId but user not found — session is stale
  return NextResponse.json({ error: 'User not found' }, { status: 401 });
}
