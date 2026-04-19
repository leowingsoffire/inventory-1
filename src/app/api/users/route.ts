import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

// GET all users
export async function GET() {
  try {
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
    const body = await request.json();
    const { username, email, name, displayName, password, role, personalEmail } = body;

    if (!username || !email || !name || !password) {
      return NextResponse.json({ error: 'Username, email, name, and password are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

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
