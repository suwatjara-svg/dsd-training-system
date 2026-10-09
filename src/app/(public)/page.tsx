import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Calendar,
  MapPin,
  Users,
  ArrowRight,
} from 'lucide-react';
import { formatThaiDate } from '@/lib/utils';
import { getCoursesFromSheet } from '@/lib/googleSheetsDb';

export const dynamic = 'force-dynamic';

export default async function PublicHomePage() {
  const courses = await getCoursesFromSheet();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 relative flex-shrink-0 bg-white rounded-xl p-1 shadow-sm border border-slate-100">
              <Image
                src="/logo.png"
                alt="สถาบันพัฒนาฝีมือแรงงาน 4 ราชบุรี"
                width={48}
                height={48}
                className="object-contain w-full h-full"
                priority
              />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-slate-900 leading-tight">
                สถาบันพัฒนาฝีมือแรงงาน 4 ราชบุรี
              </h1>
              <p className="text-xs text-slate-500">
                ระบบรับสมัครและฝึกอบรมออนไลน์ • กรมพัฒนาฝีมือแรงงาน
              </p>
            </div>
          </div>

          <Link
            href="/login"
            className="text-xs font-semibold px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
          >
            สำหรับเจ้าหน้าที่ (Staff Login)
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-sky-900 via-sky-800 to-indigo-950 text-white py-14 px-4 shadow-inner">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            พัฒนาทักษะวิชาชีพ ต่อยอดสร้างรายได้
          </h2>
          <p className="text-sky-100/90 text-sm md:text-base max-w-2xl mx-auto">
            เลือกหลักสูตรที่สนใจ กรอกใบสมัครออนไลน์ และอัปโหลดเอกสารเพื่อรับการคัดเลือกเข้าฝึกอบรม ไม่เสียค่าใช้จ่าย
          </p>
        </div>
      </section>

      {/* Course Cards Grid */}
      <main className="max-w-6xl mx-auto px-4 py-10 flex-1 w-full space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800">
            หลักสูตรที่กำลังเปิดรับสมัคร ({courses.length})
          </h3>
        </div>

        {courses.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
            <p className="text-sm text-slate-500">ขณะนี้ยังไม่มีหลักสูตรที่เปิดรับสมัคร</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition flex flex-col justify-between overflow-hidden group"
              >
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                        course.status === 'OPEN'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {course.status === 'OPEN' ? 'เปิดรับสมัคร' : 'ปิดรับสมัคร'}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-slate-900 group-hover:text-sky-600 transition leading-snug">
                      {course.title.startsWith('หลักสูตร') ? course.title : `หลักสูตร ${course.title}`}
                    </h4>
                    {course.description && (
                      <div className="mt-2 space-y-0.5">
                        <span className="text-[11px] font-bold text-slate-700 block">รายละเอียดหลักสูตร:</span>
                        <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                          {course.description}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-slate-400" />
                      <span>
                        รับจำนวน: <strong className="text-slate-800">{course.capacity} คน</strong>
                      </span>
                    </div>

                    {(course.startDate || course.endDate) && (
                      <div className="flex items-start gap-2">
                        <Calendar className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                        <span>
                          ระยะเวลาอบรม:{' '}
                          <strong className="text-slate-700 font-semibold">
                            {course.startDate ? formatThaiDate(course.startDate) : '-'}
                            {course.endDate && ` ถึง ${formatThaiDate(course.endDate)}`}
                            {course.trainingDays ? ` (รวม ${course.trainingDays} วัน)` : ''}
                          </strong>
                        </span>
                      </div>
                    )}

                    {course.location && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                        <span className="break-words leading-snug">{course.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100">
                  {course.status === 'OPEN' ? (
                    <Link
                      href={`/apply/${course.id}`}
                      className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition"
                    >
                      <span>สมัครเข้ารับการฝึกอบรม</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : (
                    <div className="w-full py-2.5 px-4 rounded-xl bg-slate-200 text-slate-500 font-bold text-xs text-center">
                      ปิดรับสมัครแล้ว
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        <p>© 2569 สถาบันพัฒนาฝีมือแรงงาน 4 ราชบุรี • กรมพัฒนาฝีมือแรงงาน</p>
      </footer>
    </div>
  );
}
