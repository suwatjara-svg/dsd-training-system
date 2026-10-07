import { google } from 'googleapis';

const SPREADSHEET_ID = process.env.GOOGLE_SHEET_SPREADSHEET_ID || '1Q4yMIsV7dxvrqPyea5dJKqLl5dBhgq6nMQF0BARFizQ';
const SERVICE_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || 'ai-pr-dsd@thinking-pillar-496305-d5.iam.gserviceaccount.com';
const PRIVATE_KEY = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

function getSheetsClient() {
  const auth = new google.auth.JWT(
    SERVICE_EMAIL,
    undefined,
    PRIVATE_KEY,
    ['https://www.googleapis.com/auth/spreadsheets']
  );
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
    range: 'courses!A2:K',
  });
  const rows = res.data.values || [];
  return rows.map((r) => ({
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
  }));
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
}) {
  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'courses!A:K',
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
      ]],
    },
  });
}

// -------------------------------------------------------------
// 3. APPLICATIONS
// -------------------------------------------------------------
export async function getApplicationsFromSheet(courseId?: string) {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'applications!A2:M',
  });
  const rows = res.data.values || [];
  let apps = rows.map((r, index) => ({
    rowIndex: index + 2,
    id: r[0],
    applicationNumber: r[1],
    courseId: r[2],
    firstName: r[3],
    lastName: r[4],
    idCardNumber: (r[5] || '').replace(/^'/, ''),
    phoneNumber: (r[6] || '').replace(/^'/, ''),
    age: Number(r[7]) || null,
    educationLevel: r[8] || '',
    occupation: r[9] || '',
    qualificationStatus: r[10] || 'PENDING',
    selectionStatus: r[11] || 'PENDING',
    submittedAt: r[12] || '',
  }));

  if (courseId) {
    apps = apps.filter((a) => a.courseId === courseId);
  }
  return apps;
}

export async function addApplicationToSheet(app: {
  id: string;
  applicationNumber: string;
  courseId: string;
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
}) {
  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'applications!A:M',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[
        app.id,
        app.applicationNumber,
        app.courseId,
        app.firstName,
        app.lastName,
        `'${app.idCardNumber}`,
        `'${app.phoneNumber}`,
        app.age || '',
        app.educationLevel || '',
        app.occupation || '',
        app.qualificationStatus || 'PENDING',
        app.selectionStatus || 'PENDING',
        app.submittedAt,
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
  const col = field === 'qualificationStatus' ? 'K' : 'L';
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
