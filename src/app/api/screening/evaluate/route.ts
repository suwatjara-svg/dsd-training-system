import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { updateApplicationEvaluationInSheet } from '@/lib/googleSheetsDb';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['SUPER_ADMIN', 'ADMIN', 'OFFICER'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden: สิทธิ์ไม่เพียงพอ' }, { status: 403 });
    }

    const body = await request.json();
    const {
      applicationId,
      qualificationStatus,
      selectionStatus,
      contactStatus,
      interestStatus,
      notes,
    } = body;

    if (!applicationId) {
      return NextResponse.json({ error: 'Missing applicationId' }, { status: 400 });
    }

    let normalizedQual = qualificationStatus;
    if (qualificationStatus === 'PASSED') normalizedQual = 'QUALIFIED';
    if (qualificationStatus === 'FAILED') normalizedQual = 'NOT_QUALIFIED';

    await updateApplicationEvaluationInSheet(applicationId, {
      qualificationStatus: normalizedQual,
      selectionStatus,
      contactStatus,
      interestStatus,
      notes,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Evaluate error:', error);
    return NextResponse.json({ error: 'Failed to update evaluation' }, { status: 500 });
  }
}
