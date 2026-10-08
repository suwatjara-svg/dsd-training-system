import { NextResponse } from 'next/server';
import { uploadApplicationFile } from '@/lib/gdrive';
import { getCoursesFromSheet, getApplicationsFromSheet, addApplicationToSheet } from '@/lib/googleSheetsDb';

export async function POST(request: Request, { params }: { params: Promise<{ courseId: string }> }) {
  try {
    const { courseId } = await params;

    const courses = await getCoursesFromSheet();
    const course = courses.find((c) => c.id === courseId);

    if (!course || course.status !== 'OPEN') {
      return NextResponse.json({ error: 'หลักสูตรนี้ไม่เปิดรับสมัคร หรือไม่มีอยู่ในระบบ' }, { status: 400 });
    }

    const formData = await request.formData();
    const titlePrefix = (formData.get('titlePrefix') as string) || '';
    const idCardNumber = formData.get('idCardNumber') as string;
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const phoneNumber = formData.get('phoneNumber') as string;
    const age = formData.get('age') ? Number(formData.get('age')) : null;
    const occupation = (formData.get('occupation') as string) || '';
    const educationLevel = (formData.get('educationLevel') as string) || '';

    if (!idCardNumber || !firstName || !lastName || !phoneNumber) {
      return NextResponse.json({ error: 'กรุณากรอกข้อมูลสำคัญ (เลขบัตรประชาชน, ชื่อ, นามสกุล, เบอร์โทรศัพท์) ให้ครบถ้วน' }, { status: 400 });
    }

    // 1. Check Duplication in Google Sheets
    const existingApps = await getApplicationsFromSheet(courseId);
    const existing = existingApps.find((a) => a.idCardNumber === idCardNumber.trim());

    if (existing) {
      return NextResponse.json({
        error: `เลขประจำตัวประชาชนนี้ได้ยื่นใบสมัครหลักสูตรนี้แล้ว (เลขที่ใบสมัคร: ${existing.applicationNumber})`,
      }, { status: 409 });
    }

    // 2. Generate Sequential Application Number
    const allApps = await getApplicationsFromSheet();
    const appNumber = `APP-${new Date().getFullYear()}-${(allApps.length + 1).toString().padStart(6, '0')}`;
    const id = `app_${Date.now()}`;

    // 3. Save directly to Google Sheet
    await addApplicationToSheet({
      id,
      applicationNumber: appNumber,
      courseId: course.id,
      titlePrefix: titlePrefix.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      idCardNumber: idCardNumber.trim(),
      phoneNumber: phoneNumber.trim(),
      age,
      educationLevel,
      occupation,
      qualificationStatus: 'PENDING',
      selectionStatus: 'PENDING',
      submittedAt: new Date().toLocaleString('th-TH'),
    });

    // 4. Handle Documents Upload to Google Drive
    const files = formData.getAll('documents') as File[];
    const docTitles = formData.getAll('docTitles') as string[];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file && file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer());
        await uploadApplicationFile({
          courseCode: course.code,
          applicationNumber: appNumber,
          documentTitle: docTitles[i] || 'เอกสารแนบ',
          fileName: file.name,
          mimeType: file.type,
          buffer,
        });
      }
    }

    return NextResponse.json({
      success: true,
      applicationNumber: appNumber,
      message: 'ยื่นใบสมัครเรียบร้อยแล้ว',
    });
  } catch (error: any) {
    console.error('Submit application error:', error);
    return NextResponse.json({ error: error.message || 'เกิดข้อผิดพลาดในการยื่นใบสมัคร' }, { status: 500 });
  }
}
