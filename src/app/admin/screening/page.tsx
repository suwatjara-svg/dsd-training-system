'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  CheckCircle,
  XCircle,
  PhoneCall,
  Clock,
  ChevronLeft,
  ChevronRight,
  Star,
  FileText,
  AlertTriangle,
  User,
  ShieldAlert,
  Save,
  RotateCcw,
  Sparkles,
  Copy,
  Check,
} from 'lucide-react';
import { maskIdCard, formatFullIdCard, formatPhoneNumber, formatThaiDate } from '@/lib/utils';

export default function ScreeningPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [filterMode, setFilterMode] = useState<string>('ALL');

  const [loading, setLoading] = useState(false);
  const [screeningData, setScreeningData] = useState<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [copiedId, setCopiedId] = useState(false);

  // Form states for current applicant
  const [qualStatus, setQualStatus] = useState<string>('PENDING');
  const [disqualReason, setDisqualReason] = useState<string>('');
  const [contactStatus, setContactStatus] = useState<string>('NOT_CONTACTED');
  const [interestStatus, setInterestStatus] = useState<string>('UNKNOWN');
  const [callNotes, setCallNotes] = useState<string>('');
  const [actionLoading, setActionLoading] = useState(false);

  // Capacity Warning Modal state
  const [showOverrideModal, setShowOverrideModal] = useState(false);

  // 1. Fetch available courses
  useEffect(() => {
    fetch('/api/courses')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setCourses(data);
          const initialCourseId = searchParams.get('courseId') || data[0].id;
          setSelectedCourseId(initialCourseId);
        }
      });
  }, [searchParams]);

  // 2. Fetch screening queue
  const fetchQueue = useCallback(async (courseId: string, filter: string) => {
    if (!courseId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/screening/queue?courseId=${courseId}&filter=${filter}`);
      const data = await res.json();
      setScreeningData(data);
      setCurrentIndex(0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedCourseId) {
      fetchQueue(selectedCourseId, filterMode);
    }
  }, [selectedCourseId, filterMode, fetchQueue]);

  const currentApplicant = screeningData?.applicants?.[currentIndex];

  // Sync state when applicant changes
  useEffect(() => {
    if (currentApplicant) {
      setQualStatus(currentApplicant.screening?.qualificationStatus || 'PENDING');
      setDisqualReason(currentApplicant.screening?.disqualifiedReason || '');

      const lastCall = currentApplicant.contacts?.[0];
      setContactStatus(lastCall?.contactStatus || 'NOT_CONTACTED');
      setInterestStatus(lastCall?.interestStatus || 'UNKNOWN');
      setCallNotes(lastCall?.notes || '');
    }
  }, [currentApplicant]);

  // Navigation handlers
  const handleNext = () => {
    if (screeningData?.applicants && currentIndex < screeningData.applicants.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  // Keyboard Shortcuts (N=Next, P=Prev, Y=Qualify, S=Select, W=Waitlist)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.key === 'n' || e.key === 'N') {
        handleNext();
      } else if (e.key === 'p' || e.key === 'P') {
        handlePrev();
      } else if (e.key === 'y' || e.key === 'Y') {
        handleSaveQualification('QUALIFIED');
      } else if (e.key === 's' || e.key === 'S') {
        handleSelection('SELECTED');
      } else if (e.key === 'w' || e.key === 'W') {
        handleSelection('WAITLIST');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, screeningData, currentApplicant]);

  // Actions
  const handleSaveQualification = async (status: string) => {
    if (!currentApplicant) return;
    const targetStatus = qualStatus === status ? 'PENDING' : status;
    setActionLoading(true);
    setQualStatus(targetStatus);

    // Optimistically update current applicant in memory
    if (screeningData?.applicants) {
      const updatedList = [...screeningData.applicants];
      if (updatedList[currentIndex]) {
        updatedList[currentIndex] = {
          ...updatedList[currentIndex],
          qualificationStatus: targetStatus,
          screening: {
            ...updatedList[currentIndex].screening,
            qualificationStatus: targetStatus,
            disqualifiedReason: targetStatus === 'NOT_QUALIFIED' ? (disqualReason || 'คุณสมบัติไม่ตรงตามประกาศ') : '',
          },
        };
        setScreeningData((prev: any) => ({
          ...prev,
          applicants: updatedList,
        }));
      }
    }

    try {
      const res = await fetch('/api/screening/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: currentApplicant.id,
          qualificationStatus: targetStatus,
          disqualifiedReason: targetStatus === 'NOT_QUALIFIED' ? (disqualReason || 'คุณสมบัติไม่ตรงตามประกาศ') : null,
        }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'บันทึกคุณสมบัติไม่สำเร็จ');
      }
      await fetchQueue(selectedCourseId, filterMode);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'เกิดข้อผิดพลาดในการบันทึกคุณสมบัติ');
      setQualStatus(currentApplicant.screening?.qualificationStatus || 'PENDING');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveCall = async () => {
    if (!currentApplicant) return;
    setActionLoading(true);
    try {
      await fetch('/api/screening/call-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: currentApplicant.id,
          contactStatus,
          interestStatus,
          notes: callNotes,
        }),
      });
      fetchQueue(selectedCourseId, filterMode);
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSelection = async (status: string, forceOverride = false) => {
    if (!currentApplicant) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/screening/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: currentApplicant.id,
          selectionStatus: status,
          remarks: callNotes,
          forceOverride,
        }),
      });

      const data = await res.json();
      if (!res.ok && data.error === 'CAPACITY_REACHED') {
        setShowOverrideModal(true);
        return;
      }

      setShowOverrideModal(false);
      await fetchQueue(selectedCourseId, filterMode);
      // Auto advance to next person
      handleNext();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const stats = screeningData?.stats;
  const isSelected = currentApplicant?.selection?.selectionStatus === 'SELECTED';
  const isWaitlist = currentApplicant?.selection?.selectionStatus === 'WAITLIST';

  return (
    <div className="space-y-6">
      {/* Top Header & Course Selector */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
            <span>คัดเลือกผู้สมัครทีละราย (Applicant Screening Mode)</span>
            <span className="px-2 py-0.5 rounded text-xs bg-sky-100 text-sky-800 font-semibold">
              Quick Decision
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            ตรวจคุณสมบัติ โทรสอบถามความพร้อม บันทึก และคัดเลือกตัวจริง/สำรองได้รวดเร็ว
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
          >
            <ChevronLeft className="w-4 h-4" />
            กลับหน้ารวมหลักสูตร
          </Link>
          {courses.find((c) => c.id === selectedCourseId) && (
            <div className="px-3.5 py-2 rounded-xl bg-sky-50 border border-sky-200 text-xs font-bold text-sky-900 max-w-md truncate">
              {(() => {
                const t = courses.find((c) => c.id === selectedCourseId)?.title || '';
                return t.startsWith('หลักสูตร') ? t : `หลักสูตร: ${t}`;
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Real-time Capacity & Live Stats Counter */}
      {stats && (
        <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-md flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-[11px] text-slate-400 font-medium">ความจุหลักสูตร (Capacity)</p>
              <p className="text-2xl font-bold text-white">{stats.capacity} คน</p>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div>
              <p className="text-[11px] text-slate-400 font-medium">คัดเลือกแล้ว (Selected)</p>
              <p className={`text-2xl font-bold ${stats.selectedCount >= stats.capacity ? 'text-emerald-400' : 'text-amber-400'}`}>
                {stats.selectedCount} / {stats.capacity} คน
              </p>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div>
              <p className="text-[11px] text-slate-400 font-medium">ผู้สมัครสำรอง (Waitlist)</p>
              <p className="text-2xl font-bold text-sky-400">{stats.waitlistCount} คน</p>
            </div>
          </div>

          {stats.selectedCount >= stats.capacity ? (
            <div className="px-4 py-2 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>🟢 คัดเลือกครบตามจำนวน {stats.capacity} คนแล้ว (สามารถจัดเป็นผู้สมัครสำรองได้)</span>
            </div>
          ) : (
            <div className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold">
              ต้องการคัดเลือกอีก <strong className="text-amber-400">{stats.remainingSlots}</strong> คน
            </div>
          )}
        </div>
      )}

      {/* Filter Tabs & Shortcuts Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5 bg-slate-200/70 p-1 rounded-xl text-xs font-semibold">
          {[
            { id: 'ALL', label: 'ทั้งหมด' },
            { id: 'PENDING_QUAL', label: '⏳ รอตรวจคุณสมบัติ' },
            { id: 'QUALIFIED_UNCONTACTED', label: '📞 ผ่านแล้ว (ยังไม่โทร)' },
            { id: 'INTERESTED_UNSELECTED', label: '⭐ ต้องการเรียน (รอคัด)' },
            { id: 'SELECTED', label: '✅ คัดเลือกแล้ว' },
            { id: 'WAITLIST', label: '📋 สำรอง' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterMode(tab.id)}
              className={`px-3 py-1.5 rounded-lg transition ${
                filterMode === tab.id
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-2 text-[11px] text-slate-500 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
          <Sparkles className="w-3.5 h-3.5 text-sky-600" />
          <span>คีย์ลัด: <strong>N</strong>=ถัดไป, <strong>P</strong>=ก่อนหน้า, <strong>Y</strong>=ผ่านคุณสมบัติ, <strong>S</strong>=คัดเลือก, <strong>W</strong>=สำรอง</span>
        </div>
      </div>

      {/* Main Single Applicant Screening Interface */}
      {loading ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-slate-200">
          <span className="inline-block w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin"></span>
          <p className="text-sm font-semibold text-slate-600 mt-3">กำลังโหลดข้อมูลผู้สมัคร...</p>
        </div>
      ) : !currentApplicant ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-slate-200">
          <User className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-700">ไม่พบผู้สมัครตามเงื่อนไขที่เลือก</h3>
          <p className="text-xs text-slate-400 mt-1">ลองเปลี่ยนตัวกรอง หรือตรวจสอบหลักสูตรอื่น</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel: Profile, Documents & Dynamic Answers (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-5">
              {/* Stepper / Progress Bar */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-lg bg-sky-50 text-sky-700 font-mono font-bold text-sm border border-sky-200">
                    {currentApplicant.applicationNumber}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    ลำดับที่ {currentIndex + 1} จาก {screeningData?.applicants?.length} คน
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-bold text-xs disabled:opacity-30 disabled:pointer-events-none shadow-xs transition cursor-pointer"
                    title="คนก่อนหน้า (P)"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>ย้อนกลับ</span>
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={currentIndex >= (screeningData?.applicants?.length || 1) - 1}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-sky-600 bg-sky-50 text-sky-800 hover:bg-sky-100 font-bold text-xs disabled:opacity-30 disabled:pointer-events-none shadow-xs transition cursor-pointer"
                    title="คนถัดไป (N)"
                  >
                    <span>ถัดไป</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Personal Info Grid */}
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  {currentApplicant.firstName} {currentApplicant.lastName}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  ยื่นใบสมัครเมื่อ {formatThaiDate(currentApplicant.submittedAt, true)}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 mt-4 text-xs">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-slate-400 block font-medium">เลขประจำตัวประชาชน</span>
                      <button
                        type="button"
                        onClick={() => {
                          const raw = (currentApplicant.idCardNumber || '').replace(/\D/g, '');
                          navigator.clipboard.writeText(raw);
                          setCopiedId(true);
                          setTimeout(() => setCopiedId(false), 2000);
                        }}
                        className="text-[11px] font-bold text-sky-700 hover:text-sky-900 flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs hover:bg-sky-50 transition cursor-pointer"
                        title="คลิกเพื่อคัดลอกเลข 13 หลักไปค้นหาในระบบอื่น"
                      >
                        {copiedId ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedId ? 'คัดลอกแล้ว!' : 'คัดลอก'}</span>
                      </button>
                    </div>
                    <strong className="text-slate-800 text-sm font-mono font-bold block tracking-wider">
                      {formatFullIdCard(currentApplicant.idCardNumber)}
                    </strong>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block font-medium">เบอร์โทรศัพท์</span>
                    <strong className="text-sky-700 text-sm font-bold mt-0.5 block">
                      {formatPhoneNumber(currentApplicant.phoneNumber)}
                    </strong>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block font-medium">อายุ</span>
                    <strong className="text-slate-700 text-sm mt-0.5 block">
                      {currentApplicant.age ? `${currentApplicant.age} ปี` : '-'}
                    </strong>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block font-medium">อาชีพปัจจุบัน</span>
                    <strong className="text-slate-700 text-sm mt-0.5 block truncate">
                      {currentApplicant.occupation || '-'}
                    </strong>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 sm:col-span-2">
                    <span className="text-slate-400 block font-medium">ระดับการศึกษา</span>
                    <strong className="text-slate-700 text-sm mt-0.5 block truncate">
                      {currentApplicant.educationLevel || '-'}
                    </strong>
                  </div>
                </div>

                <div className="mt-3 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                  <span className="text-slate-400 font-medium">ที่อยู่ติดต่อ:</span>
                  <p className="text-slate-700 mt-0.5">{currentApplicant.address || '-'}</p>
                </div>
              </div>

              {/* Dynamic Course Form Answers */}
              {currentApplicant.answers && currentApplicant.answers.length > 0 && (
                <div className="border-t border-slate-100 pt-4 space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    คำตอบในแบบฟอร์มเฉพาะหลักสูตร
                  </h4>
                  <div className="space-y-2">
                    {currentApplicant.answers.map((ans: any) => (
                      <div key={ans.id} className="bg-sky-50/50 p-3 rounded-xl border border-sky-100 text-xs">
                        <span className="text-sky-900 font-semibold block">{ans.question?.label || 'คำถาม'}</span>
                        <p className="text-slate-700 mt-1 font-medium">{ans.answerValue}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Uploaded Documents Review */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  เอกสารประกอบการสมัคร
                </h4>
                {currentApplicant.documents && currentApplicant.documents.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {currentApplicant.documents.map((doc: any) => {
                      const isDriveUrl = doc.fileUrl && doc.fileUrl.startsWith('http');
                      return (
                        <div
                          key={doc.id}
                          className="p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs hover:border-sky-300 bg-slate-50/50 transition gap-2"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="w-4 h-4 text-sky-600 flex-shrink-0" />
                            <div className="min-w-0 truncate">
                              <p className="font-semibold text-slate-800 truncate">{doc.documentTitle}</p>
                              <span className="text-[10px] text-emerald-600 font-medium block">
                                {doc.fileName || 'เอกสารแนบ'}
                              </span>
                            </div>
                          </div>
                          {isDriveUrl ? (
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs transition flex-shrink-0"
                            >
                              เปิดดู
                            </a>
                          ) : (
                            <span
                              className="px-2 py-1 rounded bg-amber-50 text-amber-700 text-[10px] font-medium border border-amber-200 flex-shrink-0 text-center"
                              title="ไฟล์อยู่ใน /tmp หรือยังไม่ได้เปิด Google Drive API ใน Google Cloud"
                            >
                              เปิดดูไม่ได้
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">ไม่มีเอกสารแนบ</p>
                )}
              </div>

              {/* Bottom Navigation Toolbar for Left Panel */}
              <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
                <button
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-bold text-xs disabled:opacity-30 disabled:pointer-events-none shadow-xs transition cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>ย้อนกลับ (คนก่อนหน้า)</span>
                </button>
                <span className="text-xs font-semibold text-slate-500">
                  คนลำดับที่ {currentIndex + 1} จาก {screeningData?.applicants?.length} คน
                </span>
                <button
                  onClick={handleNext}
                  disabled={currentIndex >= (screeningData?.applicants?.length || 1) - 1}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-sky-600 bg-sky-50 text-sky-800 hover:bg-sky-100 font-bold text-xs disabled:opacity-30 disabled:pointer-events-none shadow-xs transition cursor-pointer"
                >
                  <span>ถัดไป (คนต่อไป)</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel: Decision & Workflow Panel (5 Cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* 1. Qualification Evaluation Card */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span>1. ตรวจสอบคุณสมบัติ</span>
                </h3>
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  qualStatus === 'QUALIFIED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : qualStatus === 'NOT_QUALIFIED'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {qualStatus === 'QUALIFIED' ? 'ผ่านคุณสมบัติ' : qualStatus === 'NOT_QUALIFIED' ? 'ไม่ผ่าน' : 'รอตรวจสอบ'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveQualification('QUALIFIED')}
                  disabled={actionLoading}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition border cursor-pointer ${
                    qualStatus === 'QUALIFIED'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-300'
                      : 'bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50'
                  } disabled:opacity-50`}
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>ผ่านคุณสมบัติ (Y)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveQualification('NOT_QUALIFIED')}
                  disabled={actionLoading}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition border cursor-pointer ${
                    qualStatus === 'NOT_QUALIFIED'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-md ring-2 ring-rose-300'
                      : 'bg-white text-rose-700 border-rose-300 hover:bg-rose-50'
                  } disabled:opacity-50`}
                >
                  <XCircle className="w-4 h-4" />
                  <span>ไม่ผ่านคุณสมบัติ</span>
                </button>
              </div>

              {qualStatus === 'NOT_QUALIFIED' && (
                <div className="space-y-2 pt-1">
                  <label className="text-[11px] font-semibold text-slate-600">ระบุเหตุผลที่ไม่ผ่าน:</label>
                  <input
                    type="text"
                    value={disqualReason}
                    onChange={(e) => setDisqualReason(e.target.value)}
                    placeholder="เช่น คุณสมบัติไม่ตรงตามประกาศ, เอกสารไม่ครบ"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* 2. Call & Contact Tracking Card */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-sky-600" />
                <span>2. โทรติดต่อ & สอบถามความต้องการ</span>
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">ผลการโทร:</label>
                  <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                    {[
                      { id: 'CONTACTED', label: 'ติดต่อได้' },
                      { id: 'NO_ANSWER', label: 'ไม่รับสาย' },
                      { id: 'CALL_BACK', label: 'โทรกลับภายหลัง' },
                      { id: 'NOT_CONTACTED', label: 'ยังไม่ได้โทร' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setContactStatus(opt.id)}
                        className={`py-2 px-2.5 rounded-lg border text-center transition ${
                          contactStatus === opt.id
                            ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {contactStatus === 'CONTACTED' && (
                  <div className="pt-2 border-t border-slate-100">
                    <label className="text-[11px] font-bold text-slate-800 block mb-1">
                      ผู้สมัครยังต้องการเข้าฝึกอบรมหรือไม่?
                    </label>
                    <div className="grid grid-cols-3 gap-2 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setInterestStatus('INTERESTED')}
                        className={`py-2 px-1 rounded-lg border text-center transition ${
                          interestStatus === 'INTERESTED'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50'
                        }`}
                      >
                        🟢 ต้องการเรียน
                      </button>
                      <button
                        type="button"
                        onClick={() => setInterestStatus('NOT_INTERESTED')}
                        className={`py-2 px-1 rounded-lg border text-center transition ${
                          interestStatus === 'NOT_INTERESTED'
                            ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                            : 'bg-white text-rose-700 border-rose-300 hover:bg-rose-50'
                        }`}
                      >
                        🔴 สละสิทธิ์
                      </button>
                      <button
                        type="button"
                        onClick={() => setInterestStatus('UNDECIDED')}
                        className={`py-2 px-1 rounded-lg border text-center transition ${
                          interestStatus === 'UNDECIDED'
                            ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                            : 'bg-white text-amber-700 border-amber-300 hover:bg-amber-50'
                        }`}
                      >
                        🟡 ขอคิดดู
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">บันทึกผลการโทร:</label>
                  <textarea
                    rows={2}
                    value={callNotes}
                    onChange={(e) => setCallNotes(e.target.value)}
                    placeholder="เช่น ยืนยันเข้าอบรมครบ 5 วัน, ติดธุระเสาร์-อาทิตย์"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <button
                  onClick={handleSaveCall}
                  className="w-full py-2 rounded-xl bg-slate-800 text-white text-xs font-semibold hover:bg-slate-700 transition"
                >
                  บันทึกประวัติการโทร (Save Call Log)
                </button>
              </div>
            </div>

            {/* 3. Final Selection & Capacity Decision */}
            <div className="bg-gradient-to-br from-white to-sky-50/50 rounded-2xl p-5 border-2 border-sky-300 shadow-md space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span>3. ตัดสินคัดเลือก (Selection Decision)</span>
                </h3>

                {isSelected ? (
                  <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-600 text-white shadow-sm">
                    ⭐ คัดเลือกแล้ว
                  </span>
                ) : isWaitlist ? (
                  <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-amber-500 text-white shadow-sm">
                    สำรองลำดับที่ {currentApplicant.selection?.waitlistOrder}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-200 text-slate-700">
                    ยังไม่คัดเลือก
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => handleSelection('SELECTED')}
                  disabled={actionLoading}
                  className="w-full py-3 px-4 rounded-xl text-sm font-extrabold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md active:scale-[0.99] transition flex items-center justify-center gap-2"
                >
                  <Star className="w-4 h-4 fill-white" />
                  <span>⭐ คัดเลือกเป็นผู้เข้าฝึกอบรม (S)</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleSelection('WAITLIST')}
                    disabled={actionLoading}
                    className="py-2.5 px-3 rounded-xl text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 transition flex items-center justify-center gap-1.5"
                  >
                    <Clock className="w-4 h-4 text-amber-700" />
                    <span>จัดเป็นผู้สมัครสำรอง (W)</span>
                  </button>

                  <button
                    onClick={() => handleSelection('REJECTED')}
                    disabled={actionLoading}
                    className="py-2.5 px-3 rounded-xl text-xs font-bold text-rose-900 bg-rose-100 hover:bg-rose-200 border border-rose-300 transition flex items-center justify-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4 text-rose-700" />
                    <span>ไม่ผ่านการคัดเลือก</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Prev / Next Navigation */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="py-3 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>ย้อนกลับ (คนก่อนหน้า)</span>
              </button>

              <button
                onClick={handleNext}
                disabled={currentIndex >= (screeningData?.applicants?.length || 1) - 1}
                className="py-3 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition disabled:opacity-40 disabled:hover:bg-slate-900"
              >
                <span>ไปคนถัดไป</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Capacity Override Modal */}
      {showOverrideModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <AlertTriangle className="w-8 h-8 flex-shrink-0" />
              <div>
                <h3 className="text-base font-bold text-slate-800">คัดเลือกครบจำนวนที่รับแล้ว!</h3>
                <p className="text-xs text-slate-500">
                  หลักสูตรนี้รับผู้เข้าอบรมครบ {stats?.capacity} คนแล้ว
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
              คุณต้องการคัดเลือกผู้สมัครรายนี้ <strong>เกินโควต้าเป็นกรณีพิเศษ</strong> หรือต้องการเปลี่ยนเป็น <strong>ผู้สมัครสำรอง</strong> หรือไม่?
            </p>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => handleSelection('WAITLIST')}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm transition"
              >
                จัดเป็นผู้สมัครสำรอง (แนะนำ)
              </button>

              <button
                onClick={() => handleSelection('SELECTED', true)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs transition"
              >
                ยืนยันคัดเลือกเพิ่มเป็นกรณีพิเศษ (Override Capacity)
              </button>

              <button
                onClick={() => setShowOverrideModal(false)}
                className="w-full py-2 rounded-xl text-slate-500 hover:text-slate-700 text-xs font-semibold"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
