import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getCoursesFromSheet, getApplicationsFromSheet, getContactsFromSheet } from '@/lib/googleSheetsDb';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const filter = searchParams.get('filter') || 'ALL';

    const courses = await getCoursesFromSheet();
    const course = courses.find((c) => c.id === courseId) || courses[0];

    if (!course) {
      return NextResponse.json({
        stats: { capacity: 0, totalApplicants: 0, selectedCount: 0, waitlistCount: 0, remainingSlots: 0, isFull: false },
        applicants: [],
      });
    }

    let rawApps = await getApplicationsFromSheet(course.id);
    const contacts = await getContactsFromSheet();

    // Attach contact details
    let applicants = rawApps.map((a) => {
      const appContacts = contacts.filter((c) => c.applicationId === a.id);
      return {
        ...a,
        contacts: appContacts,
        screening: {
          qualificationStatus: a.qualificationStatus,
        },
        selection: {
          selectionStatus: a.selectionStatus,
        },
      };
    });

    const selectedCount = applicants.filter((a) => a.selectionStatus === 'SELECTED').length;
    const waitlistCount = applicants.filter((a) => a.selectionStatus === 'WAITLIST').length;
    const qualifiedCount = applicants.filter((a) => a.qualificationStatus === 'QUALIFIED').length;

    // Apply Filter
    if (filter === 'PENDING_QUAL') {
      applicants = applicants.filter((a) => a.qualificationStatus === 'PENDING');
    } else if (filter === 'SELECTED') {
      applicants = applicants.filter((a) => a.selectionStatus === 'SELECTED');
    } else if (filter === 'WAITLIST') {
      applicants = applicants.filter((a) => a.selectionStatus === 'WAITLIST');
    }

    const stats = {
      capacity: course.capacity,
      totalApplicants: applicants.length,
      screenedCount: applicants.filter((a) => a.qualificationStatus !== 'PENDING').length,
      qualifiedCount,
      selectedCount,
      waitlistCount,
      remainingSlots: Math.max(0, course.capacity - selectedCount),
      isFull: selectedCount >= course.capacity,
    };

    return NextResponse.json({
      course,
      stats,
      applicants,
    });
  } catch (error) {
    console.error('Screening queue error:', error);
    return NextResponse.json({ error: 'Failed to fetch queue' }, { status: 500 });
  }
}
