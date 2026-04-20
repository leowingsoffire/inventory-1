import { NextRequest, NextResponse } from 'next/server';
import { getTransfers, createTransfer } from '@/lib/locations';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const result = await getTransfers({
      assetId: searchParams.get('assetId') || undefined,
      status: searchParams.get('status') || undefined,
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/assets/transfers error:', error);
    return NextResponse.json({ error: 'Failed to fetch transfers' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const id = await createTransfer(data);
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    console.error('POST /api/assets/transfers error:', error);
    return NextResponse.json({ error: 'Failed to create transfer' }, { status: 500 });
  }
}
