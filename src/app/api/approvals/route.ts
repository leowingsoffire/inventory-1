import { NextRequest, NextResponse } from 'next/server';
import { getApprovalRequests, createApprovalRequest } from '@/lib/approvals';
import { executeRulesForTrigger } from '@/lib/automation';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const result = await getApprovalRequests({
      requesterId: searchParams.get('requesterId') || undefined,
      approverId: searchParams.get('approverId') || undefined,
      status: searchParams.get('status') || undefined,
      limit: parseInt(searchParams.get('limit') || '50', 10),
      offset: parseInt(searchParams.get('offset') || '0', 10),
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/approvals error:', error);
    return NextResponse.json({ requests: [], total: 0 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const id = await createApprovalRequest(data);
    // Automation: trigger rules for new approval requests
    try {
      await executeRulesForTrigger('approval-created', {
        approvalId: id, type: data.type, amount: data.amount,
        title: data.title, requesterId: data.requesterId,
      }, id, 'approval');
    } catch { /* non-critical */ }
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    console.error('POST /api/approvals error:', error);
    return NextResponse.json({ error: 'Failed to create approval' }, { status: 500 });
  }
}
