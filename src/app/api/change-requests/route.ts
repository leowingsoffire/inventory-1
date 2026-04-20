import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { executeRulesForTrigger } from '@/lib/automation';

export async function GET() {
  try {
    const changes = await prisma.changeRequest.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(changes);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch change requests' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    // Auto-generate change number
    const count = await prisma.changeRequest.count();
    const number = `CHG${String(count + 1).padStart(7, '0')}`;
    const change = await prisma.changeRequest.create({
      data: { ...data, number },
    });
    // Automation: trigger rules for new change requests
    try {
      await executeRulesForTrigger('change-request-created', {
        changeId: change.id, title: change.shortDescription, type: change.type,
        priority: change.priority, risk: change.risk, impact: change.impact,
      }, change.id, 'change-request');
    } catch { /* non-critical */ }
    return NextResponse.json(change, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create change request' }, { status: 500 });
  }
}
