import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

type ImportTarget = 'customers' | 'vendors' | 'assets' | 'employees' | 'invoices' | 'warranty';

// Parse CSV text (handles both CSV and TSV from Excel)
function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];
  const sep = lines[0]!.includes('\t') ? '\t' : ',';
  const headers = lines[0]!.split(sep).map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase().replace(/\s+/g, '_'));
  return lines.slice(1).map(line => {
    const values = line.split(sep).map(v => v.trim().replace(/^["']|["']$/g, ''));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = values[i] || ''; });
    return row;
  });
}

function safeFloat(v: string | undefined): number | null {
  if (!v) return null;
  const n = parseFloat(v.replace(/[^0-9.-]/g, ''));
  return isNaN(n) ? null : n;
}

function safeDate(v: string | undefined): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

function safeInt(v: string | undefined): number | null {
  if (!v) return null;
  const n = parseInt(v.replace(/[^0-9-]/g, ''), 10);
  return isNaN(n) ? null : n;
}

const importHandlers: Record<ImportTarget, (rows: Record<string, string>[]) => Promise<{ imported: number; skipped: number; errors: string[] }>> = {
  customers: async (rows) => {
    let imported = 0, skipped = 0;
    const errors: string[] = [];
    for (const row of rows) {
      try {
        const name = row.company_name || row.companyname || row.name || row.company || '';
        if (!name) { skipped++; continue; }
        await prisma.customer.upsert({
          where: { uen: row.uen || `IMPORT-${name.replace(/\s/g, '-').substring(0, 20)}` },
          update: {},
          create: {
            companyName: name,
            uen: row.uen || undefined,
            address: row.address || undefined,
            postalCode: row.postal_code || row.postalcode || undefined,
            contactPerson: row.contact_person || row.contactperson || row.contact || undefined,
            contactEmail: row.contact_email || row.contactemail || row.email || undefined,
            contactPhone: row.contact_phone || row.contactphone || row.phone || undefined,
            website: row.website || undefined,
            industry: row.industry || undefined,
            status: row.status || 'active',
            paymentTerms: safeInt(row.payment_terms) ?? 30,
          },
        });
        imported++;
      } catch (e) { errors.push(`Row: ${row.company_name || row.name}: ${e instanceof Error ? e.message : 'Unknown error'}`); skipped++; }
    }
    return { imported, skipped, errors };
  },

  vendors: async (rows) => {
    let imported = 0, skipped = 0;
    const errors: string[] = [];
    for (const row of rows) {
      try {
        const name = row.company_name || row.companyname || row.name || row.company || '';
        if (!name) { skipped++; continue; }
        await prisma.vendor.upsert({
          where: { uen: row.uen || `VIMP-${name.replace(/\s/g, '-').substring(0, 20)}` },
          update: {},
          create: {
            companyName: name,
            uen: row.uen || undefined,
            address: row.address || undefined,
            contactPerson: row.contact_person || row.contactperson || row.contact || undefined,
            contactEmail: row.contact_email || row.contactemail || row.email || undefined,
            contactPhone: row.contact_phone || row.contactphone || row.phone || undefined,
            category: row.category || undefined,
            status: row.status || 'active',
            paymentTerms: safeInt(row.payment_terms) ?? 30,
          },
        });
        imported++;
      } catch (e) { errors.push(`Row: ${name}: ${e instanceof Error ? e.message : 'Unknown error'}`); skipped++; }
    }
    return { imported, skipped, errors };
  },

  assets: async (rows) => {
    let imported = 0, skipped = 0;
    const errors: string[] = [];
    for (const row of rows) {
      try {
        const tag = row.asset_tag || row.assettag || row.tag || '';
        const name = row.name || row.asset_name || row.assetname || '';
        if (!tag || !name) { skipped++; continue; }
        const category = row.category || 'other';
        const type = row.type || category;
        await prisma.asset.upsert({
          where: { assetTag: tag },
          update: {},
          create: {
            assetTag: tag, name, category, type,
            brand: row.brand || undefined,
            model: row.model || undefined,
            serialNumber: row.serial_number || row.serialnumber || row.serial || undefined,
            status: row.status || 'available',
            condition: row.condition || 'good',
            location: row.location || undefined,
            purchaseDate: safeDate(row.purchase_date || row.purchasedate),
            purchasePrice: safeFloat(row.purchase_price || row.purchaseprice || row.price),
            warrantyEnd: safeDate(row.warranty_end || row.warrantyend || row.warranty),
            notes: row.notes || undefined,
          },
        });
        imported++;
      } catch (e) { errors.push(`Row: ${row.asset_tag || row.name}: ${e instanceof Error ? e.message : 'Unknown error'}`); skipped++; }
    }
    return { imported, skipped, errors };
  },

  employees: async (rows) => {
    let imported = 0, skipped = 0;
    const errors: string[] = [];
    for (const row of rows) {
      const empId = row.employee_id || row.employeeid || row.emp_id || row.id || '';
      try {
        const name = row.name || row.employee_name || '';
        const email = row.email || '';
        if (!empId || !name || !email) { skipped++; continue; }
        await prisma.employee.upsert({
          where: { employeeId: empId },
          update: {},
          create: {
            employeeId: empId, name, email,
            department: row.department || 'General',
            position: row.position || row.title || 'Staff',
            phone: row.phone || undefined,
            status: row.status || 'active',
            joinDate: safeDate(row.join_date || row.joindate),
          },
        });
        imported++;
      } catch (e) { errors.push(`Row: ${empId}: ${e instanceof Error ? e.message : 'Unknown error'}`); skipped++; }
    }
    return { imported, skipped, errors };
  },

  invoices: async (rows) => {
    let imported = 0, skipped = 0;
    const errors: string[] = [];
    for (const row of rows) {
      try {
        const inv = row.invoice_number || row.invoicenumber || row.invoice || '';
        if (!inv) { skipped++; continue; }
        const customerName = row.customer || row.customer_name || row.customername || '';
        let customer = await prisma.customer.findFirst({ where: { companyName: customerName } });
        if (!customer) {
          customer = await prisma.customer.create({ data: { companyName: customerName || 'Imported Customer' } });
        }
        await prisma.invoice.upsert({
          where: { invoiceNumber: inv },
          update: {},
          create: {
            invoiceNumber: inv,
            customerId: customer.id,
            type: row.type || 'invoice',
            status: row.status || 'draft',
            subtotal: safeFloat(row.subtotal) ?? 0,
            gstRate: safeFloat(row.gst_rate || row.gstrate) ?? 9,
            gstAmount: safeFloat(row.gst_amount || row.gstamount) ?? 0,
            totalAmount: safeFloat(row.total || row.total_amount || row.totalamount) ?? 0,
            paidAmount: safeFloat(row.paid || row.paid_amount || row.paidamount) ?? 0,
            currency: row.currency || 'SGD',
            notes: row.notes || undefined,
          },
        });
        imported++;
      } catch (e) { errors.push(`Row: ${row.invoice_number}: ${e instanceof Error ? e.message : 'Unknown error'}`); skipped++; }
    }
    return { imported, skipped, errors };
  },

  warranty: async (rows) => {
    let imported = 0, skipped = 0;
    const errors: string[] = [];
    for (const row of rows) {
      try {
        const tag = row.asset_tag || row.assettag || row.tag || '';
        if (!tag) { skipped++; continue; }
        const asset = await prisma.asset.findUnique({ where: { assetTag: tag } });
        if (!asset) { errors.push(`Asset tag not found: ${tag}`); skipped++; continue; }
        // Update warranty date on the asset
        const warrantyEnd = safeDate(row.warranty_end || row.warrantyend || row.expiry || row.warranty);
        if (warrantyEnd) {
          await prisma.asset.update({ where: { id: asset.id }, data: { warrantyEnd } });
        }
        imported++;
      } catch (e) { errors.push(`Row: ${row.asset_tag}: ${e instanceof Error ? e.message : 'Unknown error'}`); skipped++; }
    }
    return { imported, skipped, errors };
  },
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const target = formData.get('target') as ImportTarget | null;

    if (!file || !target) {
      return NextResponse.json({ error: 'File and target are required' }, { status: 400 });
    }

    const validTargets: ImportTarget[] = ['customers', 'vendors', 'assets', 'employees', 'invoices', 'warranty'];
    if (!validTargets.includes(target)) {
      return NextResponse.json({ error: 'Invalid import target' }, { status: 400 });
    }

    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });
    }

    const text = await file.text();
    const rows = parseCSV(text);

    if (rows.length === 0) {
      return NextResponse.json({ error: 'No data rows found in file. Ensure CSV/TSV format with headers.' }, { status: 400 });
    }

    const handler = importHandlers[target];
    const result = await handler(rows);

    return NextResponse.json({
      success: true,
      target,
      totalRows: rows.length,
      imported: result.imported,
      skipped: result.skipped,
      errors: result.errors.slice(0, 10),
    });
  } catch {
    return NextResponse.json({ error: 'Failed to process import' }, { status: 500 });
  }
}
