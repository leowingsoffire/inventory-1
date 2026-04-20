import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const VALID_CATEGORIES = ['hardware', 'software', 'appliance', 'vehicle', 'equipment', 'other'];
const VALID_TYPES = ['manufacturer', 'extended', 'third-party'];
const VALID_STATUSES = ['active', 'expiring', 'expired', 'claimed', 'void'];
const MAX_TEXT_LENGTH = 500;

function computeStatus(warrantyEnd: Date): string {
  const now = new Date();
  const daysLeft = Math.ceil((warrantyEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (daysLeft <= 0) return 'expired';
  if (daysLeft <= 30) return 'expiring';
  return 'active';
}

// GET: List all warranty registrations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const type = searchParams.get('type');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {};
    if (status && VALID_STATUSES.includes(status)) where.status = status;
    if (category && VALID_CATEGORIES.includes(category)) where.category = category;
    if (type && VALID_TYPES.includes(type)) where.warrantyType = type;

    let registrations = await prisma.warrantyRegistration.findMany({
      where,
      orderBy: { warrantyEnd: 'asc' },
    });

    // Auto-update statuses based on current date
    const updates: Promise<unknown>[] = [];
    registrations = registrations.map(reg => {
      if (reg.status === 'claimed' || reg.status === 'void') return reg;
      const computed = computeStatus(new Date(reg.warrantyEnd));
      if (computed !== reg.status) {
        updates.push(
          prisma.warrantyRegistration.update({
            where: { id: reg.id },
            data: { status: computed },
          })
        );
        return { ...reg, status: computed };
      }
      return reg;
    });
    if (updates.length > 0) await Promise.all(updates);

    // Text search filter (applied in-memory for SQLite compatibility)
    if (search) {
      const q = search.toLowerCase();
      registrations = registrations.filter(r =>
        r.itemName.toLowerCase().includes(q) ||
        (r.serialNumber && r.serialNumber.toLowerCase().includes(q)) ||
        (r.brand && r.brand.toLowerCase().includes(q)) ||
        (r.customerName && r.customerName.toLowerCase().includes(q)) ||
        (r.vendorName && r.vendorName.toLowerCase().includes(q))
      );
    }

    return NextResponse.json(registrations);
  } catch (error) {
    console.error('Warranty registrations GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Create a new warranty registration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      itemName, serialNumber, category, brand, modelName,
      purchaseDate, warrantyStart, warrantyEnd, warrantyMonths,
      warrantyType, provider, coverageDetails, claimProcess,
      receiptRef, cost, notes, assetId, customerName, customerEmail,
      vendorName, registeredBy,
    } = body;

    if (!itemName || typeof itemName !== 'string' || itemName.trim().length === 0) {
      return NextResponse.json({ error: 'Item name is required' }, { status: 400 });
    }
    if (itemName.length > MAX_TEXT_LENGTH) {
      return NextResponse.json({ error: 'Item name too long' }, { status: 400 });
    }
    if (!warrantyStart) {
      return NextResponse.json({ error: 'Warranty start date is required' }, { status: 400 });
    }

    // Calculate warranty end from start + months, or use provided end date
    let endDate: Date;
    if (warrantyEnd) {
      endDate = new Date(warrantyEnd);
    } else if (warrantyMonths && warrantyMonths > 0) {
      endDate = new Date(warrantyStart);
      endDate.setMonth(endDate.getMonth() + warrantyMonths);
    } else {
      return NextResponse.json({ error: 'Warranty end date or period (months) is required' }, { status: 400 });
    }

    const startDate = new Date(warrantyStart);
    if (endDate <= startDate) {
      return NextResponse.json({ error: 'Warranty end must be after start date' }, { status: 400 });
    }

    const cat = (category && VALID_CATEGORIES.includes(category)) ? category : 'hardware';
    const wType = (warrantyType && VALID_TYPES.includes(warrantyType)) ? warrantyType : 'manufacturer';

    const registration = await prisma.warrantyRegistration.create({
      data: {
        itemName: itemName.trim(),
        serialNumber: serialNumber?.trim() || null,
        category: cat,
        brand: brand?.trim() || null,
        modelName: modelName?.trim() || null,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        warrantyStart: startDate,
        warrantyEnd: endDate,
        warrantyMonths: warrantyMonths || null,
        warrantyType: wType,
        provider: provider?.trim() || null,
        coverageDetails: coverageDetails?.trim() || null,
        claimProcess: claimProcess?.trim() || null,
        receiptRef: receiptRef?.trim() || null,
        cost: cost ? parseFloat(cost) : null,
        status: computeStatus(endDate),
        notes: notes?.trim() || null,
        assetId: assetId || null,
        customerName: customerName?.trim() || null,
        customerEmail: customerEmail?.trim() || null,
        vendorName: vendorName?.trim() || null,
        registeredBy: registeredBy?.trim() || null,
      },
    });

    return NextResponse.json(registration, { status: 201 });
  } catch (error) {
    console.error('Warranty registration POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT: Update a warranty registration
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Registration ID is required' }, { status: 400 });
    }

    const existing = await prisma.warrantyRegistration.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }

    // Build update data with validation
    const data: Record<string, unknown> = {};
    if (updates.itemName !== undefined) data.itemName = String(updates.itemName).trim();
    if (updates.serialNumber !== undefined) data.serialNumber = updates.serialNumber?.trim() || null;
    if (updates.category && VALID_CATEGORIES.includes(updates.category)) data.category = updates.category;
    if (updates.brand !== undefined) data.brand = updates.brand?.trim() || null;
    if (updates.modelName !== undefined) data.modelName = updates.modelName?.trim() || null;
    if (updates.purchaseDate !== undefined) data.purchaseDate = updates.purchaseDate ? new Date(updates.purchaseDate) : null;
    if (updates.warrantyStart) data.warrantyStart = new Date(updates.warrantyStart);
    if (updates.warrantyEnd) data.warrantyEnd = new Date(updates.warrantyEnd);
    if (updates.warrantyMonths !== undefined) data.warrantyMonths = updates.warrantyMonths || null;
    if (updates.warrantyType && VALID_TYPES.includes(updates.warrantyType)) data.warrantyType = updates.warrantyType;
    if (updates.provider !== undefined) data.provider = updates.provider?.trim() || null;
    if (updates.coverageDetails !== undefined) data.coverageDetails = updates.coverageDetails?.trim() || null;
    if (updates.claimProcess !== undefined) data.claimProcess = updates.claimProcess?.trim() || null;
    if (updates.receiptRef !== undefined) data.receiptRef = updates.receiptRef?.trim() || null;
    if (updates.cost !== undefined) data.cost = updates.cost ? parseFloat(updates.cost) : null;
    if (updates.notes !== undefined) data.notes = updates.notes?.trim() || null;
    if (updates.assetId !== undefined) data.assetId = updates.assetId || null;
    if (updates.customerName !== undefined) data.customerName = updates.customerName?.trim() || null;
    if (updates.customerEmail !== undefined) data.customerEmail = updates.customerEmail?.trim() || null;
    if (updates.vendorName !== undefined) data.vendorName = updates.vendorName?.trim() || null;
    if (updates.status && VALID_STATUSES.includes(updates.status)) data.status = updates.status;

    // Recalculate status if dates changed
    const finalEnd = data.warrantyEnd ? new Date(data.warrantyEnd as string) : new Date(existing.warrantyEnd);
    if (!data.status || (data.status !== 'claimed' && data.status !== 'void')) {
      data.status = computeStatus(finalEnd);
    }

    const updated = await prisma.warrantyRegistration.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Warranty registration PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE: Remove a warranty registration
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Registration ID is required' }, { status: 400 });
    }

    const existing = await prisma.warrantyRegistration.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }

    await prisma.warrantyRegistration.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Warranty registration DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
