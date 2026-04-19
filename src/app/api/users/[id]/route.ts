import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

type RouteParams = { params: Promise<{ id: string }> };

// GET single user
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const user = await prisma.user.findUnique({
      where: { id },
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

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH update user
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { username, email, name, displayName, role, personalEmail, isActive, profilePhoto, password } = body;

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check unique constraints if changing username or email
    if (username && username !== existingUser.username) {
      const dup = await prisma.user.findUnique({ where: { username } });
      if (dup) return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
    }
    if (email && email !== existingUser.email) {
      const dup = await prisma.user.findUnique({ where: { email } });
      if (dup) return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
    }

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (username !== undefined) updateData.username = username;
    if (email !== undefined) updateData.email = email;
    if (name !== undefined) updateData.name = name;
    if (displayName !== undefined) updateData.displayName = displayName;
    if (role !== undefined) updateData.role = role;
    if (personalEmail !== undefined) updateData.personalEmail = personalEmail;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (profilePhoto !== undefined) updateData.profilePhoto = profilePhoto;

    // Password change
    if (password) {
      if (password.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
      }
      updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json(user);
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE user
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ message: 'User deleted' });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
