import React from 'react';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import PublicApplyForm from '@/components/public-form/PublicApplyForm';
import { GraduationCap, ArrowLeft, Users, Calendar, MapPin, Clock } from 'lucide-react';
import Link from 'next/link';
import { formatThaiDate } from '@/lib/utils';

export default async function PublicApplyPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      requiredDocuments: true,
      forms: {
        where: { isPublished: true },
        orderBy: { version: 'desc' },
        take: 1,
        include: {
          sections: {
            orderBy: { orderIndex: 'asc' },
            include: {
              questions: {
                orderBy: { orderIndex: 'asc' },
              },
            },
          },
        },
      },
    },
  });

  if (!course) {
    notFound();
  }

  const activeForm = course.forms[0] || null;

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-sky-600 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>กลับหน้ารายการหลักสูตร</span>
          </Link>
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">
            {course.code}
          </span>
        </div>
      </header>

      {/* Main Course Info Header */}
      <div className="max-w-4xl mx-auto px-4 pt-8">
        <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200/80 shadow-sm space-y-4">
          <span className="text-xs font-bold px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
            เปิดรับสมัคร
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 leading-tight">
            {course.title}
          </h1>
          <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
            {course.description}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-slate-100 text-xs text-slate-600">
            <div>
              <span className="text-slate-400 block font-medium">จำนวนที่รับ:</span>
              <strong className="text-slate-800 text-sm mt-0.5 block">{course.capacity} คน</strong>
            </div>

            {course.startDate && (
              <div>
                <span className="text-slate-400 block font-medium">ระยะเวลาอบรม:</span>
                <strong className="text-slate-800 text-sm mt-0.5 block">{formatThaiDate(course.startDate)}</strong>
              </div>
            )}

            {course.timeSlot && (
              <div>
                <span className="text-slate-400 block font-medium">เวลาเรียน:</span>
                <strong className="text-slate-800 text-sm mt-0.5 block">{course.timeSlot}</strong>
              </div>
            )}

            {course.location && (
              <div>
                <span className="text-slate-400 block font-medium">สถานที่:</span>
                <strong className="text-slate-800 text-sm mt-0.5 block truncate">{course.location}</strong>
              </div>
            )}
          </div>

          {course.qualifications && (
            <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
              <strong className="font-bold block">คุณสมบัติผู้สมัคร:</strong>
              <p>{course.qualifications}</p>
            </div>
          )}
        </div>

        {/* Dynamic Apply Form Component */}
        <div className="mt-8">
          <PublicApplyForm course={course} form={activeForm} />
        </div>
      </div>
    </div>
  );
}
