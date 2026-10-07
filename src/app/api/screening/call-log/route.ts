import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { applicationId, contactStatus, interestStatus, notes } = await request.json();

    if (!applicationId || !contactStatus) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Count attempts
    const attemptCount = await prisma.applicantContact.count({
      where: { applicationId },
    });

    const contactLog = await prisma.applicantContact.create({
      data: {
        applicationId,
        contactStatus,
        interestStatus: interestStatus || 'UNKNOWN',
        calledById: user.id,
        notes,
        callAttempt: attemptCount + 1,
      },
    });

    // If Not Interested, mark selection as WITHDRAWN
    if (interestStatus === 'NOT_INTERESTED') {
      await prisma.applicantSelection.upsert({
        where: { applicationId },
        update: { selectionStatus: 'WITHDRAWN', remarks: 'ผู้สมัครแจ้งไม่ประสงค์เข้าอบรม' },
        create: { applicationId, selectionStatus: 'WITHDRAWN', remarks: 'ผู้สมัครแจ้งไม่ประสงค์เข้าอบรม' },
      });
    }

    await logAudit({
      adminId: user.id,
      applicationId,
      action: 'CALL_LOG',
      fieldChanged: 'contactStatus',
      oldValue: '',
      newValue: contactStatus,
      details: `ผลการติดต่อ: ${contactStatus}, ความต้องการ: ${interestStatus || 'UNKNOWN'}, โน้ต: ${notes || '-'}`,
    });

    return NextResponse.json({ success: true, contactLog });
  } catch (error) {
    console.error('Call log error:', error);
    return NextResponse.json({ error: 'Failed to record call log' }, { status: 500 });
  }
}
