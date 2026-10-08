'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Phone,
  FileSpreadsheet,
} from 'lucide-react';
import { maskIdCard, formatPhoneNumber, formatThaiDate } from '@/lib/utils';

export default function ApplicantsListPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [search, setSearch] = useState('');
  const [qualFilter, setQualFilter] = useState('');
  const [contactFilter, setContactFilter] = useState('');
  const [selectionFilter, setSelectionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/courses')
      .then((res) => res.json())
      .then((res) => {
        if (Array.isArray(res) && res.length > 0) {
          setCourses(res);
          setSelectedCourseId(res[0].id);
        }
      });
  }, []);

  const loadApplicants = async () => {
    if (!selectedCourseId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        courseId: selectedCourseId,
        page: page.toString(),
        limit: '15',
        search,
      });
      if (qualFilter) params.set('qualStatus', qualFilter);
      if (contactFilter) params.set('contactStatus', contactFilter);
      if (selectionFilter) params.set('selectionStatus', selectionFilter);

      const res = await fetch(`/api/applicants?${params.toString()}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplicants();
  }, [selectedCourseId, page, qualFilter, contactFilter, selectionFilter]);

  const handleExport = (type: string) => {
    window.open(`/api/export?courseId=${selectedCourseId}&type=${type}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">รายชื่อผู้สมัครเข้ารับการฝึกอบรม</h1>
          <p className="text-xs text-slate-500 mt-1">
            ค้นหา กรองสถานะ และส่งออกรายชื่อผู้สมัครเป็นไฟล์ Excel
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedCourseId}
            onChange={(e) => {
              setSelectedCourseId(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>

          <button
            onClick={() => handleExport('ALL')}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
        <div className="md:col-span-2 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadApplicants()}
            placeholder="ค้นหาชื่อ, เลขใบสมัคร, บัตร ปชช., เบอร์โทร"
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
          />
        </div>

        <select
          value={qualFilter}
          onChange={(e) => { setQualFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
        >
          <option value="">ทุกสถานะคุณสมบัติ</option>
          <option value="QUALIFIED">ผ่านคุณสมบัติ</option>
          <option value="NOT_QUALIFIED">ไม่ผ่านคุณสมบัติ</option>
          <option value="PENDING">รอตรวจสอบ</option>
        </select>

        <select
          value={contactFilter}
          onChange={(e) => { setContactFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
        >
          <option value="">ทุกสถานะการโทร</option>
          <option value="CONTACTED">ติดต่อได้</option>
          <option value="NO_ANSWER">ไม่รับสาย</option>
          <option value="NOT_CONTACTED">ยังไม่ได้โทร</option>
        </select>

        <select
          value={selectionFilter}
          onChange={(e) => { setSelectionFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
        >
          <option value="">ทุกสถานะคัดเลือก</option>
          <option value="SELECTED">คัดเลือกแล้ว</option>
          <option value="WAITLIST">ผู้สมัครสำรอง</option>
          <option value="PENDING">รอดำเนินการ</option>
          <option value="REJECTED">ไม่ผ่าน</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <th className="py-3 px-4">เลขที่ใบสมัคร</th>
                <th className="py-3 px-4">ชื่อ-นามสกุล</th>
                <th className="py-3 px-4">เลขบัตร ปชช. (Masked)</th>
                <th className="py-3 px-4">เบอร์โทรศัพท์</th>
                <th className="py-3 px-4 text-center">คุณสมบัติ</th>
                <th className="py-3 px-4 text-center">การติดต่อ</th>
                <th className="py-3 px-4 text-center">ความต้องการ</th>
                <th className="py-3 px-4 text-center">ผลคัดเลือก</th>
                <th className="py-3 px-4 text-right">การกระทำ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    กำลังโหลดข้อมูล...
                  </td>
                </tr>
              ) : !data?.applicants || data.applicants.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    ไม่พบข้อมูลผู้สมัคร
                  </td>
                </tr>
              ) : (
                data.applicants.map((app: any) => {
                  const lastCall = app.contacts?.[0];
                  return (
                    <tr key={app.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-mono font-bold text-sky-800">
                        {app.applicationNumber}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {app.firstName} {app.lastName}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {maskIdCard(app.idCardNumber)}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {formatPhoneNumber(app.phoneNumber)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          app.screening?.qualificationStatus === 'QUALIFIED'
                            ? 'bg-emerald-50 text-emerald-700'
                            : app.screening?.qualificationStatus === 'NOT_QUALIFIED'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {app.screening?.qualificationStatus === 'QUALIFIED' ? 'ผ่าน' : app.screening?.qualificationStatus === 'NOT_QUALIFIED' ? 'ไม่ผ่าน' : 'รอตรวจ'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-[11px] font-medium text-slate-600">
                          {lastCall?.contactStatus === 'CONTACTED' ? 'ติดต่อได้' : lastCall?.contactStatus === 'NO_ANSWER' ? 'ไม่รับสาย' : 'ยังไม่โทร'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          lastCall?.interestStatus === 'INTERESTED'
                            ? 'bg-indigo-50 text-indigo-700'
                            : lastCall?.interestStatus === 'NOT_INTERESTED'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {lastCall?.interestStatus === 'INTERESTED' ? 'ต้องการเรียน' : lastCall?.interestStatus === 'NOT_INTERESTED' ? 'สละสิทธิ์' : '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          app.selection?.selectionStatus === 'SELECTED'
                            ? 'bg-emerald-600 text-white'
                            : app.selection?.selectionStatus === 'WAITLIST'
                            ? 'bg-amber-100 text-amber-800'
                            : app.selection?.selectionStatus === 'REJECTED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {app.selection?.selectionStatus === 'SELECTED' ? 'คัดเลือกแล้ว' : app.selection?.selectionStatus === 'WAITLIST' ? `สำรอง (#${app.selection?.waitlistOrder})` : app.selection?.selectionStatus === 'REJECTED' ? 'ไม่ผ่าน' : 'รอดำเนินการ'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/admin/screening?courseId=${selectedCourseId}`}
                          className="px-2.5 py-1 rounded bg-sky-50 hover:bg-sky-100 text-sky-700 font-semibold"
                        >
                          ตรวจ/คัดเลือก
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div>
              ผู้สมัครทั้งหมด <strong>{data.total}</strong> คน (หน้า {data.page} / {data.totalPages || 1})
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
