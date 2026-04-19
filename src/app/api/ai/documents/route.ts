import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// GET — list all documents
export async function GET() {
  try {
    const documents = await prisma.document.findMany({
      orderBy: { createdAt: 'desc' },
      include: { guides: { select: { id: true, title: true, version: true, status: true, createdAt: true } } },
    });
    return NextResponse.json(documents);
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

    const document = await prisma.document.create({
      data: {
        fileName,
        fileType,
        fileCategory: fileCategory || 'document',
        fileSize: fileSize || 0,
        extractedText,
        uploadedBy: uploadedBy || 'system',
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error('Save document error:', error);
    return NextResponse.json({ error: 'Failed to save document' }, { status: 500 });
  }
}
