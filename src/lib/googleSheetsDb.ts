import { google } from 'googleapis';
import { getGoogleAuthClient } from './googleAuth';

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_SPREADSHEET_ID || '1Q4yMIsV7dxvrqPyea5dJKqLl5dBhgq6nMQF0BARFizQ';

function getSheetsClient() {
  const auth = getGoogleAuthClient(['https://www.googleapis.com/auth/spreadsheets']);
  return google.sheets({ version: 'v4', auth });
}

// -------------------------------------------------------------
// 1. ADMINS
// -------------------------------------------------------------
export async function getAdminsFromSheet() {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'admins!A2:E',
  });
  const rows = res.data.values || [];
  return rows.map((r) => ({
    id: r[0],
    email: r[1],
    passwordHash: r[2],
    fullName: r[3],
    role: r[4] || 'OFFICER',
    isActive: true,
  }));
}

export async function addAdminToSheet(admin: { id: string; email: string; passwordHash: string; fullName: string; role: string }) {
  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'admins!A:E',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[admin.id, admin.email, admin.passwordHash, admin.fullName, admin.role]],
    },
  });
}

// -------------------------------------------------------------
// 2. COURSES
// -------------------------------------------------------------
export async function getCoursesFromSheet() {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'courses!A2:M',
  });
  const rows = res.data.values || [];
  const courses = rows.map((r) => {
    let requiredDocs: string[] = ['เอกสารแนบ 1', 'เอกสารแนบ 2'];
    if (r[12]) {
      try {
        requiredDocs = JSON.parse(r[12]);
      } catch {}
    }
    return {
      id: r[0],
      code: r[1],
      title: r[2],
      description: r[3] || '',
      capacity: Number(r[4]) || 20,
      startDate: r[5] || null,
      endDate: r[6] || null,
      timeSlot: r[7] || '',
      location: r[8] || '',
      qualifications: r[9] || '',
      status: r[10] || 'OPEN',
      trainingDays: r[11] ? Number(r[11]) : null,
      requiredDocs,
    };
  });

  // เรียงลำดับรุ่นใหม่ล่าสุดขึ้นก่อนเป็นลำดับแรก (ด้านซ้ายมือ)
  return courses.reverse().sort((a, b) => {
    const timeA = parseInt(a.id.replace(/\D/g, '')) || 0;
    const timeB = parseInt(b.id.replace(/\D/g, '')) || 0;
    if (timeA && timeB) {
      return timeB - timeA;
    }
    return 0;
  });
}

export async function addCourseToSheet(course: {
  id: string;
  code: string;
  title: string;
  description: string;
  capacity: number;
  startDate?: string | null;
  endDate?: string | null;
  timeSlot?: string;
  location?: string;
  qualifications?: string;
  status: string;
  trainingDays?: number | string | null;
  requiredDocs?: string[];
}) {
  const sheets = getSheetsClient();
  const docsJson = JSON.stringify(course.requiredDocs || []);
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'courses!A:M',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        course.id,
        course.code,
        course.title,
        course.description,
        course.capacity,
        course.startDate || '',
        course.endDate || '',
        course.timeSlot || '',
        course.location || '',
        course.qualifications || '',
        course.status || 'OPEN',
        course.trainingDays || '',
        docsJson,
      ]],
    },
  });
}

export async function updateCourseStatusInSheet(courseId: string, status: string) {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'courses!A2:K',
  });
  const rows = res.data.values || [];
  const rowIndex = rows.findIndex((r) => r[0] === courseId);
  if (rowIndex === -1) return false;

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `courses!K${rowIndex + 2}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[status]],
    },
  });
  return true;
}

export async function deleteCourseFromSheet(courseId: string) {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'courses!A2:M',
  });
  const rows = res.data.values || [];
  const remainingRows = rows.filter((r) => r[0] !== courseId);

  // Clear existing course rows
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SPREADSHEET_ID,
    range: 'courses!A2:M',
  });

  // Write back remaining rows
  if (remainingRows.length > 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `courses!A2:M${remainingRows.length + 1}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: remainingRows,
      },
    });
  }
  return true;
}

// Helper to prevent Google Sheets Formula Injection (Formula Injection Prevention)
export function sanitizeSheetCell(val: any): any {
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed.startsWith('=') || trimmed.startsWith('+') || trimmed.startsWith('-') || trimmed.startsWith('@')) {
      return `'${trimmed}`;
    }
    return trimmed;
  }
  return val;
}

// -------------------------------------------------------------
// 3. APPLICATIONS
// -------------------------------------------------------------
export async function getApplicationsFromSheet(courseId?: string) {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'applications!A2:R',
  });
  const rows = res.data.values || [];
  let apps = rows.map((r, index) => {
    // Fail-safe: if row was ever shifted into column Q (index 16)
    const rowData = (!r[0] && r[16]) ? r.slice(16) : r;

    let documents: any[] = [];
    if (rowData[16]) {
      try {
        documents = JSON.parse(rowData[16]);
      } catch {}
    }

    let answers: any[] = [];
    if (rowData[17]) {
      try {
        answers = JSON.parse(rowData[17]);
      } catch {}
    }

    return {
      rowIndex: index + 2,
      id: rowData[0] || '',
      applicationNumber: rowData[1] || '',
      courseId: rowData[2] || '',
      titlePrefix: rowData[3] || '',
      firstName: rowData[4] || '',
      lastName: rowData[5] || '',
      idCardNumber: (rowData[6] || '').replace(/^'/, ''),
      phoneNumber: (rowData[7] || '').replace(/^'/, ''),
      age: Number(rowData[8]) || null,
      educationLevel: rowData[9] || '',
      occupation: rowData[10] || '',
      qualificationStatus: rowData[11] || 'PENDING',
      selectionStatus: rowData[12] || 'PENDING',
      submittedAt: rowData[13] || '',
      email: rowData[14] || '',
      address: rowData[15] || '',
      documents,
      answers,
    };
  });

  if (courseId) {
    apps = apps.filter((a) => a.courseId === courseId);
  }
  return apps;
}

export async function addApplicationToSheet(app: {
  id: string;
  applicationNumber: string;
  courseId: string;
  titlePrefix: string;
  firstName: string;
  lastName: string;
  idCardNumber: string;
  phoneNumber: string;
  age?: number | string | null;
  educationLevel?: string;
  occupation?: string;
  qualificationStatus?: string;
  selectionStatus?: string;
  submittedAt: string;
  email?: string;
  address?: string;
  documentsJson?: string;
  answersJson?: string;
}) {
  const sheets = getSheetsClient();
  
  // Find current rows count in column A to strictly write into applications!A{nextRow}:R{nextRow}
  const checkRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'applications!A:A',
  });
  const currentRows = checkRes.data.values || [];
  const nextRow = Math.max(2, currentRows.length + 1);

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `applications!A${nextRow}:R${nextRow}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        app.id,
        app.applicationNumber,
        app.courseId,
        sanitizeSheetCell(app.titlePrefix),
        sanitizeSheetCell(app.firstName),
        sanitizeSheetCell(app.lastName),
        `'${app.idCardNumber}`,
        `'${app.phoneNumber}`,
        app.age || '',
        sanitizeSheetCell(app.educationLevel || ''),
        sanitizeSheetCell(app.occupation || ''),
        app.qualificationStatus || 'PENDING',
        app.selectionStatus || 'PENDING',
        app.submittedAt,
        sanitizeSheetCell(app.email || ''),
        sanitizeSheetCell(app.address || ''),
        app.documentsJson || '[]',
        app.answersJson || '[]',
      ]],
    },
  });
}

export async function updateApplicationStatusInSheet(
  applicationId: string,
  field: 'qualificationStatus' | 'selectionStatus',
  value: string
) {
  const apps = await getApplicationsFromSheet();
  const target = apps.find((a) => a.id === applicationId);
  if (!target) return;

  const sheets = getSheetsClient();
  const col = field === 'qualificationStatus' ? 'L' : 'M';
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `applications!${col}${target.rowIndex}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[value]],
    },
  });
}

// -------------------------------------------------------------
// 4. CONTACTS
// -------------------------------------------------------------
export async function getContactsFromSheet(applicationId?: string) {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'contacts!A2:F',
  });
  const rows = res.data.values || [];
  let contacts = rows.map((r) => ({
    id: r[0],
    applicationId: r[1],
    contactStatus: r[2],
    interestStatus: r[3],
    notes: r[4] || '',
    contactDate: r[5] || '',
  }));

  if (applicationId) {
    contacts = contacts.filter((c) => c.applicationId === applicationId);
  }
  return contacts;
}

export async function addContactToSheet(contact: {
  id: string;
  applicationId: string;
  contactStatus: string;
  interestStatus: string;
  notes: string;
  contactDate: string;
}) {
  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'contacts!A:F',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        contact.id,
        contact.applicationId,
        contact.contactStatus,
        contact.interestStatus,
        contact.notes,
        contact.contactDate,
      ]],
    },
  });
}
