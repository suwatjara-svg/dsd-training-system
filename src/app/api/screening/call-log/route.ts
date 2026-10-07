import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { addContactToSheet } from '@/lib/googleSheetsDb';

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

    const id = `call_${Date.now()}`;
    await addContactToSheet({
      id,
      applicationId,
      contactStatus,
      interestStatus: interestStatus || 'UNKNOWN',
      notes: notes || '',
      contactDate: new Date().toLocaleString('th-TH'),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Call log error:', error);
    return NextResponse.json({ error: 'Failed to record call log' }, { status: 500 });
  }
}
