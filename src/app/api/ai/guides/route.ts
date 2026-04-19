import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const AZURE_AI_ENDPOINT = process.env.AZURE_AI_ENDPOINT || '';
const AZURE_AI_KEY = process.env.AZURE_AI_KEY || '';
const AZURE_AI_MODEL = process.env.AZURE_AI_MODEL || 'grok-4-20-reasoning';

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
    const where = documentId ? { documentId } : {};
    const guides = await prisma.userGuide.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { document: { select: { id: true, fileName: true, fileType: true, fileCategory: true } } },
    });
    return NextResponse.json(guides);
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
      return NextResponse.json({ error: 'documentId is required'}, { status: 400 });
    }

    // Fetch document
    const document = await prisma.document.findUnique({ where: { id: documentId } });
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Determine next version
    const latestGuide = await prisma.userGuide.findFirst({
      where: { documentId },
      orderBy: { version: 'desc' },
    });
    const nextVersion = (latestGuide?.version || 0) + 1;

    const key = apiKey || AZURE_AI_KEY;
    if (!key) {
      return NextResponse.json({ error: 'No AI API key configured' }, { status: 400 });
    }

    // Build the generation prompt
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

    // Call Azure AI with streaming to collect full response
    const response = await fetch(`${AZURE_AI_ENDPOINT}/openai/deployments/${AZURE_AI_MODEL}/chat/completions?api-version=2024-10-21`, {
      method: 'POST',
      headers: { 'api-key': key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: AZURE_AI_MODEL,
        messages: [
          { role: 'system', content: GUIDE_SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.4,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('AI guide generation error:', response.status, errText);
      return NextResponse.json({ error: 'AI guide generation failed' }, { status: 502 });
    }

    const data = await response.json();
    const guideContent = data.choices?.[0]?.message?.content || '';

    if (!guideContent) {
      return NextResponse.json({ error: 'AI returned empty guide content' }, { status: 502 });
    }

    // Extract title from first heading or generate one
    const titleMatch = guideContent.match(/^#\s+(.+)/m);
    const title = titleMatch ? titleMatch[1].replace(/[*_`]/g, '').trim() : `User Guide — ${document.fileName}`;

    // Save guide to database
    const guide = await prisma.userGuide.create({
      data: {
        documentId: document.id,
        title,
        content: guideContent,
        version: nextVersion,
        status: 'published',
        generatedBy: 'ai',
      },
      include: { document: { select: { id: true, fileName: true, fileType: true, fileCategory: true } } },
    });

    return NextResponse.json(guide, { status: 201 });
  } catch (error) {
    console.error('Guide generation error:', error);
    return NextResponse.json({ error: 'Failed to generate guide' }, { status: 500 });
  }
}
