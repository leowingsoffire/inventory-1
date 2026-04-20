import { NextRequest, NextResponse } from 'next/server';
import { getContract, updateContract, deleteContract } from '@/lib/contracts';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const contract = await getContract(id);
    if (!contract) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(contract);
  } catch (error) {
    console.error('GET /api/contracts/[id] error:', error);
    return NextResponse.json(null);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await request.json();
    await updateContract(id, data);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PUT /api/contracts/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update contract' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await deleteContract(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/contracts/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete contract' }, { status: 500 });
  }
}
