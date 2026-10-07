import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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

    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    const where: any = { courseId };
    if (type === 'QUALIFIED') {
      where.screening = { qualificationStatus: 'QUALIFIED' };
    } else if (type === 'SELECTED') {
      where.selection = { selectionStatus: 'SELECTED' };
    } else if (type === 'WAITLIST') {
      where.selection = { selectionStatus: 'WAITLIST' };
    } else if (type === 'UNCONTACTED') {
      where.contacts = { none: { contactStatus: 'CONTACTED' } };
    }

    const applicants = await prisma.application.findMany({
      where,
      orderBy: { submittedAt: 'asc' },
      include: {
        screening: true,
        selection: true,
        contacts: {
          orderBy: { contactDate: 'desc' },
          take: 1,
        },
      },
    });

    // Prepare rows for Excel
    const rows = applicants.map((app, index) => {
      const lastCall = app.contacts[0];
      return {
        'ลำดับ': index + 1,
        'เลขที่ใบสมัคร': app.applicationNumber,
        'ชื่อ-นามสกุล': `${app.firstName} ${app.lastName}`,
        'เลขบัตรประชาชน': app.idCardNumber,
        'เบอร์โทรศัพท์': app.phoneNumber,
        'อายุ': app.age || '-',
        'อาชีพ': app.occupation || '-',
        'การศึกษา': app.educationLevel || '-',
        'สถานะคุณสมบัติ': app.screening?.qualificationStatus === 'QUALIFIED' ? 'ผ่าน' : app.screening?.qualificationStatus === 'NOT_QUALIFIED' ? 'ไม่ผ่าน' : 'รอตรวจ',
        'สถานะการติดต่อ': lastCall?.contactStatus === 'CONTACTED' ? 'ติดต่อแล้ว' : lastCall?.contactStatus === 'NO_ANSWER' ? 'ไม่รับสาย' : 'ยังไม่โทร',
        'ความประสงค์เรียน': lastCall?.interestStatus === 'INTERESTED' ? 'ต้องการเรียน' : lastCall?.interestStatus === 'NOT_INTERESTED' ? 'ไม่ต้องการ' : 'ยังไม่แน่ใจ',
        'ผลการคัดเลือก': app.selection?.selectionStatus === 'SELECTED' ? 'คัดเลือกแล้ว' : app.selection?.selectionStatus === 'WAITLIST' ? `สำรอง (ลำดับ ${app.selection.waitlistOrder})` : app.selection?.selectionStatus === 'REJECTED' ? 'ไม่ผ่าน' : 'รอดำเนินการ',
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
