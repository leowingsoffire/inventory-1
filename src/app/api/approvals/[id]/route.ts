import { NextRequest, NextResponse } from 'next/server';
import { getApprovalSteps, processApproval } from '@/lib/approvals';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const steps = await getApprovalSteps(id);
    return NextResponse.json(steps);
  } catch (error) {
    console.error('GET /api/approvals/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch approval steps' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { approved, comment, signature } = await request.json();
    await processApproval(id, approved, comment, signature);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PUT /api/approvals/[id] error:', error);
    return NextResponse.json({ error: 'Failed to process approval' }, { status: 500 });
  }
}
