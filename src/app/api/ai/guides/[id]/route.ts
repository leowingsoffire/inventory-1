import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET — single guide
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const guide = await prisma.userGuide.findUnique({
      where: { id },
      include: { document: true },
    });
    if (!guide) return NextResponse.json({ error: 'Guide not found' }, { status: 404 });
    return NextResponse.json(guide);
  } catch (error) {
    console.error('Get guide error:', error);
    return NextResponse.json({ error: 'Failed to get guide' }, { status: 500 });
  }
}

// DELETE — delete a guide
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.userGuide.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete guide error:', error);
    return NextResponse.json({ error: 'Failed to delete guide' }, { status: 500 });
  }
}
