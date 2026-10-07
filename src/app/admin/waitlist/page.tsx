'use client';

import React, { useState, useEffect } from 'react';
import { Clock, ArrowUpCircle, CheckCircle2, AlertCircle } from 'lucide-react';
import { maskIdCard, formatPhoneNumber } from '@/lib/utils';

export default function WaitlistManagementPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [waitlistData, setWaitlistData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [promotingId, setPromotingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

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

  const loadWaitlist = async () => {
    if (!selectedCourseId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/screening/queue?courseId=${selectedCourseId}&filter=WAITLIST`);
      const data = await res.json();
      setWaitlistData(data.applicants || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWaitlist();
  }, [selectedCourseId]);

  const handlePromote = async (appId?: string) => {
    if (!confirm('ยืนยันเลื่อนผู้สมัครสำรองขึ้นเป็นผู้ผ่านการคัดเลือกตัวจริง?')) return;
    setPromotingId(appId || 'first');
    setMessage('');

    try {
      const res = await fetch('/api/waitlist/promote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: selectedCourseId,
          applicationId: appId,
        }),
      });

      const json = await res.json();
      if (res.ok) {
        setMessage(json.message);
        loadWaitlist();
      } else {
        alert(json.error || 'เกิดข้อผิดพลาดในการเลื่อนสิทธิ์');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPromotingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            <span>จัดการผู้สมัครสำรอง (Waitlist Management)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            ในกรณีที่มีผู้สมัครตัวจริงสละสิทธิ์ สามารถกดเลื่อนลำดับสำรองขึ้นเป็นตัวจริงได้ทันที ระบบจะจัดเรียงคิวที่เหลืออัตโนมัติ
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                [{c.code}] {c.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}

      {/* Waitlist Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">
            ลำดับคิวสำรองปัจจุบัน ({waitlistData.length} คน)
          </h3>
          {waitlistData.length > 0 && (
            <button
              onClick={() => handlePromote()}
              disabled={!!promotingId}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5"
            >
              <ArrowUpCircle className="w-4 h-4" />
              <span>เลื่อนสำรองลำดับที่ 1 ขึ้นเป็นตัวจริง</span>
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <th className="py-3 px-4 text-center">ลำดับสำรอง</th>
                <th className="py-3 px-4">เลขที่ใบสมัคร</th>
                <th className="py-3 px-4">ชื่อ-นามสกุล</th>
                <th className="py-3 px-4">เบอร์โทรศัพท์</th>
                <th className="py-3 px-4">เลขบัตร ปชช.</th>
                <th className="py-3 px-4">ผลการติดต่อล่าสุด</th>
                <th className="py-3 px-4 text-right">คำสั่ง</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    กำลังโหลดข้อมูลสำรอง...
                  </td>
                </tr>
              ) : waitlistData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    ไม่มีผู้สมัครในคิวสำรองสำหรับหลักสูตรนี้
                  </td>
                </tr>
              ) : (
                waitlistData.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 text-center">
                      <span className="w-7 h-7 rounded-full inline-flex items-center justify-center bg-amber-100 text-amber-900 font-bold text-xs border border-amber-300">
                        {app.selection?.waitlistOrder || '-'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-sky-800">
                      {app.applicationNumber}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {app.firstName} {app.lastName}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {formatPhoneNumber(app.phoneNumber)}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {maskIdCard(app.idCardNumber)}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {app.contacts?.[0]?.notes || 'พร้อมเข้าฝึกอบรม'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handlePromote(app.id)}
                        disabled={promotingId === app.id}
                        className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-[11px] transition flex items-center gap-1 ml-auto"
                      >
                        <ArrowUpCircle className="w-3.5 h-3.5" />
                        <span>เลื่อนเป็นตัวจริง</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
