import { NextRequest, NextResponse } from 'next/server';
import { getSLAPolicies, updateSLAPolicy } from '@/lib/sla';

export async function GET() {
  try {
    const policies = await getSLAPolicies();
    return NextResponse.json(policies);
  } catch (error) {
    console.error('GET /api/settings/sla error:', error);
    return NextResponse.json([]);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, ...data } = await request.json();
    await updateSLAPolicy(id, data);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PUT /api/settings/sla error:', error);
    return NextResponse.json({ error: 'Failed to update SLA policy' }, { status: 500 });
  }
}
