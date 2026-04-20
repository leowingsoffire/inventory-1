import { NextRequest, NextResponse } from 'next/server';
import { updateFormTemplate, deleteFormTemplate } from '@/lib/custom-forms';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await request.json();
    await updateFormTemplate(id, data);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PUT /api/forms/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update form' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await deleteFormTemplate(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/forms/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete form' }, { status: 500 });
  }
}
