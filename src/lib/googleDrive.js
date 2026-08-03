import { google } from 'googleapis';
import stream from 'stream';

const rawKey = process.env.GOOGLE_PRIVATE_KEY;
const cleanKey = rawKey 
  ? rawKey.replace(/"/g, '').replace(/\\n/g, '\n')
  : undefined;

const credentials = {
  client_email: process.env.GOOGLE_CLIENT_EMAIL,
  private_key: cleanKey,
};

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive'
  ],
});

const drive = google.drive({ version: 'v3', auth });

// Converts a buffer to a readable stream
const bufferToStream = (buffer) => {
  const readable = new stream.Readable();
  readable.push(buffer);
  readable.push(null);
  return readable;
};

export const uploadFileToDrive = async (buffer, filename, mimeType, folderId) => {
  console.log(`[GoogleDrive] Starting upload process for file: "${filename}" (Mime: ${mimeType}, Size: ${buffer ? buffer.length : 0} bytes)`);
  
  if (!buffer) {
    console.error('[GoogleDrive] Error: File buffer is empty or missing!');
    throw new Error('File upload failed: File buffer is empty');
  }

  const primaryFolderId = folderId || "1J8EKHxFC0twuTJhPjXT7FEEUhsz2LA62";
  const fallbackFolderId = "1v5O9tuTS5Rwes_Uo2aADkIhAYF9IKaoM";

  // Helper function to perform the actual drive upload request
  const performUpload = async (targetFolderId) => {
    console.log(`[GoogleDrive] Uploading to folder ID: "${targetFolderId}"...`);
    const response = await drive.files.create({
      requestBody: {
        name: filename,
        mimeType,
        parents: [targetFolderId],
      },
      media: {
        mimeType,
        body: bufferToStream(buffer),
      },
      fields: 'id, webViewLink, webContentLink',
    });

    // Make the file publicly accessible
    try {
      await drive.permissions.create({
        fileId: response.data.id,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });
    } catch (permError) {
      console.warn('[GoogleDrive] Failed to set public permissions:', permError.message);
    }

    return response.data;
  };

  try {
    // Attempt upload to primary folder
    const fileData = await performUpload(primaryFolderId);
    console.log(`[GoogleDrive] UPLOAD SUCCESS (Primary Folder)! File ID: ${fileData.id}`);
    return {
      fileId: fileData.id,
      fileUrl: `https://drive.google.com/thumbnail?id=${fileData.id}&sz=w1000`
    };
  } catch (error) {
    console.warn(`[GoogleDrive] Primary folder upload failed (Code: ${error.code || 'unknown'}, Message: ${error.message})`);
    
    // Check if it's a permissions or not found issue with the folder
    const isAccessIssue = error.code === 404 || error.code === 403;
    if (isAccessIssue) {
      console.error(
        `[GoogleDrive] WARNING: Folder "${primaryFolderId}" was not found or is NOT accessible by the service account.\n` +
        `--> Trying fallback folder "${fallbackFolderId}" instead...`
      );

      try {
        const fallbackFileData = await performUpload(fallbackFolderId);
        console.log(`[GoogleDrive] UPLOAD SUCCESS (Fallback Folder)! File ID: ${fallbackFileData.id}`);
        return {
          fileId: fallbackFileData.id,
          fileUrl: `https://drive.google.com/thumbnail?id=${fallbackFileData.id}&sz=w1000`
        };
      } catch (fallbackError) {
        console.error(`[GoogleDrive] Fallback folder upload also failed (Code: ${fallbackError.code || 'unknown'}):`, fallbackError.message);
        throw new Error(`File upload failed on both folders: ${fallbackError.message}`);
      }
    } else {
      console.error(`[GoogleDrive] Unexpected upload error (Code: ${error.code || 'unknown'}):`, error.message);
      throw new Error(`File upload failed: ${error.message}`);
    }
  }
};

export const getFileUrl = async (fileId) => {
  try {
    const response = await drive.files.get({
      fileId: fileId,
      fields: 'webViewLink',
    });
    return response.data.webViewLink;
  } catch (error) {
    console.error('Error fetching file URL from Google Drive:', error);
    throw error;
  }
};

export const deleteFileFromDrive = async (fileId) => {
  try {
    await drive.files.delete({
      fileId: fileId,
    });
    return true;
  } catch (error) {
    console.error('Error deleting file from Google Drive:', error);
    throw error;
  }
};
