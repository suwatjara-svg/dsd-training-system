import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getCoursesFromSheet, addCourseToSheet } from '@/lib/googleSheetsDb';

export async function GET() {
  try {
    const courses = await getCoursesFromSheet();
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
      title,
      description,
      capacity,
      location,
      timeSlot,
      startDate,
      endDate,
      trainingDays,
      qualifications,
      requiredDocs,
    } = body;

    if (!title || !capacity) {
      return NextResponse.json({ error: 'กรุณากรอกชื่อหลักสูตร และจำนวนที่รับ' }, { status: 400 });
    }

    const id = `course_${Date.now()}`;
    const autoCode = `DSD4-${Date.now().toString().slice(-4)}`;

    await addCourseToSheet({
      id,
      code: autoCode,
      title,
      description: description || '',
      capacity: Number(capacity) || 20,
      location: location || '',
      timeSlot: timeSlot || '',
      startDate: startDate || null,
      endDate: endDate || null,
      trainingDays: trainingDays ? Number(trainingDays) : null,
      qualifications: qualifications || '',
      status: 'OPEN',
      requiredDocs: requiredDocs || [],
    });

    return NextResponse.json({ id, code: autoCode, title, capacity }, { status: 201 });
  } catch (error) {
    console.error('Create course error:', error);
    return NextResponse.json({ error: 'Failed to create course' }, { status: 500 });
  }
}
