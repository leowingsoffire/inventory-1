import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const change = await prisma.changeRequest.findUnique({ where: { id } });
    if (!change) return NextResponse.json({ error: 'Change request not found' }, { status: 404 });
    return NextResponse.json(change);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch change request' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await request.json();
    const change = await prisma.changeRequest.update({ where: { id }, data });
    return NextResponse.json(change);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update change request' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.changeRequest.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete change request' }, { status: 500 });
  }
}
