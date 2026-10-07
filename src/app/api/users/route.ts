import { NextResponse } from 'next/server';
import { getCurrentUser, hashPassword } from '@/lib/auth';
import { getAdminsFromSheet, addAdminToSheet } from '@/lib/googleSheetsDb';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admins = await getAdminsFromSheet();
    return NextResponse.json(
      admins.map((a) => ({
        id: a.id,
        email: a.email,
        fullName: a.fullName,
        role: a.role,
        isActive: a.isActive,
        createdAt: new Date().toISOString(),
      }))
    );
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'เฉพาะ Super Admin เท่านั้นที่สามารถเพิ่มเจ้าหน้าที่ได้' }, { status: 403 });
    }

    const { email, password, fullName, role } = await request.json();

    if (!email || !password || !fullName) {
      return NextResponse.json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' }, { status: 400 });
    }

    const admins = await getAdminsFromSheet();
    const existing = admins.find((a) => a.email.toLowerCase() === email.trim().toLowerCase());

    if (existing) {
      return NextResponse.json({ error: 'อีเมลนี้มีอยู่ในระบบแล้ว' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const id = `user_${Date.now()}`;

    await addAdminToSheet({
      id,
      email: email.trim(),
      passwordHash,
      fullName: fullName.trim(),
      role: role || 'OFFICER',
    });

    return NextResponse.json({ id, email, fullName, role }, { status: 201 });
  } catch (error) {
    console.error('Create admin error:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
