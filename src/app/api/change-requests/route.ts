import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const changes = await prisma.changeRequest.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(changes);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch change requests' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    // Auto-generate change number
    const count = await prisma.changeRequest.count();
    const number = `CHG${String(count + 1).padStart(7, '0')}`;
    const change = await prisma.changeRequest.create({
      data: { ...data, number },
    });
    return NextResponse.json(change, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create change request' }, { status: 500 });
  }
}
