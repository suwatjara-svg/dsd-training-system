import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

/**
 * Service to handle Google Drive upload for candidate documents.
 * Target Folder ID: 1im_FTcn_RMy7mRnQ9bDMX7O0qZdFfJNU
 */
export async function uploadApplicationFile({
  courseCode,
  applicationNumber,
  documentTitle,
  fileName,
  mimeType,
  buffer,
}: {
  courseCode: string;
  applicationNumber: string;
  documentTitle: string;
  fileName: string;
  mimeType: string;
  buffer: Buffer;
}): Promise<{ fileUrl: string; driveFileId?: string }> {
  const serviceEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const parentFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID || '1im_FTcn_RMy7mRnQ9bDMX7O0qZdFfJNU';

  if (serviceEmail && privateKey && parentFolderId) {
    try {
      const auth = new google.auth.JWT(
        serviceEmail,
        undefined,
        privateKey,
        ['https://www.googleapis.com/auth/drive']
      );

      const drive = google.drive({ version: 'v3', auth });

      const response = await drive.files.create({
        requestBody: {
          name: `${applicationNumber}_${documentTitle}_${fileName}`,
          parents: [parentFolderId],
        },
        media: {
          mimeType,
          body: buffer as any,
        },
        fields: 'id, webViewLink, webContentLink',
      });

      return {
        fileUrl: response.data.webViewLink || response.data.webContentLink || '',
        driveFileId: response.data.id || undefined,
      };
    } catch (err) {
      console.warn('Google Drive API upload failed, falling back to local file storage:', err);
    }
  }

  // Local Storage Fallback
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', courseCode, applicationNumber);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const safeFileName = `${Date.now()}_${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  const filePath = path.join(uploadDir, safeFileName);
  fs.writeFileSync(filePath, buffer);

  const localRelativeUrl = `/uploads/${courseCode}/${applicationNumber}/${safeFileName}`;
  return {
    fileUrl: localRelativeUrl,
  };
}

/**
 * Service to sync new applicants directly to Google Sheets
 * Spreadsheet ID: 1Q4yMIsV7dxvrqPyea5dJKqlI5Dbhgq6nMQF0BARFizQ
 */
export async function appendApplicantToGoogleSheet({
  applicationNumber,
  courseTitle,
  fullName,
  idCardNumber,
  phoneNumber,
  age,
  educationLevel,
  occupation,
  submittedAt,
}: {
  applicationNumber: string;
  courseTitle: string;
  fullName: string;
  idCardNumber: string;
  phoneNumber: string;
  age: number | string;
  educationLevel: string;
  occupation: string;
  submittedAt: string;
}) {
  const serviceEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const spreadsheetId = process.env.GOOGLE_SHEET_SPREADSHEET_ID || '1Q4yMIsV7dxvrqPyea5dJKqlI5Dbhgq6nMQF0BARFizQ';

  if (serviceEmail && privateKey && spreadsheetId) {
    try {
      const auth = new google.auth.JWT(
        serviceEmail,
        undefined,
        privateKey,
        ['https://www.googleapis.com/auth/spreadsheets']
      );

      const sheets = google.sheets({ version: 'v4', auth });

      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'ชีต1!A:I',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [
            [
              applicationNumber,
              courseTitle,
              fullName,
              `'${idCardNumber}`,
              `'${phoneNumber}`,
              age || '-',
              educationLevel || '-',
              occupation || '-',
              submittedAt,
            ],
          ],
        },
      });
      console.log(`Synced applicant ${applicationNumber} to Google Sheet successfully`);
    } catch (err) {
      console.warn('Google Sheet sync error:', err);
    }
  }
}
