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

    const { applicationId, selectionStatus, remarks, forceOverride = false } = await request.json();

    if (!applicationId || !selectionStatus) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        course: true,
        selection: true,
      },
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // 1. Capacity Enforcement Check
    if (selectionStatus === 'SELECTED') {
      const currentSelectedCount = await prisma.applicantSelection.count({
        where: {
          application: { courseId: application.courseId },
          selectionStatus: 'SELECTED',
          applicationId: { not: applicationId },
        },
      });

      if (currentSelectedCount >= application.course.capacity && !forceOverride) {
        return NextResponse.json({
          error: 'CAPACITY_REACHED',
          message: `หลักสูตรนี้รับผู้เข้าอบรมครบ ${application.course.capacity} คนแล้ว ต้องการเพิ่มเป็นกรณีพิเศษ หรือจัดเป็นผู้สมัครสำรองหรือไม่?`,
          currentSelected: currentSelectedCount,
          capacity: application.course.capacity,
        }, { status: 409 });
      }
    }

    // 2. Waitlist Auto-Increment Logic
    let waitlistOrder: number | null = null;
    if (selectionStatus === 'WAITLIST') {
      const highestWaitlist = await prisma.applicantSelection.findFirst({
        where: {
          application: { courseId: application.courseId },
          selectionStatus: 'WAITLIST',
        },
        orderBy: { waitlistOrder: 'desc' },
      });
      waitlistOrder = (highestWaitlist?.waitlistOrder || 0) + 1;
    }

    const updated = await prisma.applicantSelection.upsert({
      where: { applicationId },
      update: {
        selectionStatus,
        waitlistOrder: selectionStatus === 'WAITLIST' ? waitlistOrder : null,
        selectedDate: new Date(),
        selectedById: user.id,
        remarks,
        isOverridden: forceOverride,
      },
      create: {
        applicationId,
        selectionStatus,
        waitlistOrder: selectionStatus === 'WAITLIST' ? waitlistOrder : null,
        selectedDate: new Date(),
        selectedById: user.id,
        remarks,
        isOverridden: forceOverride,
      },
    });

    await logAudit({
      adminId: user.id,
      applicationId,
      action: 'SELECTION_DECIDE',
      fieldChanged: 'selectionStatus',
      oldValue: application.selection?.selectionStatus || 'PENDING',
      newValue: selectionStatus,
      details: `ผลคัดเลือก: ${selectionStatus}${waitlistOrder ? ` (สำรองลำดับที่ ${waitlistOrder})` : ''} ${remarks ? `, หมายเหตุ: ${remarks}` : ''}`,
    });

    return NextResponse.json({ success: true, selection: updated });
  } catch (error) {
    console.error('Selection decide error:', error);
    return NextResponse.json({ error: 'Failed to record selection' }, { status: 500 });
  }
}
