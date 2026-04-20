import { NextRequest, NextResponse } from 'next/server';
import { getKBArticle, updateKBArticle, deleteKBArticle } from '@/lib/knowledge-base';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const article = await getKBArticle(id);
    if (!article) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(article);
  } catch (error) {
    console.error('GET /api/knowledge-base/[id] error:', error);
    return NextResponse.json(null);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await request.json();
    await updateKBArticle(id, data);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PUT /api/knowledge-base/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update article' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await deleteKBArticle(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/knowledge-base/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete article' }, { status: 500 });
  }
}
