import { NextResponse } from 'next/server';
import { getOverdueTasks, generateTicketFromTask } from '@/lib/scheduled-tasks';

export async function POST() {
  try {
    const overdue = await getOverdueTasks();
    const generated: string[] = [];
    for (const task of overdue) {
      const ticketId = await generateTicketFromTask(task);
      generated.push(ticketId);
    }
    return NextResponse.json({ generated, count: generated.length });
  } catch (error) {
    console.error('POST /api/scheduled-tasks/run error:', error);
    return NextResponse.json({ error: 'Failed to run scheduled tasks' }, { status: 500 });
  }
}
