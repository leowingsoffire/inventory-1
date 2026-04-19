import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('photo') as File | null;
    const userId = formData.get('userId') as string | null;
    const cropData = formData.get('cropData') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No photo provided' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Only JPEG, PNG, WebP, and GIF images are allowed' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File size must be under 5MB' }, { status: 400 });
    }

    // Read file as buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Convert to base64 data URL - crop data is applied client-side via canvas
    let base64 = `data:${file.type};base64,${buffer.toString('base64')}`;

    // If crop data provided, a pre-cropped image from client canvas is expected
    // The client sends the already-cropped canvas output as the file
    if (cropData) {
      // Crop data is metadata only (x, y, width, height) for logging
      console.log('Photo uploaded with crop:', cropData);
    }

    // Store the base64 photo in the user record
    const user = await prisma.user.update({
      where: { id: userId },
      data: { profilePhoto: base64 },
      select: {
        id: true,
        profilePhoto: true,
      },
    });

    return NextResponse.json({
      message: 'Photo uploaded successfully',
      profilePhoto: user.profilePhoto,
    });
  } catch (error) {
    console.error('Photo upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
