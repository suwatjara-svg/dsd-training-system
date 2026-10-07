import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { updateApplicationStatusInSheet } from '@/lib/googleSheetsDb';

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { applicationId, qualificationStatus } = await request.json();

    if (!applicationId || !qualificationStatus) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    await updateApplicationStatusInSheet(applicationId, 'qualificationStatus', qualificationStatus);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Evaluate error:', error);
    return NextResponse.json({ error: 'Failed to update qualification' }, { status: 500 });
  }
}
