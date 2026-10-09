import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getCoursesFromSheet, getApplicationsFromSheet, addCourseToSheet, updateCourseStatusInSheet, deleteCourseFromSheet } from '@/lib/googleSheetsDb';

export async function GET() {
  try {
    const [courses, apps] = await Promise.all([
      getCoursesFromSheet(),
      getApplicationsFromSheet(),
    ]);

    const coursesWithCounts = courses.map((c) => {
      const courseApps = apps.filter((a) => a.courseId === c.id);
      return {
        ...c,
        applicantCount: courseApps.length,
        selectedCount: courseApps.filter((a) => a.selectionStatus === 'SELECTED').length,
        waitlistCount: courseApps.filter((a) => a.selectionStatus === 'WAITLIST').length,
        _count: {
          applications: courseApps.length,
        },
      };
    });

    return NextResponse.json(coursesWithCounts);
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

    if (!['SUPER_ADMIN', 'ADMIN', 'OFFICER'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden: สิทธิ์ไม่เพียงพอในการสร้างหลักสูตร' }, { status: 403 });
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

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['SUPER_ADMIN', 'ADMIN', 'OFFICER'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden: สิทธิ์ไม่เพียงพอ' }, { status: 403 });
    }

    const { courseId, status } = await request.json();
    if (!courseId || !status) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    if (!['OPEN', 'CLOSED'].includes(status)) {
      return NextResponse.json({ error: 'สถานะหลักสูตรไม่ถูกต้อง (ต้องเป็น OPEN หรือ CLOSED)' }, { status: 400 });
    }

    await updateCourseStatusInSheet(courseId, status);
    return NextResponse.json({ success: true, courseId, status });
  } catch (error) {
    console.error('Update course status error:', error);
    return NextResponse.json({ error: 'Failed to update course status' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only ADMIN or SUPER_ADMIN can delete courses
    if (!['SUPER_ADMIN', 'ADMIN'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden: ต้องเป็นผู้ดูแลระบบระดับ Admin เท่านั้นจึงจะสามารถลบหลักสูตรได้' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
    }

    await deleteCourseFromSheet(courseId);
    return NextResponse.json({ success: true, courseId });
  } catch (error) {
    console.error('Delete course error:', error);
    return NextResponse.json({ error: 'Failed to delete course' }, { status: 500 });
  }
}
