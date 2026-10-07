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
      code,
      title,
      description,
      capacity,
      location,
      timeSlot,
      startDate,
      endDate,
      qualifications,
    } = body;

    if (!code || !title || !capacity) {
      return NextResponse.json({ error: 'กรุณากรอกรหัสหลักสูตร, ชื่อหลักสูตร และจำนวนที่รับ' }, { status: 400 });
    }

    const id = `course_${Date.now()}`;
    await addCourseToSheet({
      id,
      code,
      title,
      description: description || '',
      capacity: Number(capacity) || 20,
      location: location || '',
      timeSlot: timeSlot || '',
      startDate: startDate || null,
      endDate: endDate || null,
      qualifications: qualifications || '',
      status: 'OPEN',
    });

    return NextResponse.json({ id, code, title, capacity }, { status: 201 });
  } catch (error) {
    console.error('Create course error:', error);
    return NextResponse.json({ error: 'Failed to create course' }, { status: 500 });
  }
}
