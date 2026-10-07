import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { uploadApplicationFile, appendApplicantToGoogleSheet } from '@/lib/gdrive';

export async function POST(request: Request, { params }: { params: Promise<{ courseId: string }> }) {
  try {
    const { courseId } = await params;

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        forms: {
          orderBy: { version: 'desc' },
          take: 1,
          include: {
            sections: {
              include: { questions: true },
            },
          },
        },
      },
    });

    if (!course || course.status !== 'OPEN') {
      return NextResponse.json({ error: 'หลักสูตรนี้ไม่เปิดรับสมัคร หรือไม่มีอยู่ในระบบ' }, { status: 400 });
    }

    const formData = await request.formData();
    const idCardNumber = formData.get('idCardNumber') as string;
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const phoneNumber = formData.get('phoneNumber') as string;
    const email = (formData.get('email') as string) || null;
    const age = formData.get('age') ? Number(formData.get('age')) : null;
    const occupation = (formData.get('occupation') as string) || null;
    const educationLevel = (formData.get('educationLevel') as string) || null;
    const address = (formData.get('address') as string) || null;

    if (!idCardNumber || !firstName || !lastName || !phoneNumber) {
      return NextResponse.json({ error: 'กรุณากรอกข้อมูลสำคัญ (เลขบัตรประชาชน, ชื่อ, นามสกุล, เบอร์โทรศัพท์) ให้ครบถ้วน' }, { status: 400 });
    }

    // 1. Check Duplication based on Course Settings
    const existing = await prisma.application.findFirst({
      where: {
        courseId,
        idCardNumber: idCardNumber.trim(),
      },
    });

    if (existing) {
      return NextResponse.json({
        error: `เลขประจำตัวประชาชนนี้ได้ยื่นใบสมัครหลักสูตรนี้แล้ว (เลขที่ใบสมัคร: ${existing.applicationNumber})`,
      }, { status: 409 });
    }

    // 2. Generate Sequential Application Number APP-2026-XXXXXX
    const count = await prisma.application.count();
    const appNumber = `APP-${new Date().getFullYear()}-${(count + 1).toString().padStart(6, '0')}`;

    const activeForm = course.forms[0];

    // 3. Create Application Record
    const application = await prisma.application.create({
      data: {
        applicationNumber: appNumber,
        courseId: course.id,
        formId: activeForm ? activeForm.id : 'default',
        formVersion: activeForm ? activeForm.version : 1,
        idCardNumber: idCardNumber.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phoneNumber.trim(),
        email: email?.trim(),
        age,
        occupation,
        educationLevel,
        address,
        screening: {
          create: {
            qualificationStatus: 'PENDING',
          },
        },
        selection: {
          create: {
            selectionStatus: 'PENDING',
          },
        },
      },
    });

    // 4. Save Dynamic Answers
    if (activeForm && activeForm.sections) {
      for (const section of activeForm.sections) {
        for (const question of section.questions) {
          const val = formData.get(`q_${question.id}`);
          if (val) {
            await prisma.applicantAnswer.create({
              data: {
                applicationId: application.id,
                questionId: question.id,
                answerValue: String(val),
              },
            });
          }
        }
      }
    }

    // 5. Handle File Uploads
    const files = formData.getAll('documents') as File[];
    const docTitles = formData.getAll('docTitles') as string[];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file && file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const uploadResult = await uploadApplicationFile({
          courseCode: course.code,
          applicationNumber: appNumber,
          documentTitle: docTitles[i] || 'เอกสารแนบ',
          fileName: file.name,
          mimeType: file.type,
          buffer,
        });

        await prisma.applicantDocument.create({
          data: {
            applicationId: application.id,
            documentTitle: docTitles[i] || 'เอกสารแนบ',
            fileUrl: uploadResult.fileUrl,
            driveFileId: uploadResult.driveFileId,
            mimeType: file.type,
            fileSizeBytes: file.size,
            status: 'PENDING',
          },
        });
      }
    }

    // 6. Sync to Google Sheets
    appendApplicantToGoogleSheet({
      applicationNumber: appNumber,
      courseTitle: course.title,
      fullName: `${firstName} ${lastName}`,
      idCardNumber,
      phoneNumber,
      age: age || '-',
      educationLevel: educationLevel || '-',
      occupation: occupation || '-',
      submittedAt: new Date().toLocaleString('th-TH'),
    }).catch(console.error);

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
