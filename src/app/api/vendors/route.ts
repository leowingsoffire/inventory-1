import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const vendors = await prisma.vendor.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json(vendors);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch vendors' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const vendor = await prisma.vendor.create({ data });
    return NextResponse.json(vendor, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create vendor' }, { status: 500 });
  }
}
