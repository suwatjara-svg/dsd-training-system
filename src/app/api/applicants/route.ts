import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const search = searchParams.get('search') || '';
    const qualStatus = searchParams.get('qualStatus');
    const contactStatus = searchParams.get('contactStatus');
    const interestStatus = searchParams.get('interestStatus');
    const selectionStatus = searchParams.get('selectionStatus');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const where: any = {};
    if (courseId) where.courseId = courseId;

    if (search) {
      where.OR = [
        { applicationNumber: { contains: search } },
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { phoneNumber: { contains: search } },
        { idCardNumber: { contains: search } },
      ];
    }

    if (qualStatus) {
      where.screening = { qualificationStatus: qualStatus };
    }

    if (contactStatus) {
      where.contacts = {
        some: { contactStatus: contactStatus },
      };
    }

    if (selectionStatus) {
      where.selection = { selectionStatus: selectionStatus };
    }

    const total = await prisma.application.count({ where });
    const applicants = await prisma.application.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { submittedAt: 'asc' },
      include: {
        course: { select: { id: true, code: true, title: true, capacity: true } },
        screening: { select: { qualificationStatus: true, disqualifiedReason: true } },
        selection: { select: { selectionStatus: true, waitlistOrder: true, isOverridden: true } },
        contacts: {
          orderBy: { contactDate: 'desc' },
          take: 1,
          select: { contactStatus: true, interestStatus: true, notes: true, contactDate: true },
        },
      },
    });

    return NextResponse.json({
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      applicants,
    });
  } catch (error) {
    console.error('Fetch applicants error:', error);
    return NextResponse.json({ error: 'Failed to fetch applicants' }, { status: 500 });
  }
}
