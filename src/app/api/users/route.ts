import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { requirePermission, isAuthError } from '@/lib/api-auth';
import { createUserSchema, validateBody } from '@/lib/validation';

// GET all users
export async function GET() {
  try {
    const session = await requirePermission('users', 'canRead');
    if (isAuthError(session)) return session;

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
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
        createdAt: true,
        updatedAt: true,
      },
    });
    return NextResponse.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST create new user
export async function POST(request: NextRequest) {
  try {
    const session = await requirePermission('users', 'canCreate');
    if (isAuthError(session)) return session;

    const body = await request.json();
    const validation = validateBody(createUserSchema, body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { username, email, name, displayName, password, role, personalEmail } = validation.data;

    // Check for existing username or email
    const existing = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
    });
    if (existing) {
      return NextResponse.json({
        error: existing.username === username ? 'Username already taken' : 'Email already in use',
      }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        name,
        displayName: displayName || name,
        password: hashedPassword,
        role: role || 'engineer',
        personalEmail: personalEmail || null,
      },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        displayName: true,
        role: true,
        personalEmail: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
