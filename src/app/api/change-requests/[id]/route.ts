import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createNotificationForAllAdmins } from '@/lib/notifications';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const change = await prisma.changeRequest.findUnique({ where: { id } });
    if (!change) return NextResponse.json({ error: 'Change request not found' }, { status: 404 });
    return NextResponse.json(change);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch change request' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await request.json();
    const existing = await prisma.changeRequest.findUnique({ where: { id } });
    const change = await prisma.changeRequest.update({ where: { id }, data });
    // Notify on approval/rejection
    if (data.approval && existing && data.approval !== existing.approval) {
      try {
        const isApproved = data.approval === 'approved';
        await createNotificationForAllAdmins(
          isApproved ? 'change-approved' : 'change-rejected',
          `Change ${isApproved ? 'Approved' : 'Rejected'}: ${change.number || change.id}`,
          `Change request has been ${data.approval}`,
          `/change-requests`
        );
      } catch { /* non-critical */ }
    }
    return NextResponse.json(change);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update change request' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.changeRequest.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete change request' }, { status: 500 });
  }
}
