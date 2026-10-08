import { NextResponse } from 'next/server';
import { getCoursesFromSheet, getApplicationsFromSheet, getContactsFromSheet } from '@/lib/googleSheetsDb';
import { getCurrentUser } from '@/lib/auth';
import { formatThaiDate } from '@/lib/utils';
import * as XLSX from 'xlsx';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const type = searchParams.get('type') || 'ALL'; // ALL, QUALIFIED, SELECTED, WAITLIST, UNCONTACTED

    if (!courseId) {
      return NextResponse.json({ error: 'courseId is required' }, { status: 400 });
    }

    const [courses, allApps, allContacts] = await Promise.all([
      getCoursesFromSheet(),
      getApplicationsFromSheet(courseId),
      getContactsFromSheet(),
    ]);

    const course = courses.find((c) => c.id === courseId);
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const applicants = allApps.filter((app) => {
      if (type === 'QUALIFIED') return app.qualificationStatus === 'QUALIFIED';
      if (type === 'SELECTED') return app.selectionStatus === 'SELECTED';
      if (type === 'WAITLIST') return app.selectionStatus === 'WAITLIST';
      if (type === 'UNCONTACTED') {
        const contact = allContacts.find((c) => c.applicationId === app.id);
        return !contact || contact.contactStatus !== 'CONTACTED';
      }
      return true;
    });

    // Prepare rows for Excel
    const rows = applicants.map((app, index) => {
      const lastCall = allContacts.find((c) => c.applicationId === app.id);
      const prefix = (app as any).titlePrefix || '';
      return {
        'ลำดับ': index + 1,
        'เลขที่ใบสมัคร': app.applicationNumber,
        'ชื่อ-นามสกุล': `${prefix}${app.firstName} ${app.lastName}`.trim(),
        'เลขบัตรประชาชน': app.idCardNumber,
        'เบอร์โทรศัพท์': app.phoneNumber,
        'อายุ': app.age || '-',
        'อาชีพ': app.occupation || '-',
        'การศึกษา': app.educationLevel || '-',
        'สถานะคุณสมบัติ': app.qualificationStatus === 'QUALIFIED' ? 'ผ่าน' : app.qualificationStatus === 'NOT_QUALIFIED' ? 'ไม่ผ่าน' : 'รอตรวจ',
        'สถานะการติดต่อ': lastCall?.contactStatus === 'CONTACTED' ? 'ติดต่อแล้ว' : lastCall?.contactStatus === 'NO_ANSWER' ? 'ไม่รับสาย' : 'ยังไม่โทร',
        'ความประสงค์เรียน': lastCall?.interestStatus === 'INTERESTED' ? 'ต้องการเรียน' : lastCall?.interestStatus === 'NOT_INTERESTED' ? 'ไม่ต้องการ' : 'ยังไม่แน่ใจ',
        'ผลการคัดเลือก': app.selectionStatus === 'SELECTED' ? 'คัดเลือกแล้ว' : app.selectionStatus === 'WAITLIST' ? 'สำรอง' : app.selectionStatus === 'REJECTED' ? 'ไม่ผ่าน' : 'รอดำเนินการ',
        'วันที่สมัคร': formatThaiDate(app.submittedAt, true),
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'รายชื่อผู้สมัคร');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="applicants_${course.code}_${type}.xlsx"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Failed to export' }, { status: 500 });
  }
}
