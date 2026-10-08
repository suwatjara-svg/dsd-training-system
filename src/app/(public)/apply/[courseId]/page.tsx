import React from 'react';
import { notFound } from 'next/navigation';
import PublicApplyForm from '@/components/public-form/PublicApplyForm';
import { ArrowLeft } from 'lucide-react';
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
          <span className={`text-xs font-bold px-2 py-0.5 rounded border ${course.status === 'OPEN' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
            {course.status === 'OPEN' ? 'เปิดรับสมัคร' : 'ปิดรับสมัคร'}
          </span>
        </div>
      </header>

      {/* Main Course Info Header */}
      <div className="max-w-4xl mx-auto px-4 pt-8">
        <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200/80 shadow-sm space-y-4">
          <span className={`text-xs font-bold px-2.5 py-1 rounded border inline-block ${course.status === 'OPEN' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
            {course.status === 'OPEN' ? 'เปิดรับสมัคร' : 'ปิดรับสมัคร'}
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

            <div>
              <span className="text-slate-400 block font-medium">ระยะเวลาอบรม:</span>
              <strong className="text-slate-800 text-sm mt-0.5 block">
                {course.startDate ? formatThaiDate(course.startDate) : '-'}
                {course.endDate && ` ถึง ${formatThaiDate(course.endDate)}`}
                {course.trainingDays ? ` (รวม ${course.trainingDays} วัน)` : ''}
              </strong>
            </div>

            {course.timeSlot && (
              <div>
                <span className="text-slate-400 block font-medium">เวลาเรียน:</span>
                <strong className="text-slate-800 text-sm mt-0.5 block">{course.timeSlot}</strong>
              </div>
            )}

            {course.location && (
              <div>
                <span className="text-slate-400 block font-medium">สถานที่:</span>
                <strong className="text-slate-800 text-sm mt-0.5 block break-words leading-snug">{course.location}</strong>
              </div>
            )}
          </div>

          {course.qualifications && (
            <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
              <strong className="font-bold block">คุณสมบัติผู้สมัคร:</strong>
              <p className="whitespace-pre-line">{course.qualifications}</p>
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
