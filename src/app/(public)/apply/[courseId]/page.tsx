import React from 'react';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import PublicApplyForm from '@/components/public-form/PublicApplyForm';
import { ArrowLeft, Calendar, Users, Clock, MapPin } from 'lucide-react';
import Link from 'next/link';
import { formatThaiDate } from '@/lib/utils';
import { getCoursesFromSheet } from '@/lib/googleSheetsDb';

export const dynamic = 'force-dynamic';

export default async function PublicApplyPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;

  const courses = await getCoursesFromSheet();
  const course = courses.find((c) => c.id === courseId);

  if (!course) {
    notFound();
  }

  // Standard application form definition
  const activeForm = {
    sections: [
      {
        id: 'sec_1',
        title: 'ข้อมูลความพร้อมและประสบการณ์',
        questions: [
          {
            id: 'q_1',
            label: 'เป้าหมายและวัตถุประสงค์ในการเข้าฝึกอบรม',
            questionType: 'LONG_TEXT',
            isRequired: true,
          },
        ],
      },
    ],
  };

  const courseWithDocs = {
    ...course,
    requiredDocuments: (course.requiredDocs || []).map((title: string, index: number) => ({
      id: `doc_${index}`,
      title,
      isRequired: false, // ไม่บังคับตามความต้องการ
    })),
  };

  return (
    <div className="min-h-screen bg-slate-100/70 pb-20">
      {/* Top Purple Banner (สถาบันพัฒนาฝีมือแรงงาน 4 ราชบุรี) */}
      <header className="bg-gradient-to-r from-purple-900 via-purple-800 to-indigo-900 text-white shadow-md sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-3 sm:py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-xl p-1 shadow-sm flex-shrink-0 flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="สถาบันพัฒนาฝีมือแรงงาน 4 ราชบุรี"
                width={48}
                height={48}
                className="object-contain w-full h-full"
                priority
              />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] sm:text-xs text-purple-200 block font-medium leading-none truncate">
                กรมพัฒนาฝีมือแรงงาน กระทรวงแรงงาน
              </span>
              <h1 className="text-sm sm:text-base md:text-lg font-extrabold text-white tracking-wide mt-1 leading-tight truncate">
                สถาบันพัฒนาฝีมือแรงงาน 4 ราชบุรี
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`text-[11px] sm:text-xs font-bold px-2.5 py-1 rounded-full border shadow-xs ${course.status === 'OPEN' ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/40' : 'bg-rose-500/20 text-rose-200 border-rose-400/40'}`}>
              {course.status === 'OPEN' ? '🟢 เปิดรับสมัคร' : '🔴 ปิดรับสมัคร'}
            </span>
            <Link
              href="/"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold backdrop-blur-sm transition"
              title="กลับหน้ารายการหลักสูตร"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">รายการหลักสูตร</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Course Info Header */}
      <div className="max-w-4xl mx-auto px-3 sm:px-4 pt-4 sm:pt-6">
        <div className="bg-white rounded-2xl p-5 sm:p-7 border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border inline-block ${course.status === 'OPEN' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
              {course.status === 'OPEN' ? 'เปิดรับสมัคร' : 'ปิดรับสมัคร'}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-800 leading-snug">
            {course.title.startsWith('หลักสูตร') ? course.title : `หลักสูตร ${course.title}`}
          </h2>

          {course.description && (
            <div className="space-y-1.5 pt-1">
              <span className="text-xs sm:text-sm font-bold text-slate-700 block">
                รายละเอียดหลักสูตร:
              </span>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {course.description}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 pt-3 border-t border-slate-100 text-xs sm:text-sm text-slate-600">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-400 block font-medium text-xs">จำนวนที่รับ:</span>
              <strong className="text-slate-800 text-sm mt-0.5 block">{course.capacity} คน</strong>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-400 block font-medium text-xs">ระยะเวลาอบรม:</span>
              <strong className="text-slate-800 text-sm mt-0.5 block leading-snug">
                {course.startDate ? formatThaiDate(course.startDate) : '-'}
                {course.endDate && ` ถึง ${formatThaiDate(course.endDate)}`}
                {course.trainingDays ? ` (รวม ${course.trainingDays} วัน)` : ''}
              </strong>
            </div>

            {course.timeSlot && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 block font-medium text-xs">เวลาเรียน:</span>
                <strong className="text-slate-800 text-sm mt-0.5 block">{course.timeSlot}</strong>
              </div>
            )}

            {course.location && (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 block font-medium text-xs">สถานที่:</span>
                <strong className="text-slate-800 text-sm mt-0.5 block break-words leading-snug">{course.location}</strong>
              </div>
            )}
          </div>

          {course.qualifications && (
            <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 text-xs sm:text-sm text-amber-950 space-y-1.5">
              <strong className="font-bold block text-amber-900">คุณสมบัติผู้สมัคร:</strong>
              <p className="whitespace-pre-line leading-relaxed">{course.qualifications}</p>
            </div>
          )}
        </div>

        {/* Dynamic Apply Form Component */}
        <div className="mt-8">
          {course.status === 'CLOSED' ? (
            <div className="bg-white rounded-2xl p-8 border border-rose-200 text-center shadow-sm space-y-3">
              <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                ✕
              </div>
              <h2 className="text-xl font-bold text-slate-800">ปิดรับสมัครแล้ว</h2>
              <p className="text-xs text-slate-500">
                หลักสูตรนี้ปิดรับสมัครเรียบร้อยแล้ว หากมีข้อสงสัยกรุณาติดต่อ สถาบันพัฒนาฝีมือแรงงาน 4 ราชบุรี
              </p>
            </div>
          ) : (
            <PublicApplyForm course={courseWithDocs} form={activeForm} />
          )}
        </div>
      </div>
    </div>
  );
}
