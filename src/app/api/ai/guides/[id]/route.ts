import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

interface GuideWithDoc {
  id: string;
  documentId: string;
  title: string;
  content: string;
  version: number;
  status: string;
  generatedBy: string;
  createdAt: string;
  updatedAt: string;
  docId: string;
  docFileName: string;
  docFileType: string;
  docFileCategory: string;
}

// GET — single guide
export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const rows = await prisma.$queryRawUnsafe<GuideWithDoc[]>(
      `SELECT g.id, g.documentId, g.title, g.content, g.version, g.status, g.generatedBy, g.createdAt, g.updatedAt,
              d.id as docId, d.fileName as docFileName, d.fileType as docFileType, d.fileCategory as docFileCategory
       FROM UserGuide g LEFT JOIN Document d ON g.documentId = d.id WHERE g.id = ?`, id
    );
    if (rows.length === 0) return NextResponse.json({ error: 'Guide not found' }, { status: 404 });
    const g = rows[0]!;
    return NextResponse.json({
      id: g.id, documentId: g.documentId, title: g.title, content: g.content,
      version: g.version, status: g.status, generatedBy: g.generatedBy,
      createdAt: g.createdAt, updatedAt: g.updatedAt,
      document: { id: g.docId, fileName: g.docFileName, fileType: g.docFileType, fileCategory: g.docFileCategory },
    });
  } catch (error) {
    console.error('Get guide error:', error);
    return NextResponse.json({ error: 'Failed to get guide' }, { status: 500 });
  }
}

// DELETE — delete a guide
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.$executeRawUnsafe(`DELETE FROM UserGuide WHERE id = ?`, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete guide error:', error);
    return NextResponse.json({ error: 'Failed to delete guide' }, { status: 500 });
  }
}
