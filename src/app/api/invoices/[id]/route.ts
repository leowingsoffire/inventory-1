import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createNotificationForAllAdmins } from '@/lib/notifications';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: { customer: true },
    });
    if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(invoice);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await request.json();
    if (data.subtotal !== undefined) {
      const gstRate = data.gstRate ?? 9;
      data.gstAmount = data.subtotal * (gstRate / 100);
      data.totalAmount = data.subtotal + data.gstAmount;
    }
    const existing = await prisma.invoice.findUnique({ where: { id } });
    const invoice = await prisma.invoice.update({ where: { id }, data });
    // Notify on overdue status
    if (data.status === 'overdue' && existing && existing.status !== 'overdue') {
      try {
        await createNotificationForAllAdmins(
          'invoice-overdue',
          `Invoice Overdue: ${invoice.invoiceNumber || invoice.id}`,
          `Amount: $${invoice.totalAmount?.toFixed(2) || '0.00'}`,
          '/finance'
        );
      } catch { /* non-critical */ }
    }
    return NextResponse.json(invoice);
  } catch {
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.invoice.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 });
  }
}
