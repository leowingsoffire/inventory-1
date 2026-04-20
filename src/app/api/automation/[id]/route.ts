import { NextRequest, NextResponse } from 'next/server';
import { updateAutomationRule, deleteAutomationRule, getAutomationRule } from '@/lib/automation';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const rule = await getAutomationRule(id);
    if (!rule) return NextResponse.json({ error: 'Rule not found' }, { status: 404 });
    return NextResponse.json(rule);
  } catch (error) {
    console.error('GET /api/automation/[id] error:', error);
    return NextResponse.json(null);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await request.json();
    await updateAutomationRule(id, data);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PUT /api/automation/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update rule' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await deleteAutomationRule(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/automation/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete rule' }, { status: 500 });
  }
}
