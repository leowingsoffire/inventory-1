import { NextRequest, NextResponse } from 'next/server';
import { getContracts, createContract } from '@/lib/contracts';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const result = await getContracts({
      type: searchParams.get('type') || undefined,
      status: searchParams.get('status') || undefined,
      search: searchParams.get('search') || undefined,
      limit: parseInt(searchParams.get('limit') || '50', 10),
      offset: parseInt(searchParams.get('offset') || '0', 10),
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/contracts error:', error);
    return NextResponse.json({ contracts: [], total: 0 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const id = await createContract(data);
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    console.error('POST /api/contracts error:', error);
    return NextResponse.json({ error: 'Failed to create contract' }, { status: 500 });
  }
}
