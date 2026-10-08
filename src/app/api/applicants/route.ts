import { NextResponse } from 'next/server';
import { getApplicationsFromSheet, getCoursesFromSheet, getContactsFromSheet } from '@/lib/googleSheetsDb';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const search = (searchParams.get('search') || '').trim().toLowerCase();
    const qualStatus = searchParams.get('qualStatus');
    const contactStatus = searchParams.get('contactStatus');
    const selectionStatus = searchParams.get('selectionStatus');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const [allApps, courses, allContacts] = await Promise.all([
      getApplicationsFromSheet(courseId || undefined),
      getCoursesFromSheet(),
      getContactsFromSheet(),
    ]);

    let filtered = allApps.filter((app) => {
      if (courseId && app.courseId !== courseId) return false;
      if (qualStatus && app.qualificationStatus !== qualStatus) return false;
      if (selectionStatus && app.selectionStatus !== selectionStatus) return false;
      if (contactStatus) {
        const contact = allContacts.find((c) => c.applicationId === app.id);
        const st = contact?.contactStatus || 'NOT_CONTACTED';
        if (st !== contactStatus) return false;
      }
      if (search) {
        const match =
          app.applicationNumber.toLowerCase().includes(search) ||
          app.firstName.toLowerCase().includes(search) ||
          app.lastName.toLowerCase().includes(search) ||
          app.phoneNumber.toLowerCase().includes(search) ||
          app.idCardNumber.toLowerCase().includes(search);
        if (!match) return false;
      }
      return true;
    });

    const total = filtered.length;
    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    const applicants = paginated.map((app) => {
      const course = courses.find((c) => c.id === app.courseId);
      const contact = allContacts.find((c) => c.applicationId === app.id);
      return {
        ...app,
        course: course ? { id: course.id, code: course.code, title: course.title, capacity: course.capacity } : null,
        screening: { qualificationStatus: app.qualificationStatus, disqualifiedReason: '' },
        selection: { selectionStatus: app.selectionStatus, waitlistOrder: null, isOverridden: false },
        contacts: contact ? [contact] : [],
      };
    });

    return NextResponse.json({
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      applicants,
    });
  } catch (error) {
    console.error('Fetch applicants error:', error);
    return NextResponse.json({ error: 'Failed to fetch applicants' }, { status: 500 });
  }
}
