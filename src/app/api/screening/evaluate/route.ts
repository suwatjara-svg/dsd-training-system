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

    let normalizedStatus = qualificationStatus;
    if (qualificationStatus === 'PASSED') normalizedStatus = 'QUALIFIED';
    if (qualificationStatus === 'FAILED') normalizedStatus = 'NOT_QUALIFIED';

    const VALID_QUAL_STATUSES = ['PENDING', 'QUALIFIED', 'NOT_QUALIFIED'];
    if (!VALID_QUAL_STATUSES.includes(normalizedStatus)) {
      return NextResponse.json(
        { error: 'สถานะคุณสมบัติไม่ถูกต้อง (ต้องเป็น PENDING, QUALIFIED, หรือ NOT_QUALIFIED)' },
        { status: 400 }
      );
    }

    await updateApplicationStatusInSheet(applicationId, 'qualificationStatus', normalizedStatus);

    return NextResponse.json({ success: true, qualificationStatus: normalizedStatus });
  } catch (error) {
    console.error('Evaluate error:', error);
    return NextResponse.json({ error: 'Failed to update qualification' }, { status: 500 });
  }
}
