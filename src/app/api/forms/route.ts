import { NextRequest, NextResponse } from 'next/server';
import { getFormTemplates, createFormTemplate } from '@/lib/custom-forms';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const result = await getFormTemplates({
      category: searchParams.get('category') || undefined,
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/forms error:', error);
    return NextResponse.json({ error: 'Failed to fetch forms' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const id = await createFormTemplate(data);
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    console.error('POST /api/forms error:', error);
    return NextResponse.json({ error: 'Failed to create form' }, { status: 500 });
  }
}
