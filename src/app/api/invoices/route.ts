import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const invoices = await prisma.invoice.findMany({
      orderBy: { createdAt: 'desc' },
      include: { customer: { select: { companyName: true, uen: true } } },
    });
    return NextResponse.json(invoices);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    // Auto-calculate GST
    const subtotal = data.subtotal || 0;
    const gstRate = data.gstRate ?? 9;
    const gstAmount = subtotal * (gstRate / 100);
    const totalAmount = subtotal + gstAmount;
    const invoice = await prisma.invoice.create({
      data: { ...data, gstAmount, totalAmount },
    });
    return NextResponse.json(invoice, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}
