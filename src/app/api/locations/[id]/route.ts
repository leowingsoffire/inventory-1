import { NextRequest, NextResponse } from 'next/server';
import { updateLocation, deleteLocation } from '@/lib/locations';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await request.json();
    await updateLocation(id, data);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PUT /api/locations/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update location' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await deleteLocation(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/locations/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete location' }, { status: 500 });
  }
}
