import React from 'react';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { PlusCircle, GraduationCap, Users, Calendar, MapPin, CheckCircle } from 'lucide-react';
import { formatThaiDate } from '@/lib/utils';

export default async function AdminCoursesPage() {
  const courses = await prisma.course.findMany({
    include: {
      _count: {
        select: { applications: true },
      },
      forms: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">จัดการหลักสูตรฝึกอบรม (Course Management)</h1>
          <p className="text-xs text-slate-500 mt-1">
            เปิด-ปิดรับสมัคร กำหนดจำนวนที่รับ (Capacity) และจัดการแบบฟอร์มประจำหลักสูตร
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((c) => (
          <div key={c.id} className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-end">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {c.status}
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-800">{c.title}</h3>
              <p className="text-xs text-slate-500 line-clamp-2">{c.description}</p>

              <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-600">
                <p>จำนวนที่รับ: <strong className="text-slate-800">{c.capacity} คน</strong></p>
                <p>ผู้สมัครขณะนี้: <strong className="text-sky-600">{c._count.applications} คน</strong></p>
                {c.startDate && <p>เริ่มอบรม: {formatThaiDate(c.startDate)}</p>}
                {c.responsiblePerson && <p>ผู้รับผิดชอบ: {c.responsiblePerson}</p>}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
              <Link
                href={`/admin/screening?courseId=${c.id}`}
                className="flex-1 py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs text-center transition shadow-sm"
              >
                คัดเลือกผู้สมัคร
              </Link>
              <Link
                href={`/apply/${c.id}`}
                target="_blank"
                className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs text-center transition"
              >
                ดูหน้าฟอร์ม
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
