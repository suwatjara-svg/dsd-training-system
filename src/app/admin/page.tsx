'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  PlusCircle,
  GraduationCap,
  Users,
  CheckCircle2,
  Calendar,
  MapPin,
  Layers,
  ArrowRight,
  Trash2,
  Power,
} from 'lucide-react';
import { formatThaiDate } from '@/lib/utils';

export default function AdminHomePage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form states for new course (ไม่เอารหัสหลักสูตรแล้ว)
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [capacity, setCapacity] = useState('20');
  const [location, setLocation] = useState('สถาบันพัฒนาฝีมือแรงงาน 4 ราชบุรี');
  const [timeSlot, setTimeSlot] = useState('09:00 - 16:00 น.');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [trainingDays, setTrainingDays] = useState('5');
  const [qualifications, setQualifications] = useState('');

  // Required docs checklist config
  const [docIdCard, setDocIdCard] = useState(true);
  const [docPhoto, setDocPhoto] = useState(true);
  const [docEducation, setDocEducation] = useState(false);
  const [docOther, setDocOther] = useState(false);
  const [docOtherTitle, setDocOtherTitle] = useState('');

  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const loadCourses = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/courses');
      const data = await res.json();
      if (Array.isArray(data)) setCourses(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const handleToggleStatus = async (courseId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'OPEN' ? 'CLOSED' : 'OPEN';
    try {
      const res = await fetch('/api/courses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, status: newStatus }),
      });
      if (res.ok) {
        loadCourses();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteCourse = async (courseId: string, courseTitle: string) => {
    if (!window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบหลักสูตร "${courseTitle}" ?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/courses?courseId=${courseId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        loadCourses();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');

    // Prepare list of docs based on checkboxes
    const docs: string[] = [];
    if (docIdCard) docs.push('เอกสารแนบ 1');
    if (docPhoto) docs.push('เอกสารแนบ 2');
    if (docEducation) docs.push('สำเนาวุฒิการศึกษา');
    if (docOther && docOtherTitle.trim()) docs.push(docOtherTitle.trim());

    try {
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          capacity: Number(capacity),
          location,
          timeSlot,
          startDate: startDate || null,
          endDate: endDate || null,
          trainingDays: trainingDays ? Number(trainingDays) : null,
          qualifications,
          requiredDocs: docs,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'สร้างหลักสูตรไม่สำเร็จ');

      setShowCreateModal(false);
      setTitle('');
      setDescription('');
      loadCourses();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header & Department Banner */}
      <div className="bg-gradient-to-r from-sky-900 via-sky-800 to-indigo-950 rounded-2xl p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-sky-700/50">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 bg-white rounded-2xl p-2 shadow-lg flex-shrink-0 flex items-center justify-center">
            <Image
              src="/logo.png"
              alt="สถาบันพัฒนาฝีมือแรงงาน 4 ราชบุรี"
              width={72}
              height={72}
              className="object-contain"
              priority
            />
          </div>
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-sky-200 bg-sky-950/80 px-3 py-1 rounded-full border border-sky-400/30">
              กรมพัฒนาฝีมือแรงงาน กระทรวงแรงงาน
            </span>
            <h1 className="text-2xl md:text-3xl font-extrabold mt-2 tracking-tight">
              สถาบันพัฒนาฝีมือแรงงาน 4 ราชบุรี
            </h1>
            <p className="text-sky-100/90 text-xs md:text-sm mt-1">
              ระบบรับสมัคร คัดเลือก และบริหารผู้เข้าฝึกอบรมออนไลน์
            </p>
          </div>
        </div>

        <div>
          <button
            onClick={() => { setShowCreateModal(true); setError(''); }}
            className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-sm shadow-lg hover:shadow-emerald-500/30 active:scale-95 transition"
          >
            <PlusCircle className="w-5 h-5" />
            <span>สร้างการรับสมัครหลักสูตรใหม่</span>
          </button>
        </div>
      </div>

      {/* Course Batches Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Layers className="w-5 h-5 text-sky-600" />
              <span>หลักสูตร / รุ่นที่เปิดรับสมัคร ({courses.length})</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              คลิกที่การ์ดของแต่ละรุ่น เพื่อเข้าสู่ระบบคัดเลือกผู้สมัคร ตรวจสอบรายชื่อ และจัดการคิวสำรอง
            </p>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl p-16 text-center border border-slate-200">
            <span className="inline-block w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin"></span>
            <p className="text-xs text-slate-500 mt-3 font-semibold">กำลังโหลดหลักสูตรจาก Google Sheet...</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center border border-slate-200/90 space-y-4">
            <GraduationCap className="w-12 h-12 text-slate-300 mx-auto" />
            <div>
              <h3 className="text-base font-bold text-slate-700">ยังไม่มีหลักสูตรที่เปิดรับสมัคร</h3>
              <p className="text-xs text-slate-400 mt-1">กดปุ่มด้านบนเพื่อสร้างการรับสมัครหลักสูตรแรกของคุณ</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition shadow-sm"
            >
              + สร้างหลักสูตรใหม่
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((c) => (
              <div
                key={c.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-sky-300 transition flex flex-col justify-between overflow-hidden group"
              >
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                        c.status === 'OPEN'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {c.status === 'OPEN' ? '🟢 เปิดรับสมัคร' : '🔴 ปิดรับสมัคร'}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleToggleStatus(c.id, c.status)}
                        title={c.status === 'OPEN' ? 'คลิกเพื่อปิดรับสมัคร' : 'คลิกเพื่อเปิดรับสมัคร'}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 shadow-sm ${
                          c.status === 'OPEN'
                            ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        <Power className="w-3 h-3" />
                        <span>{c.status === 'OPEN' ? 'ปิดรับสมัคร' : 'เปิดรับสมัคร'}</span>
                      </button>

                      <button
                        onClick={() => handleDeleteCourse(c.id, c.title)}
                        title="ลบหลักสูตรนี้"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition border border-transparent hover:border-rose-200"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-800 group-hover:text-sky-600 transition leading-snug">
                      {c.title.startsWith('หลักสูตร') ? c.title : `หลักสูตร ${c.title}`}
                    </h3>
                    <div className="mt-1.5 space-y-0.5">
                      <span className="text-[11px] font-semibold text-slate-600 block">รายละเอียดหลักสูตร:</span>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {c.description || 'ไม่มีรายละเอียดเพิ่มเติม'}
                      </p>
                    </div>
                  </div>

                  {/* Batch Stats */}
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-xs">
                    <div className="bg-sky-50/90 p-2.5 rounded-xl border border-sky-200">
                      <span className="text-sky-700 block font-semibold text-[11px] flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>สมัครแล้ว</span>
                      </span>
                      <strong className="text-sky-950 text-base mt-0.5 block font-extrabold">
                        {c.applicantCount ?? c._count?.applications ?? 0} คน
                      </strong>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block font-medium text-[11px]">จำนวนที่รับ</span>
                      <strong className="text-slate-800 text-base mt-0.5 block font-bold">{c.capacity} คน</strong>
                    </div>

                    <div className={`p-2.5 rounded-xl border ${c.status === 'OPEN' ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-100 border-slate-200'}`}>
                      <span className={`block font-medium text-[11px] ${c.status === 'OPEN' ? 'text-emerald-700' : 'text-slate-500'}`}>สถานะ</span>
                      <strong className={`text-xs mt-1 block font-bold truncate ${c.status === 'OPEN' ? 'text-emerald-800' : 'text-slate-700'}`}>
                        {c.status === 'OPEN' ? 'เปิดรับสมัคร' : 'ปิดรับสมัคร'}
                      </strong>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-500">
                    <div>
                      <span className="text-slate-400 block text-[11px]">ระยะเวลาอบรม:</span>
                      <strong className="text-slate-700 font-semibold">
                        {c.startDate ? formatThaiDate(c.startDate) : '-'}
                        {c.endDate && ` ถึง ${formatThaiDate(c.endDate)}`}
                        {c.trainingDays ? ` (${c.trainingDays} วัน)` : ''}
                      </strong>
                    </div>
                    {c.location && (
                      <div className="flex items-start gap-1.5 pt-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                        <span className="break-words leading-snug">{c.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Menu */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-2">
                  <Link
                    href={`/admin/screening?courseId=${c.id}`}
                    className="w-full py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>เข้าสู่การคัดเลือกผู้สมัคร (Screening)</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-auto" />
                  </Link>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Link
                      href={`/apply/${c.id}`}
                      target="_blank"
                      className="py-1.5 px-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-[11px] font-semibold text-center transition"
                    >
                      ดูหน้าใบสมัคร
                    </Link>
                    <Link
                      href={`/admin/screening?courseId=${c.id}&filter=WAITLIST`}
                      className="py-1.5 px-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-[11px] font-semibold text-center transition"
                    >
                      จัดการสำรอง
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Course Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <PlusCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">สร้างการรับสมัครหลักสูตรใหม่</h3>
                <p className="text-xs text-slate-500">สถาบันพัฒนาฝีมือแรงงาน 4 ราชบุรี</p>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateCourse} className="space-y-3.5 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ชื่อหลักสูตร <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="เช่น การทำเบเกอรี่และขนมอบเชิงพาณิชย์"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  จำนวนที่รับ (คน) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  placeholder="20"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  รายละเอียดหลักสูตร
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="รายละเอียดเนื้อหา และหัวข้อการฝึกอบรม"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    วันที่เริ่มอบรม
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    วันที่สิ้นสุด
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    จำนวนวันที่เรียน (วัน)
                  </label>
                  <input
                    type="number"
                    value={trainingDays}
                    onChange={(e) => setTrainingDays(e.target.value)}
                    placeholder="เช่น 5"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    เวลาเรียน
                  </label>
                  <input
                    type="text"
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  สถานที่ฝึกอบรม
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  คุณสมบัติผู้สมัคร
                </label>
                <textarea
                  rows={2}
                  value={qualifications}
                  onChange={(e) => setQualifications(e.target.value)}
                  placeholder="เช่น สัญชาติไทย อายุ 18 ปีขึ้นไป"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              {/* Required Documents Selector */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-800 block">
                  เลือกเอกสารที่ต้องการให้ผู้สมัครแนบ (ถ้าไม่เลือกจะไม่แสดง):
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-700">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={docIdCard}
                      onChange={(e) => setDocIdCard(e.target.checked)}
                      className="rounded text-sky-600 focus:ring-sky-500"
                    />
                    <span>เอกสารแนบ 1</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={docPhoto}
                      onChange={(e) => setDocPhoto(e.target.checked)}
                      className="rounded text-sky-600 focus:ring-sky-500"
                    />
                    <span>เอกสารแนบ 2</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={docEducation}
                      onChange={(e) => setDocEducation(e.target.checked)}
                      className="rounded text-sky-600 focus:ring-sky-500"
                    />
                    <span>สำเนาวุฒิการศึกษา</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={docOther}
                      onChange={(e) => setDocOther(e.target.checked)}
                      className="rounded text-sky-600 focus:ring-sky-500"
                    />
                    <span>เอกสารอื่นๆ</span>
                  </label>
                </div>

                {docOther && (
                  <input
                    type="text"
                    value={docOtherTitle}
                    onChange={(e) => setDocOtherTitle(e.target.value)}
                    placeholder="ระบุชื่อเอกสารอื่นๆ เช่น ใบรับรองแพทย์, ใบขับขี่"
                    className="w-full mt-2 px-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                )}
              </div>

              <div className="flex items-center gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition"
                >
                  {actionLoading ? 'กำลังบันทึก...' : 'บันทึกเปิดรับสมัคร'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
