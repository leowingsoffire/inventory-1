import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const [
      totalAssets,
      assetsByStatus,
      assetsByCategory,
      activeEmployees,
      openTickets,
      ticketsByPriority,
      activeCustomers,
      invoicesByStatus,
      changesByState,
      recentActivity,
    ] = await Promise.all([
      prisma.asset.count(),
      prisma.asset.groupBy({ by: ['status'], _count: true }),
      prisma.asset.groupBy({ by: ['category'], _count: true }),
      prisma.employee.count({ where: { status: 'active' } }),
      prisma.maintenance.count({ where: { status: { in: ['open', 'inProgress'] } } }),
      prisma.maintenance.groupBy({ by: ['priority'], _count: true, where: { status: { in: ['open', 'inProgress'] } } }),
      prisma.customer.count({ where: { status: 'active' } }),
      prisma.invoice.groupBy({ by: ['status'], _count: true, _sum: { totalAmount: true } }),
      prisma.changeRequest.groupBy({ by: ['state'], _count: true }),
      prisma.activityLog.findMany({ orderBy: { createdAt: 'desc' }, take: 10 }),
    ]);

    // Warranty expiring
    const now = new Date();
    const in30 = new Date(now.getTime() + 30 * 86400000);
    const in90 = new Date(now.getTime() + 90 * 86400000);
    const [warrantyExpiring30, warrantyExpiring90] = await Promise.all([
      prisma.asset.count({ where: { warrantyEnd: { gte: now, lte: in30 } } }),
      prisma.asset.count({ where: { warrantyEnd: { gte: now, lte: in90 } } }),
    ]);

    // Compute quick stats
    const statusMap: Record<string, number> = {};
    assetsByStatus.forEach((s) => { statusMap[s.status] = s._count; });

    const categoryList = assetsByCategory.map((c) => ({
      name: c.category,
      value: c._count,
    }));

    const revenue = await prisma.invoice.aggregate({
      where: { status: 'paid' },
      _sum: { totalAmount: true },
    });

    const vendorCount = await prisma.vendor.count({ where: { status: 'active' } });
    const changeCount = await prisma.changeRequest.count();

    return NextResponse.json({
      totalAssets,
      assigned: statusMap['assigned'] || 0,
      available: statusMap['available'] || 0,
      maintenance: statusMap['maintenance'] || 0,
      employees: activeEmployees,
      openTickets,
      changes: changeCount,
      customers: activeCustomers,
      vendors: vendorCount,
      revenue: revenue._sum.totalAmount || 0,
      warrantyExpiring30,
      warrantyExpiring90,
      categoryData: categoryList,
      ticketsByPriority: ticketsByPriority.map((p) => ({
        priority: p.priority,
        count: p._count,
      })),
      invoicesByStatus: invoicesByStatus.map((s) => ({
        status: s.status,
        count: s._count,
        total: s._sum.totalAmount || 0,
      })),
      changesByState: changesByState.map((c) => ({
        state: c.state,
        count: c._count,
      })),
      recentActivity: recentActivity.map((a) => ({
        action: a.action,
        entity: a.entity,
        details: a.details,
        time: a.createdAt.toISOString(),
        user: a.userId || 'System',
      })),
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({
      totalAssets: 0, assigned: 0, available: 0, maintenance: 0,
      employees: 0, openTickets: 0, changes: 0, customers: 0, vendors: 0, revenue: 0,
      warrantyExpiring30: 0, warrantyExpiring90: 0,
      categoryData: [], ticketsByPriority: [], invoicesByStatus: [],
      changesByState: [], recentActivity: [],
    });
  }
}
