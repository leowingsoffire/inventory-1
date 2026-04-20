import { NextRequest, NextResponse } from 'next/server';
import { processTransfer } from '@/lib/locations';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { action, userId } = await request.json();
    await processTransfer(id, action, userId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PUT /api/assets/transfers/[id] error:', error);
    return NextResponse.json({ error: 'Failed to process transfer' }, { status: 500 });
  }
}
