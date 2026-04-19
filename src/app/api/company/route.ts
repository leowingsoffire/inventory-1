import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    let profile = await prisma.companyProfile.findFirst();
    if (!profile) {
      profile = await prisma.companyProfile.create({
        data: {
          companyName: 'Unitech IT System Pte Ltd',
          country: 'Singapore',
          invoicePrefix: 'INV',
        },
      });
    }
    return NextResponse.json(profile);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch company profile' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    let profile = await prisma.companyProfile.findFirst();
    if (!profile) {
      profile = await prisma.companyProfile.create({ data });
    } else {
      profile = await prisma.companyProfile.update({
        where: { id: profile.id },
        data: {
          companyName: data.companyName,
          uen: data.uen,
          logoUrl: data.logoUrl,
          address: data.address,
          postalCode: data.postalCode,
          country: data.country,
          phone: data.phone,
          email: data.email,
          website: data.website,
          gstNumber: data.gstNumber,
          bankName: data.bankName,
          bankAccount: data.bankAccount,
          bankSwift: data.bankSwift,
          invoicePrefix: data.invoicePrefix,
          invoiceFooter: data.invoiceFooter,
          quotationFooter: data.quotationFooter,
        },
      });
    }
    return NextResponse.json(profile);
  } catch {
    return NextResponse.json({ error: 'Failed to update company profile' }, { status: 500 });
  }
}
