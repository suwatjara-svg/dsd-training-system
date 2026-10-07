import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, hashPassword } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

// GET all users
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admins = await prisma.admin.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(admins);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// POST create new user
export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'เฉพาะ Super Admin เท่านั้นที่สามารถเพิ่มเจ้าหน้าที่ได้' }, { status: 403 });
    }

    const { email, password, fullName, role } = await request.json();

    if (!email || !password || !fullName) {
      return NextResponse.json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน (อีเมล, รหัสผ่าน, ชื่อ-นามสกุล)' }, { status: 400 });
    }

    const existing = await prisma.admin.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json({ error: 'อีเมลนี้มีอยู่ในระบบแล้ว' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);

    const newAdmin = await prisma.admin.create({
      data: {
        email: email.trim(),
        passwordHash,
        fullName: fullName.trim(),
        role: role || 'OFFICER',
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    await logAudit({
      adminId: currentUser.id,
      action: 'CREATE_USER',
      fieldChanged: 'email',
      newValue: newAdmin.email,
      details: `เพิ่มผู้ใช้งานใหม่: ${newAdmin.fullName} (${newAdmin.role})`,
    });

    return NextResponse.json(newAdmin, { status: 201 });
  } catch (error) {
    console.error('Create admin error:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
