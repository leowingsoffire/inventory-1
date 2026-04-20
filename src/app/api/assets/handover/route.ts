import { NextRequest, NextResponse } from 'next/server';
import { getHandovers, createHandover } from '@/lib/asset-handover';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const result = await getHandovers({
      assetId: searchParams.get('assetId') || undefined,
      employeeId: searchParams.get('employeeId') || undefined,
      limit: parseInt(searchParams.get('limit') || '50', 10),
      offset: parseInt(searchParams.get('offset') || '0', 10),
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/assets/handover error:', error);
    return NextResponse.json({ handovers: [], total: 0 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const id = await createHandover(data);
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    console.error('POST /api/assets/handover error:', error);
    return NextResponse.json({ error: 'Failed to create handover' }, { status: 500 });
  }
}
