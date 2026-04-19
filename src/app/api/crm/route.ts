import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const where = customerId ? { customerId } : {};
    const activities = await prisma.cRMActivity.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { customer: { select: { companyName: true } } },
    });
    return NextResponse.json(activities);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const activity = await prisma.cRMActivity.create({ data });
    return NextResponse.json(activity, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create activity' }, { status: 500 });
  }
}
