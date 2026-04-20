import { NextResponse } from 'next/server';
import { runPeriodicAutomation } from '@/lib/automation';

export async function POST() {
  try {
    const results = await runPeriodicAutomation();
    return NextResponse.json({ success: true, ...results });
  } catch (error) {
    console.error('POST /api/automation/run error:', error);
    return NextResponse.json({ error: 'Failed to run automation' }, { status: 500 });
  }
}
