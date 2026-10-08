import { NextResponse } from 'next/server';
import { getApplicationsFromSheet, updateApplicationStatusInSheet } from '@/lib/googleSheetsDb';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { courseId, applicationId } = await request.json();

    if (!courseId) {
      return NextResponse.json({ error: 'courseId is required' }, { status: 400 });
    }

    const apps = await getApplicationsFromSheet(courseId);
    const waitlistApps = apps.filter((a) => a.selectionStatus === 'WAITLIST');

    const target = applicationId
      ? waitlistApps.find((a) => a.id === applicationId)
      : waitlistApps[0];

    if (!target) {
      return NextResponse.json({ error: 'ไม่พบผู้สมัครสำรองที่สามารถเลื่อนสิทธิ์ได้' }, { status: 404 });
    }

    await updateApplicationStatusInSheet(target.id, 'selectionStatus', 'SELECTED');

    return NextResponse.json({
      success: true,
      promotedApplication: target,
    });
  } catch (error) {
    console.error('Waitlist promote error:', error);
    return NextResponse.json({ error: 'Failed to promote waitlist candidate' }, { status: 500 });
  }
}
