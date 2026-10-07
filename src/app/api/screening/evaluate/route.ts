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

    const { applicationId, qualificationStatus, disqualifiedReason, notes } = await request.json();

    if (!applicationId || !qualificationStatus) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Get previous state for audit log
    const prev = await prisma.applicantScreening.findUnique({
      where: { applicationId },
    });

    const updated = await prisma.applicantScreening.upsert({
      where: { applicationId },
      update: {
        qualificationStatus,
        disqualifiedReason: qualificationStatus === 'NOT_QUALIFIED' ? disqualifiedReason : null,
        evaluatedAt: new Date(),
        evaluatedById: user.id,
        notes,
      },
      create: {
        applicationId,
        qualificationStatus,
        disqualifiedReason: qualificationStatus === 'NOT_QUALIFIED' ? disqualifiedReason : null,
        evaluatedAt: new Date(),
        evaluatedById: user.id,
        notes,
      },
    });

    // If marked as NOT_QUALIFIED, update selection to REJECTED automatically
    if (qualificationStatus === 'NOT_QUALIFIED') {
      await prisma.applicantSelection.upsert({
        where: { applicationId },
        update: { selectionStatus: 'REJECTED' },
        create: { applicationId, selectionStatus: 'REJECTED' },
      });
    }

    await logAudit({
      adminId: user.id,
      applicationId,
      action: 'SCREENING_EVALUATE',
      fieldChanged: 'qualificationStatus',
      oldValue: prev?.qualificationStatus || 'PENDING',
      newValue: qualificationStatus,
      details: qualificationStatus === 'NOT_QUALIFIED' ? `เหตุผล: ${disqualifiedReason}` : 'ผ่านคุณสมบัติ',
    });

    return NextResponse.json({ success: true, screening: updated });
  } catch (error) {
    console.error('Evaluate screening error:', error);
    return NextResponse.json({ error: 'Failed to update qualification' }, { status: 500 });
  }
}
