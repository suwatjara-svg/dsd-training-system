import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { updateApplicationStatusInSheet } from '@/lib/googleSheetsDb';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['SUPER_ADMIN', 'ADMIN', 'OFFICER'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden: สิทธิ์ไม่เพียงพอ' }, { status: 403 });
    }

    const { applicationId, selectionStatus } = await request.json();

    if (!applicationId || !selectionStatus) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const VALID_SELECTION_STATUSES = ['PENDING', 'SELECTED', 'WAITLIST', 'REJECTED'];
    if (!VALID_SELECTION_STATUSES.includes(selectionStatus)) {
      return NextResponse.json({ error: 'สถานะการคัดเลือกไม่ถูกต้อง' }, { status: 400 });
    }

    await updateApplicationStatusInSheet(applicationId, 'selectionStatus', selectionStatus);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Selection error:', error);
    return NextResponse.json({ error: 'Failed to record selection' }, { status: 500 });
  }
}
