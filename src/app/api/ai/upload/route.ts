import { NextRequest, NextResponse } from 'next/server';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const ALLOWED_TYPES: Record<string, string> = {
  // Word
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/msword': 'doc',
  // Excel
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-excel': 'xls',
  // PowerPoint
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'application/vnd.ms-powerpoint': 'ppt',
  // PDF
  'application/pdf': 'pdf',
  // Images
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  // CSV / Text
  'text/csv': 'csv',
  'text/plain': 'txt',
};

async function extractDocx(buffer: Buffer): Promise<string> {
  const mammoth = await import('mammoth');
  const result = await mammoth.extractRawText({ buffer });
  return result.value || '';
}

async function extractExcel(buffer: Buffer): Promise<string> {
  const XLSX = await import('xlsx');
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const lines: string[] = [];
  for (const sheetName of workbook.SheetNames) {
    lines.push(`\n--- Sheet: ${sheetName} ---`);
    const sheet = workbook.Sheets[sheetName];
    if (sheet) {
      const csv = XLSX.utils.sheet_to_csv(sheet);
      lines.push(csv);
    }
  }
  return lines.join('\n');
}

async function extractPptx(buffer: Buffer): Promise<string> {
  const JSZip = (await import('jszip')).default;
  const zip = await JSZip.loadAsync(buffer);
  const texts: string[] = [];

  // PPTX slides are in ppt/slides/slide*.xml
  const slideFiles = Object.keys(zip.files)
    .filter(f => /^ppt\/slides\/slide\d+\.xml$/.test(f))
    .sort();

  for (const slideFile of slideFiles) {
    const xml = await zip.files[slideFile]!.async('text');
    // Extract text from XML tags like <a:t>text</a:t>
    const matches = xml.match(/<a:t>([^<]*)<\/a:t>/g);
    if (matches) {
      const slideNum = slideFile.match(/slide(\d+)/)?.[1] || '?';
      const slideText = matches.map(m => m.replace(/<\/?a:t>/g, '')).join(' ');
      texts.push(`[Slide ${slideNum}] ${slideText}`);
    }
  }
  return texts.join('\n\n') || 'No text content found in presentation.';
}

async function extractPdf(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require('pdf-parse');
  const data = await pdfParse(buffer);
  return data.text || '';
}

function extractImageInfo(fileName: string, fileSize: number, mimeType: string): string {
  return `[Image attached: ${fileName} (${mimeType}, ${(fileSize / 1024).toFixed(1)} KB)]`;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large. Maximum 10 MB.' }, { status: 400 });
    }

    const fileType = ALLOWED_TYPES[file.type];
    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    // Also allow by extension if MIME type not recognized
    const knownExts = ['docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt', 'pdf', 'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'csv', 'txt'];
    if (!fileType && !knownExts.includes(ext)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type || ext}. Supported: Word, Excel, PowerPoint, PDF, Images, CSV, Text.` },
        { status: 400 }
      );
    }

    const resolvedType = fileType || ext;
    const buffer = Buffer.from(await file.arrayBuffer());

    let extractedText = '';
    let previewDataUrl: string | null = null;
    let fileCategory = 'document';

    switch (resolvedType) {
      case 'docx':
      case 'doc':
        extractedText = await extractDocx(buffer);
        fileCategory = 'word';
        break;

      case 'xlsx':
      case 'xls':
        extractedText = await extractExcel(buffer);
        fileCategory = 'excel';
        break;

      case 'pptx':
      case 'ppt':
        extractedText = await extractPptx(buffer);
        fileCategory = 'powerpoint';
        break;

      case 'pdf':
        extractedText = await extractPdf(buffer);
        fileCategory = 'pdf';
        break;

      case 'csv':
      case 'txt':
        extractedText = buffer.toString('utf-8');
        fileCategory = resolvedType === 'csv' ? 'spreadsheet' : 'text';
        break;

      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
      case 'svg':
        extractedText = extractImageInfo(file.name, file.size, file.type);
        fileCategory = 'image';
        // Generate base64 preview for images (limit to 2MB for preview)
        if (file.size <= 2 * 1024 * 1024) {
          previewDataUrl = `data:${file.type};base64,${buffer.toString('base64')}`;
        }
        break;

      default:
        extractedText = `[File attached: ${file.name} (${file.type}, ${(file.size / 1024).toFixed(1)} KB)]`;
        break;
    }

    // Truncate very long extracted text to prevent overwhelming the AI context
    const maxChars = 15000;
    const wasTruncated = extractedText.length > maxChars;
    if (wasTruncated) {
      extractedText = extractedText.substring(0, maxChars) + '\n\n[... content truncated — file too large to process entirely ...]';
    }

    return NextResponse.json({
      fileName: file.name,
      fileType: resolvedType,
      fileCategory,
      fileSize: file.size,
      extractedText,
      previewDataUrl,
      wasTruncated,
    });
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: 'Failed to process file. Please try a different format.' },
      { status: 500 }
    );
  }
}
