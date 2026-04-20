import { NextRequest, NextResponse } from 'next/server';
import { getLocations, createLocation } from '@/lib/locations';

export async function GET() {
  try {
    const locations = await getLocations();
    return NextResponse.json(locations);
  } catch (error) {
    console.error('GET /api/locations error:', error);
    return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const id = await createLocation(data);
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    console.error('POST /api/locations error:', error);
    return NextResponse.json({ error: 'Failed to create location' }, { status: 500 });
  }
}
