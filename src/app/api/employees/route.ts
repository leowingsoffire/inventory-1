import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { executeRulesForTrigger } from '@/lib/automation';

export async function GET() {
  try {
    const employees = await prisma.employee.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json(employees);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch employees' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const employee = await prisma.employee.create({ data });
    // Automation: onboarding trigger
    try {
      await executeRulesForTrigger('employee-onboarded', {
        employeeId: employee.id, name: employee.name, email: employee.email,
        department: employee.department, title: `New employee: ${employee.name}`,
      }, employee.id, 'employee');
    } catch { /* non-critical */ }
    return NextResponse.json(employee, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create employee' }, { status: 500 });
  }
}
