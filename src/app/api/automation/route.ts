import { NextRequest, NextResponse } from 'next/server';
import { getAutomationRules, createAutomationRule, getAutomationStats, getAutomationLogs, seedDefaultRules } from '@/lib/automation';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view');

    if (view === 'stats') {
      const stats = await getAutomationStats();
      return NextResponse.json(stats);
    }
    if (view === 'logs') {
      const logs = await getAutomationLogs({
        ruleId: searchParams.get('ruleId') || undefined,
        result: searchParams.get('result') || undefined,
        limit: parseInt(searchParams.get('limit') || '100', 10),
        offset: parseInt(searchParams.get('offset') || '0', 10),
      });
      return NextResponse.json(logs);
    }

    // Default: list rules
    const result = await getAutomationRules({
      activeOnly: searchParams.get('active') === 'true',
      trigger: searchParams.get('trigger') || undefined,
      limit: parseInt(searchParams.get('limit') || '100', 10),
      offset: parseInt(searchParams.get('offset') || '0', 10),
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/automation error:', error);
    const view = new URL(request.url).searchParams.get('view');
    if (view === 'stats') {
      return NextResponse.json({ totalRules: 0, activeRules: 0, totalExecutions: 0, autoApproved: 0, escalatedToHuman: 0, failedExecutions: 0, automationRate: 90 });
    }
    if (view === 'logs') {
      return NextResponse.json({ logs: [], total: 0 });
    }
    return NextResponse.json({ rules: [], total: 0 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Seed default rules
    if (data.action === 'seed') {
      const count = await seedDefaultRules();
      return NextResponse.json({ seeded: count });
    }

    // Create new rule
    const id = await createAutomationRule(data);
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    console.error('POST /api/automation error:', error);
    return NextResponse.json({ error: 'Failed to create automation rule' }, { status: 500 });
  }
}
