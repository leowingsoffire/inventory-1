import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Gather live app data summary for Uni AI context injection
export async function GET() {
  try {
    const assetCount = await prisma.asset.count();
    const assetsByStatus = await prisma.asset.groupBy({ by: ['status'], _count: true });
    const assetsByCategory = await prisma.asset.groupBy({ by: ['category'], _count: true });
    const employeeCount = await prisma.employee.count({ where: { status: 'active' } });
    const maintenanceOpen = await prisma.maintenance.count({ where: { status: { in: ['open', 'in-progress'] } } });
    const maintenanceByPriority = await prisma.maintenance.groupBy({
      by: ['priority'],
      where: { status: { in: ['open', 'in-progress'] } },
      _count: true,
    });
    const warrantyExpiring30 = await prisma.asset.count({
      where: {
        warrantyEnd: {
          gte: new Date(),
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      },
    });
    const warrantyExpiring90 = await prisma.asset.count({
      where: {
        warrantyEnd: {
          gte: new Date(),
          lte: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        },
      },
    });
    const customerCount = await prisma.customer.count({ where: { status: 'active' } });
    const vendorCount = await prisma.vendor.count({ where: { status: 'active' } });
    const invoiceStats = await prisma.invoice.groupBy({
      by: ['status'],
      _sum: { totalAmount: true },
      _count: true,
    });
    const changeRequests = await prisma.changeRequest.groupBy({ by: ['state'], _count: true });
    const complianceStats = await prisma.pDPAAssessment.groupBy({ by: ['status'], _count: true });
    const recentActivity = await prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { action: true, entity: true, details: true, createdAt: true },
    });
    const companyProfile = await prisma.companyProfile.findFirst();

    // Build warranty-at-risk assets list
    const warrantyRiskAssets = await prisma.asset.findMany({
      where: {
        warrantyEnd: {
          gte: new Date(),
          lte: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        },
      },
      select: { name: true, assetTag: true, warrantyEnd: true, category: true },
      orderBy: { warrantyEnd: 'asc' },
      take: 10,
    });

    // Overdue invoices
    const overdueInvoices = await prisma.invoice.findMany({
      where: { status: 'overdue' },
      select: { invoiceNumber: true, totalAmount: true, dueDate: true },
      take: 5,
    });

    // High-priority open tickets
    const urgentTickets = await prisma.maintenance.findMany({
      where: { status: { in: ['open', 'in-progress'] }, priority: { in: ['high', 'critical'] } },
      select: { title: true, priority: true, status: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // Pending change requests
    const pendingChanges = await prisma.changeRequest.findMany({
      where: { state: { in: ['new', 'review', 'authorize'] } },
      select: { number: true, shortDescription: true, state: true, priority: true },
      take: 5,
    });

    // Non-compliant PDPA controls
    const nonCompliantControls = await prisma.pDPAAssessment.findMany({
      where: { status: { in: ['not-started', 'non-compliant'] } },
      select: { controlRef: true, controlTitle: true, status: true, riskLevel: true },
      take: 10,
    });

    const context = {
      company: companyProfile?.companyName || 'Unitech IT System Pte Ltd',
      summary: {
        totalAssets: assetCount,
        assetsByStatus: assetsByStatus.map((s: any) => ({ status: s.status, count: s._count })),
        assetsByCategory: assetsByCategory.map((s: any) => ({ category: s.category, count: s._count })),
        activeEmployees: employeeCount,
        openTickets: maintenanceOpen,
        ticketsByPriority: maintenanceByPriority.map((p: any) => ({ priority: p.priority, count: p._count })),
        warrantyExpiring30,
        warrantyExpiring90,
        activeCustomers: customerCount,
        activeVendors: vendorCount,
        invoicesByStatus: invoiceStats.map((s: any) => ({ status: s.status, count: s._count, total: s._sum.totalAmount || 0 })),
        changesByState: changeRequests.map((s: any) => ({ state: s.state, count: s._count })),
        complianceByStatus: complianceStats.map((s: any) => ({ status: s.status, count: s._count })),
      },
      alerts: {
        warrantyRiskAssets: warrantyRiskAssets.map((a: any) => ({
          name: a.name,
          tag: a.assetTag,
          expiresOn: a.warrantyEnd?.toISOString().split('T')[0],
          category: a.category,
        })),
        overdueInvoices: overdueInvoices.map((i: any) => ({
          number: i.invoiceNumber,
          amount: i.totalAmount,
          dueDate: i.dueDate?.toISOString().split('T')[0],
        })),
        urgentTickets: urgentTickets.map((t: any) => ({
          title: t.title,
          priority: t.priority,
          status: t.status,
          created: t.createdAt.toISOString().split('T')[0],
        })),
        pendingChanges: pendingChanges.map((c: any) => ({
          number: c.number,
          description: c.shortDescription,
          state: c.state,
          priority: c.priority,
        })),
        nonCompliantControls: nonCompliantControls.map((c: any) => ({
          ref: c.controlRef,
          title: c.controlTitle,
          status: c.status,
          risk: c.riskLevel,
        })),
      },
      recentActivity: recentActivity.map((a: any) => ({
        action: a.action,
        entity: a.entity,
        details: a.details,
        time: a.createdAt.toISOString(),
      })),
    };

    return NextResponse.json(context);
  } catch (error) {
    console.error('AI context error:', error);
    return NextResponse.json({ error: 'Failed to gather context' }, { status: 500 });
  }
}
