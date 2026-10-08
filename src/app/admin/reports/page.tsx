import React from 'react';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { FileSpreadsheet, Download, FileText } from 'lucide-react';

export default async function ReportsPage() {
  const courses = await prisma.course.findMany({
    include: {
      _count: { select: { applications: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
          <span>รายงานและส่งออกข้อมูล (Reports & Data Export)</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          ดาวน์โหลดข้อมูลในรูปแบบ Excel (.xlsx) แยกตามกลุ่มผู้สมัครและสถานะการคัดเลือก
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {courses.map((c) => (
          <div key={c.id} className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">ผู้สมัคร: {c._count.applications} คน</span>
              </div>
              <h3 className="text-base font-bold text-slate-800 mt-1">{c.title}</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100">
              <a
                href={`/api/export?courseId=${c.id}&type=ALL`}
                target="_blank"
                className="p-2.5 rounded-xl border border-slate-200 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 text-xs font-semibold flex items-center justify-between transition"
              >
                <span>ผู้สมัครทั้งหมด</span>
                <Download className="w-4 h-4" />
              </a>

              <a
                href={`/api/export?courseId=${c.id}&type=SELECTED`}
                target="_blank"
                className="p-2.5 rounded-xl border border-slate-200 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 text-xs font-semibold flex items-center justify-between transition"
              >
                <span>ผู้ผ่านการคัดเลือก (ตัวจริง)</span>
                <Download className="w-4 h-4" />
              </a>

              <a
                href={`/api/export?courseId=${c.id}&type=WAITLIST`}
                target="_blank"
                className="p-2.5 rounded-xl border border-slate-200 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 text-xs font-semibold flex items-center justify-between transition"
              >
                <span>ผู้สมัครสำรอง (Waitlist)</span>
                <Download className="w-4 h-4" />
              </a>

              <a
                href={`/api/export?courseId=${c.id}&type=QUALIFIED`}
                target="_blank"
                className="p-2.5 rounded-xl border border-slate-200 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 text-xs font-semibold flex items-center justify-between transition"
              >
                <span>ผู้ผ่านคุณสมบัติ</span>
                <Download className="w-4 h-4" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
