import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

const AZURE_AI_ENDPOINT = process.env.AZURE_AI_ENDPOINT || '';
const AZURE_AI_KEY = process.env.AZURE_AI_KEY || '';
const AZURE_AI_MODEL = process.env.AZURE_AI_MODEL || 'gpt-40-mini';
const AZURE_AI_SECONDARY_KEY = process.env.AZURE_AI_SECONDARY_KEY || '';
const AZURE_AI_SECONDARY_MODEL = process.env.AZURE_AI_SECONDARY_MODEL || 'grok-4-20-reasoning';

interface DocRow {
  id: string;
  fileName: string;
  fileType: string;
  fileCategory: string;
  fileSize: number;
  extractedText: string;
}

interface GuideRow {
  id: string;
  documentId: string;
  title: string;
  content: string;
  version: number;
  status: string;
  generatedBy: string;
  createdAt: string;
  updatedAt: string;
  docId?: string;
  docFileName?: string;
  docFileType?: string;
  docFileCategory?: string;
}

const GUIDE_SYSTEM_PROMPT = `You are a professional technical documentation writer at Unitech. Your job is to generate comprehensive, easy-to-follow user guides from uploaded documents.

GUIDE FORMAT REQUIREMENTS:
1. **Title Page**: Include a clear title, version number, date, and document category
2. **Table of Contents**: List all sections with clear hierarchy
3. **Overview**: Brief summary of what the document covers and who it's for
4. **Prerequisites**: List any requirements, tools, or knowledge needed
5. **Step-by-Step Instructions**: 
   - Number every step clearly (Step 1, Step 2, etc.)
   - Each step must have a clear action verb
   - Include expected outcomes after each step
   - Add 💡 **Tip** boxes for best practices
   - Add ⚠️ **Warning** boxes for common pitfalls
   - Add 📝 **Note** boxes for important information
6. **Screenshots & Visual Indicators**: 
   - Use 📸 [Screenshot: description] placeholders where screenshots would be helpful
   - Use icons throughout: ✅ for success, ❌ for errors, 🔧 for settings, 📁 for files, 🔗 for links, 🖥️ for UI elements
7. **Troubleshooting**: Common issues and their solutions
8. **FAQ**: Frequently asked questions based on the content
9. **Related Resources**: 
   - Link to official documentation with 📚 icon
   - Reference related articles with 📖 icon
   - Suggest related tools with 🛠️ icon
10. **Version History**: Include version number and change summary
11. **Glossary**: Define any technical terms used

STYLE RULES:
- Use professional but approachable language
- Write for users who may not be technical experts
- Keep sentences short and clear
- Use bullet points and numbered lists extensively
- Bold key terms and UI element names
- Use tables for comparing options or listing parameters
- Include a "Quick Start" section for experienced users
- End with a "Summary" section listing key takeaways

OUTPUT FORMAT: Markdown with rich formatting.`;

// GET — list all guides
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const documentId = searchParams.get('documentId');

  try {
    let guides: GuideRow[];
    if (documentId) {
      guides = await prisma.$queryRawUnsafe<GuideRow[]>(
        `SELECT g.id, g.documentId, g.title, g.content, g.version, g.status, g.generatedBy, g.createdAt, g.updatedAt,
                d.id as docId, d.fileName as docFileName, d.fileType as docFileType, d.fileCategory as docFileCategory
         FROM UserGuide g LEFT JOIN Document d ON g.documentId = d.id
         WHERE g.documentId = ? ORDER BY g.createdAt DESC`, documentId
      );
    } else {
      guides = await prisma.$queryRawUnsafe<GuideRow[]>(
        `SELECT g.id, g.documentId, g.title, g.content, g.version, g.status, g.generatedBy, g.createdAt, g.updatedAt,
                d.id as docId, d.fileName as docFileName, d.fileType as docFileType, d.fileCategory as docFileCategory
         FROM UserGuide g LEFT JOIN Document d ON g.documentId = d.id
         ORDER BY g.createdAt DESC`
      );
    }
    // Shape the response to match expected format
    const result = guides.map(g => ({
      id: g.id, documentId: g.documentId, title: g.title, content: g.content,
      version: g.version, status: g.status, generatedBy: g.generatedBy,
      createdAt: g.createdAt, updatedAt: g.updatedAt,
      document: { id: g.docId || g.documentId, fileName: g.docFileName || '', fileType: g.docFileType || '', fileCategory: g.docFileCategory || '' },
    }));
    return NextResponse.json(result);
  } catch (error) {
    console.error('List guides error:', error);
    return NextResponse.json({ error: 'Failed to list guides' }, { status: 500 });
  }
}

// POST — generate a guide from a document using AI
export async function POST(request: NextRequest) {
  try {
    const { documentId, apiKey, customInstructions } = await request.json();

    if (!documentId) {
      return NextResponse.json({ error: 'documentId is required' }, { status: 400 });
    }

    // Fetch document via raw SQL
    const docs = await prisma.$queryRawUnsafe<DocRow[]>(
      `SELECT id, fileName, fileType, fileCategory, fileSize, extractedText FROM Document WHERE id = ?`, documentId
    );
    if (docs.length === 0) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    const document = docs[0]!;

    // Determine next version
    const versionRows = await prisma.$queryRawUnsafe<{ maxVer: number | null }[]>(
      `SELECT MAX(version) as maxVer FROM UserGuide WHERE documentId = ?`, documentId
    );
    const nextVersion = ((versionRows[0]?.maxVer) || 0) + 1;

    const key = apiKey || AZURE_AI_KEY;
    const secondaryKey = apiKey || AZURE_AI_SECONDARY_KEY;
    if (!key && !secondaryKey) {
      return NextResponse.json({ error: 'No AI API key configured' }, { status: 400 });
    }

    let userPrompt = `Generate a comprehensive, professional user guide from the following uploaded document.

DOCUMENT INFO:
- File Name: ${document.fileName}
- File Type: ${document.fileType} (${document.fileCategory})
- File Size: ${(document.fileSize / 1024).toFixed(1)} KB
- Version: v${nextVersion}
- Date: ${new Date().toISOString().split('T')[0]}

DOCUMENT CONTENT:
---
${document.extractedText}
---

Generate a complete, professional user guide following all the format requirements. Make it comprehensive, well-organized, and easy to follow.`;

    if (customInstructions) {
      userPrompt += `\n\nADDITIONAL INSTRUCTIONS:\n${customInstructions}`;
    }

    const guideMessages = [
      { role: 'system', content: GUIDE_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ];

    let data;
    // Try primary model first
    if (key) {
      const response = await fetch(`${AZURE_AI_ENDPOINT}/openai/deployments/${AZURE_AI_MODEL}/chat/completions?api-version=2024-10-21`, {
        method: 'POST',
        headers: { 'api-key': key, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: AZURE_AI_MODEL,
          messages: guideMessages,
          temperature: 0.4,
          max_tokens: 4096,
        }),
      });

      if (response.ok) {
        data = await response.json();
      } else {
        console.error('AI guide primary error:', response.status);
      }
    }

    // Fallback to secondary model
    if (!data && secondaryKey) {
      const response = await fetch(`${AZURE_AI_ENDPOINT}/openai/deployments/${AZURE_AI_SECONDARY_MODEL}/chat/completions?api-version=2024-10-21`, {
        method: 'POST',
        headers: { 'api-key': secondaryKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: AZURE_AI_SECONDARY_MODEL,
          messages: guideMessages,
          temperature: 0.4,
          max_tokens: 4096,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('AI guide secondary error:', response.status, errText);
        return NextResponse.json({ error: 'AI guide generation failed' }, { status: 502 });
      }
      data = await response.json();
    }

    if (!data) {
      return NextResponse.json({ error: 'AI guide generation failed — no models available' }, { status: 502 });
    }
    const guideContent = data.choices?.[0]?.message?.content || '';

    if (!guideContent) {
      return NextResponse.json({ error: 'AI returned empty guide content' }, { status: 502 });
    }

    const titleMatch = guideContent.match(/^#\s+(.+)/m);
    const title = titleMatch ? titleMatch[1].replace(/[*_`]/g, '').trim() : `User Guide — ${document.fileName}`;

    const guideId = crypto.randomUUID();
    const now = new Date().toISOString();

    await prisma.$executeRawUnsafe(
      `INSERT INTO UserGuide (id, documentId, title, content, version, status, generatedBy, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      guideId, document.id, title, guideContent, nextVersion, 'published', 'ai', now, now
    );

    const guide = {
      id: guideId, documentId: document.id, title, content: guideContent,
      version: nextVersion, status: 'published', generatedBy: 'ai',
      createdAt: now, updatedAt: now,
      document: { id: document.id, fileName: document.fileName, fileType: document.fileType, fileCategory: document.fileCategory },
    };

    return NextResponse.json(guide, { status: 201 });
  } catch (error) {
    console.error('Guide generation error:', error);
    return NextResponse.json({ error: 'Failed to generate guide' }, { status: 500 });
  }
}
