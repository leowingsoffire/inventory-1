import { NextRequest, NextResponse } from 'next/server';
import { getKBArticles, createKBArticle } from '@/lib/knowledge-base';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const result = await getKBArticles({
      search: searchParams.get('search') || undefined,
      category: searchParams.get('category') || undefined,
      status: searchParams.get('status') || undefined,
      limit: parseInt(searchParams.get('limit') || '50', 10),
      offset: parseInt(searchParams.get('offset') || '0', 10),
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error('GET /api/knowledge-base error:', error);
    return NextResponse.json({ articles: [], total: 0 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const id = await createKBArticle(data);
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    console.error('POST /api/knowledge-base error:', error);
    return NextResponse.json({ error: 'Failed to create article' }, { status: 500 });
  }
}
