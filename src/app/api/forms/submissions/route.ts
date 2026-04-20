import { NextRequest, NextResponse } from 'next/server';
import { getFormSubmissions, createFormSubmission } from '@/lib/custom-forms';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const result = await getFormSubmissions({
      formId: searchParams.get('formId') || undefined,
      entityType: searchParams.get('entityType') || undefined,
      entityId: searchParams.get('entityId') || undefined,
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/forms/submissions error:', error);
    return NextResponse.json({ submissions: [], total: 0 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const id = await createFormSubmission(data);
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    console.error('POST /api/forms/submissions error:', error);
    return NextResponse.json({ error: 'Failed to create submission' }, { status: 500 });
  }
}
