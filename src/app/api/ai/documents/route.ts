import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

// Raw SQL approach — the Document table exists in SQLite but PrismaClient
// was generated before the model was added, so we use raw queries.

interface DocRow {
  id: string;
  fileName: string;
  fileType: string;
  fileCategory: string;
  fileSize: number;
  extractedText: string;
  uploadedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

interface GuideRow {
  id: string;
  title: string;
  version: number;
  status: string;
  createdAt: string;
}

// GET — list all documents
export async function GET() {
  try {
    const documents = await prisma.$queryRawUnsafe<DocRow[]>(
      `SELECT id, fileName, fileType, fileCategory, fileSize, extractedText, uploadedBy, createdAt, updatedAt FROM Document ORDER BY createdAt DESC`
    );
    // Attach guides for each document
    const results = await Promise.all(documents.map(async (doc) => {
      const guides = await prisma.$queryRawUnsafe<GuideRow[]>(
        `SELECT id, title, version, status, createdAt FROM UserGuide WHERE documentId = ? ORDER BY version DESC`, doc.id
      );
      return { ...doc, guides };
    }));
    return NextResponse.json(results);
  } catch (error) {
    console.error('List documents error:', error);
    return NextResponse.json({ error: 'Failed to list documents' }, { status: 500 });
  }
}

// POST — save uploaded document to database
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileName, fileType, fileCategory, fileSize, extractedText, uploadedBy } = body;

    if (!fileName || !fileType || !extractedText) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await prisma.$executeRawUnsafe(
      `INSERT INTO Document (id, fileName, fileType, fileCategory, fileSize, extractedText, uploadedBy, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id, fileName, fileType, fileCategory || 'document', fileSize || 0, extractedText, uploadedBy || 'system', now, now
    );

    const document = { id, fileName, fileType, fileCategory: fileCategory || 'document', fileSize: fileSize || 0, extractedText, uploadedBy: uploadedBy || 'system', createdAt: now, updatedAt: now, guides: [] };

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error('Save document error:', error);
    return NextResponse.json({ error: 'Failed to save document' }, { status: 500 });
  }
}

// DELETE — delete a document and its guides
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });
    await prisma.$executeRawUnsafe(`DELETE FROM UserGuide WHERE documentId = ?`, id);
    await prisma.$executeRawUnsafe(`DELETE FROM Document WHERE id = ?`, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete document error:', error);
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 });
  }
}
