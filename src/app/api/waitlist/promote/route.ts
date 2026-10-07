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

    const { courseId, applicationId } = await request.json();

    if (!courseId) {
      return NextResponse.json({ error: 'courseId is required' }, { status: 400 });
    }

    // Find candidate to promote: either specific or first in waitlist
    let targetSelection;
    if (applicationId) {
      targetSelection = await prisma.applicantSelection.findUnique({
        where: { applicationId },
        include: { application: true },
      });
    } else {
      targetSelection = await prisma.applicantSelection.findFirst({
        where: {
          application: { courseId },
          selectionStatus: 'WAITLIST',
        },
        orderBy: { waitlistOrder: 'asc' },
        include: { application: true },
      });
    }

    if (!targetSelection || targetSelection.selectionStatus !== 'WAITLIST') {
      return NextResponse.json({ error: 'ไม่พบผู้สมัครสำรองที่สามารถเลื่อนสิทธิ์ได้' }, { status: 404 });
    }

    const prevOrder = targetSelection.waitlistOrder;

    // Promote to SELECTED
    await prisma.applicantSelection.update({
      where: { id: targetSelection.id },
      data: {
        selectionStatus: 'SELECTED',
        waitlistOrder: null,
        selectedDate: new Date(),
        selectedById: user.id,
        remarks: `เลื่อนจากผู้สมัครสำรองลำดับที่ ${prevOrder}`,
      },
    });

    // Re-index remaining waitlist items
    const remainingWaitlist = await prisma.applicantSelection.findMany({
      where: {
        application: { courseId },
        selectionStatus: 'WAITLIST',
      },
      orderBy: { waitlistOrder: 'asc' },
    });

    for (let i = 0; i < remainingWaitlist.length; i++) {
      await prisma.applicantSelection.update({
        where: { id: remainingWaitlist[i].id },
        data: { waitlistOrder: i + 1 },
      });
    }

    await logAudit({
      adminId: user.id,
      applicationId: targetSelection.applicationId,
      action: 'WAITLIST_PROMOTE',
      fieldChanged: 'selectionStatus',
      oldValue: `WAITLIST (#${prevOrder})`,
      newValue: 'SELECTED',
      details: `เลื่อนผู้สมัครสำรองลำดับที่ ${prevOrder} ขึ้นเป็นผู้ผ่านการคัดเลือกตัวจริง`,
    });

    return NextResponse.json({
      success: true,
      message: `เลื่อนผู้สมัคร ${targetSelection.application.firstName} ${targetSelection.application.lastName} ขึ้นเป็นตัวจริงเรียบร้อยแล้ว`,
    });
  } catch (error) {
    console.error('Waitlist promote error:', error);
    return NextResponse.json({ error: 'Failed to promote waitlist' }, { status: 500 });
  }
}
