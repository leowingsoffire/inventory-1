import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { executeRulesForTrigger } from '@/lib/automation';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const employee = await prisma.employee.findUnique({ where: { id } });
    if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    return NextResponse.json(employee);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch employee' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await request.json();
    const previous = await prisma.employee.findUnique({ where: { id } });
    const employee = await prisma.employee.update({ where: { id }, data });
    // Automation: offboarding trigger when status changes to inactive
    if (previous?.status === 'active' && employee.status === 'inactive') {
      try {
        await executeRulesForTrigger('employee-offboarded', {
          employeeId: employee.id, name: employee.name, email: employee.email,
          department: employee.department, title: `Employee offboarded: ${employee.name}`,
        }, employee.id, 'employee');
      } catch { /* non-critical */ }
    }
    return NextResponse.json(employee);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update employee' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.employee.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete employee' }, { status: 500 });
  }
}
