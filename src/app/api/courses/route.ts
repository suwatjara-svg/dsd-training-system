import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const courses = await prisma.course.findMany({
      include: {
        _count: {
          select: {
            applications: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(courses);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      code,
      title,
      description,
      capacity,
      department,
      responsiblePerson,
      startDate,
      endDate,
      timeSlot,
      location,
      qualifications,
      targetAudience,
      documents,
    } = body;

    if (!code || !title || !capacity) {
      return NextResponse.json({ error: 'กรุณากรอกรหัสหลักสูตร, ชื่อหลักสูตร และจำนวนที่รับ' }, { status: 400 });
    }

    const course = await prisma.course.create({
      data: {
        code,
        title,
        description,
        capacity: Number(capacity),
        department,
        responsiblePerson: responsiblePerson || user.fullName,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        timeSlot,
        location,
        qualifications,
        targetAudience,
        status: 'OPEN',
        requiredDocuments: documents && documents.length > 0 ? {
          create: documents.map((doc: any) => ({
            title: doc.title,
            isRequired: doc.isRequired ?? true,
          }))
        } : undefined,
      },
    });

    // Default form for this course
    await prisma.form.create({
      data: {
        courseId: course.id,
        title: `ใบสมัครหลักสูตร ${course.title}`,
        version: 1,
        sections: {
          create: [
            {
              title: 'ข้อมูลทั่วไปและความสนใจ',
              orderIndex: 1,
              questions: {
                create: [
                  {
                    label: 'เหตุผลที่สนใจสมัครหลักสูตรนี้',
                    questionType: 'LONG_TEXT',
                    isRequired: true,
                    orderIndex: 1,
                  },
                ],
              },
            },
          ],
        },
      },
    });

    return NextResponse.json(course, { status: 201 });
  } catch (error: any) {
    console.error('Create course error:', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'รหัสหลักสูตรนี้มีอยู่ในระบบแล้ว' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create course' }, { status: 500 });
  }
}
