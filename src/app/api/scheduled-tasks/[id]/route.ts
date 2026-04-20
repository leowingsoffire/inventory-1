import { NextRequest, NextResponse } from 'next/server';
import { updateScheduledTask, deleteScheduledTask } from '@/lib/scheduled-tasks';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await request.json();
    await updateScheduledTask(id, data);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PUT /api/scheduled-tasks/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await deleteScheduledTask(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/scheduled-tasks/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
