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

    const { applicationId, qualificationStatus } = await request.json();

    if (!applicationId || !qualificationStatus) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const VALID_QUAL_STATUSES = ['PENDING', 'PASSED', 'FAILED'];
    if (!VALID_QUAL_STATUSES.includes(qualificationStatus)) {
      return NextResponse.json({ error: 'สถานะคุณสมบัติไม่ถูกต้อง (ต้องเป็น PENDING, PASSED, หรือ FAILED)' }, { status: 400 });
    }

    await updateApplicationStatusInSheet(applicationId, 'qualificationStatus', qualificationStatus);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Evaluate error:', error);
    return NextResponse.json({ error: 'Failed to update qualification' }, { status: 500 });
  }
}
