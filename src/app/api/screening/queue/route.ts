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
    const filter = searchParams.get('filter') || 'ALL'; // ALL, PENDING_QUAL, QUALIFIED_UNCONTACTED, INTERESTED_UNSELECTED, SELECTED, WAITLIST

    if (!courseId) {
      return NextResponse.json({ error: 'courseId is required' }, { status: 400 });
    }

    // 1. Get Course & Capacity Stats
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        _count: {
          select: { applications: true },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Calculate funnel counts
    const [
      screenedCount,
      qualifiedCount,
      notQualifiedCount,
      selectedCount,
      waitlistCount,
      contactedCount,
      interestedCount,
    ] = await Promise.all([
      prisma.applicantScreening.count({
        where: { application: { courseId }, qualificationStatus: { not: 'PENDING' } },
      }),
      prisma.applicantScreening.count({
        where: { application: { courseId }, qualificationStatus: 'QUALIFIED' },
      }),
      prisma.applicantScreening.count({
        where: { application: { courseId }, qualificationStatus: 'NOT_QUALIFIED' },
      }),
      prisma.applicantSelection.count({
        where: { application: { courseId }, selectionStatus: 'SELECTED' },
      }),
      prisma.applicantSelection.count({
        where: { application: { courseId }, selectionStatus: 'WAITLIST' },
      }),
      prisma.applicantContact.count({
        where: { application: { courseId }, contactStatus: 'CONTACTED' },
      }),
      prisma.applicantContact.count({
        where: { application: { courseId }, interestStatus: 'INTERESTED' },
      }),
    ]);

    // 2. Query Applicants according to screening queue filter
    const whereClause: any = { courseId };

    if (filter === 'PENDING_QUAL') {
      whereClause.screening = { qualificationStatus: 'PENDING' };
    } else if (filter === 'QUALIFIED_UNCONTACTED') {
      whereClause.screening = { qualificationStatus: 'QUALIFIED' };
      whereClause.contacts = { none: { contactStatus: 'CONTACTED' } };
    } else if (filter === 'INTERESTED_UNSELECTED') {
      whereClause.screening = { qualificationStatus: 'QUALIFIED' };
      whereClause.contacts = { some: { interestStatus: 'INTERESTED' } };
      whereClause.selection = { selectionStatus: 'PENDING' };
    } else if (filter === 'SELECTED') {
      whereClause.selection = { selectionStatus: 'SELECTED' };
    } else if (filter === 'WAITLIST') {
      whereClause.selection = { selectionStatus: 'WAITLIST' };
    }

    const applicants = await prisma.application.findMany({
      where: whereClause,
      orderBy: { submittedAt: 'asc' },
      include: {
        screening: true,
        contacts: {
          orderBy: { contactDate: 'desc' },
          include: { calledBy: { select: { fullName: true } } },
        },
        selection: {
          include: { selectedBy: { select: { fullName: true } } },
        },
        documents: true,
        answers: {
          include: { question: true },
        },
      },
    });

    const stats = {
      capacity: course.capacity,
      totalApplicants: course._count.applications,
      screenedCount,
      qualifiedCount,
      notQualifiedCount,
      contactedCount,
      interestedCount,
      selectedCount,
      waitlistCount,
      remainingSlots: Math.max(0, course.capacity - selectedCount),
      isFull: selectedCount >= course.capacity,
    };

    return NextResponse.json({
      course,
      stats,
      applicants,
    });
  } catch (error) {
    console.error('Screening query error:', error);
    return NextResponse.json({ error: 'Failed to fetch screening data' }, { status: 500 });
  }
}
