import { NextResponse } from 'next/server';
import { comparePassword, createSession } from '@/lib/auth';
import { getAdminsFromSheet } from '@/lib/googleSheetsDb';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'กรุณากรอกอีเมลและรหัสผ่าน' }, { status: 400 });
    }

    // Authenticate from Google Sheets
    const admins = await getAdminsFromSheet();
    const admin = admins.find((a) => a.email.toLowerCase() === email.trim().toLowerCase());

    if (!admin) {
      return NextResponse.json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' }, { status: 401 });
    }

    const isMatch = await comparePassword(password, admin.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' }, { status: 401 });
    }

    const token = await createSession({
      id: admin.id,
      email: admin.email,
      fullName: admin.fullName,
      role: admin.role,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: admin.id,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
      },
    });

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการเชื่อมต่อ Google Sheets' }, { status: 500 });
  }
}
