import { NextResponse } from 'next/server';
import { uploadFileToDrive } from '@/lib/googleDrive';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const folderId = formData.get('folderId');

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Enforce Google Drive upload (No local fallback allowed per user request)
    const { fileId, fileUrl } = await uploadFileToDrive(
      buffer,
      file.name,
      file.type,
      folderId
    );

    return NextResponse.json({
      success: true,
      fileId,
      fileUrl
    });
  } catch (error) {
    console.error('Google Drive Upload failure:', error);
    return NextResponse.json(
      { success: false, error: `Google Drive upload failed: ${error.message}` },
      { status: 500 }
    );
  }
}
