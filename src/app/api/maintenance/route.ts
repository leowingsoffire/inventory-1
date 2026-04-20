import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createNotificationForAllAdmins } from '@/lib/notifications';

export async function GET() {
  try {
    const tickets = await prisma.maintenance.findMany({
      orderBy: { createdAt: 'desc' },
      include: { asset: { select: { name: true, assetTag: true } } },
    });
    return NextResponse.json(tickets);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch maintenance tickets' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const ticket = await prisma.maintenance.create({ data });
    // Notify admins about new ticket
    try {
      await createNotificationForAllAdmins(
        'ticket-assigned',
        `New Ticket: ${data.title || 'Untitled'}`,
        `Priority: ${data.priority || 'normal'} — ${data.description?.slice(0, 80) || 'No description'}`,
        '/maintenance'
      );
    } catch { /* non-critical */ }
    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 });
  }
}
