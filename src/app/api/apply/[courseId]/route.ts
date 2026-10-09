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
    const pdpaConsent = formData.get('pdpaConsent');
    if (pdpaConsent !== 'true' && pdpaConsent !== '1' && pdpaConsent !== 'on') {
      return NextResponse.json({ error: 'กรุณายินยอมเงื่อนไขการคุ้มครองข้อมูลส่วนบุคคล (PDPA)' }, { status: 400 });
    }

    const titlePrefix = (formData.get('titlePrefix') as string) || '';
    const idCardNumber = (formData.get('idCardNumber') as string) || '';
    const firstName = (formData.get('firstName') as string) || '';
    const lastName = (formData.get('lastName') as string) || '';
    const phoneNumber = (formData.get('phoneNumber') as string) || '';
    const email = (formData.get('email') as string) || '';
    const address = (formData.get('address') as string) || '';
    const age = formData.get('age') ? Number(formData.get('age')) : null;
    const occupation = (formData.get('occupation') as string) || '';
    const educationLevel = (formData.get('educationLevel') as string) || '';

    const cleanId = idCardNumber.replace(/\D/g, '');
    if (cleanId.length !== 13) {
      return NextResponse.json({ error: 'เลขประจำตัวประชาชนต้องครบถ้วน 13 หลัก' }, { status: 400 });
    }

    if (!firstName.trim() || !lastName.trim() || !phoneNumber.trim()) {
      return NextResponse.json({ error: 'กรุณากรอกข้อมูลสำคัญ (ชื่อ, นามสกุล, เบอร์โทรศัพท์) ให้ครบถ้วน' }, { status: 400 });
    }

    // 1. Server-side File Validation
    const files = formData.getAll('documents') as File[];
    const docTitles = formData.getAll('docTitles') as string[];
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
    const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf'];

    for (const file of files) {
      if (file && file.size > 0) {
        if (file.size > MAX_FILE_SIZE) {
          return NextResponse.json({ error: `ไฟล์ "${file.name}" มีขนาดเกิน 10 MB` }, { status: 400 });
        }
        const isAllowed =
          ALLOWED_MIME.includes(file.type) ||
          file.type.startsWith('image/') ||
          /\.(jpe?g|png|webp|heic|heif|pdf)$/i.test(file.name);
        if (!isAllowed) {
          return NextResponse.json({ error: `ไฟล์ "${file.name}" ไม่ใช่ประเภทที่รองรับ (ต้องเป็นรูปภาพหรือไฟล์ PDF)` }, { status: 400 });
        }
      }
    }

    // 2. Check Duplication in Google Sheets
    const existingApps = await getApplicationsFromSheet(courseId);
    const existing = existingApps.find((a) => a.idCardNumber === cleanId);

    if (existing) {
      return NextResponse.json({
        error: `เลขประจำตัวประชาชนนี้ได้ยื่นใบสมัครหลักสูตรนี้แล้ว (เลขที่ใบสมัคร: ${existing.applicationNumber})`,
      }, { status: 409 });
    }

    // 3. Generate Concurrency-safe Application Number
    const allApps = await getApplicationsFromSheet();
    const year = new Date().getFullYear();
    const seq = (allApps.length + 1).toString().padStart(4, '0');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const appNumber = `APP-${year}-${seq}-${randomSuffix}`;
    const id = `app_${Date.now()}`;

    // 4. Extract Dynamic Answers (q_*)
    const answers: Array<{ questionId: string; label: string; answerValue: string }> = [];
    formData.forEach((val, key) => {
      if (key.startsWith('q_')) {
        answers.push({
          questionId: key.replace(/^q_/, ''),
          label: 'คำถามเพิ่มเติม',
          answerValue: String(val).trim(),
        });
      }
    });

    // 5. Handle Documents Upload to Google Drive and collect URLs
    const uploadedDocs: Array<{ id: string; documentTitle: string; fileName: string; fileUrl: string }> = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file && file.size > 0) {
        try {
          const buffer = Buffer.from(await file.arrayBuffer());
          const docTitle = docTitles[i] || `เอกสารแนบ ${i + 1}`;
          const uploadRes = await uploadApplicationFile({
            courseCode: course.code,
            applicationNumber: appNumber,
            documentTitle: docTitle,
            fileName: file.name,
            mimeType: file.type || 'application/octet-stream',
            buffer,
          });

          uploadedDocs.push({
            id: `doc_${Date.now()}_${i}`,
            documentTitle: docTitle,
            fileName: file.name,
            fileUrl: uploadRes.fileUrl || '',
          });
        } catch (uploadErr) {
          console.error(`Document upload error for ${file.name}:`, uploadErr);
        }
      }
    }

    // 6. Save directly to Google Sheet with all complete fields
    await addApplicationToSheet({
      id,
      applicationNumber: appNumber,
      courseId: course.id,
      titlePrefix: titlePrefix.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      idCardNumber: cleanId,
      phoneNumber: phoneNumber.trim(),
      age,
      educationLevel,
      occupation,
      email: email.trim(),
      address: address.trim(),
      documentsJson: JSON.stringify(uploadedDocs),
      answersJson: JSON.stringify(answers),
      qualificationStatus: 'PENDING',
      selectionStatus: 'PENDING',
      submittedAt: new Date().toLocaleString('th-TH'),
    });

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
