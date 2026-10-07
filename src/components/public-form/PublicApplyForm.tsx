'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle,
  AlertCircle,
  Upload,
  ShieldCheck,
  Send,
  FileCheck,
} from 'lucide-react';

export default function PublicApplyForm({ course, form }: { course: any; form: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successAppNum, setSuccessAppNum] = useState<string | null>(null);

  // Core fields
  const [formData, setFormData] = useState({
    idCardNumber: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
    age: '',
    occupation: '',
    educationLevel: 'มัธยมศึกษาตอนปลาย (ม.6)',
    address: '',
    pdpaConsent: false,
  });

  // Dynamic answers state
  const [answers, setAnswers] = useState<Record<string, any>>({});
  // Uploaded files map: { [docTitle]: File }
  const [files, setFiles] = useState<Record<string, File>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleDynamicChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleFileChange = (docTitle: string, file: File | null) => {
    if (file) {
      setFiles((prev) => ({ ...prev, [docTitle]: file }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.pdpaConsent) {
      setError('กรุณายินยอมเงื่อนไขการประมวลผลข้อมูลส่วนบุคคล (PDPA)');
      return;
    }

    // Clean Thai ID Card format
    const cleanId = formData.idCardNumber.replace(/\D/g, '');
    if (cleanId.length !== 13) {
      setError('เลขประจำตัวประชาชนต้องครบถ้วน 13 หลัก');
      return;
    }

    setLoading(true);

    try {
      const payload = new FormData();
      payload.append('idCardNumber', cleanId);
      payload.append('firstName', formData.firstName);
      payload.append('lastName', formData.lastName);
      payload.append('phoneNumber', formData.phoneNumber);
      payload.append('email', formData.email);
      payload.append('age', formData.age);
      payload.append('occupation', formData.occupation);
      payload.append('educationLevel', formData.educationLevel);
      payload.append('address', formData.address);

      // Append dynamic answers
      Object.entries(answers).forEach(([qId, val]) => {
        payload.append(`q_${qId}`, String(val));
      });

      // Append files
      Object.entries(files).forEach(([docTitle, file]) => {
        payload.append('documents', file);
        payload.append('docTitles', docTitle);
      });

      const res = await fetch(`/api/apply/${course.id}`, {
        method: 'POST',
        body: payload,
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'ยื่นใบสมัครไม่สำเร็จ');
      }

      setSuccessAppNum(json.applicationNumber);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (successAppNum) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-slate-200/90 shadow-md text-center space-y-5">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
          <CheckCircle className="w-10 h-10" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">ยื่นใบสมัครสำเร็จเรียบร้อยแล้ว</h2>
          <p className="text-xs text-slate-500 mt-1">
            ระบบได้บันทึกข้อมูลและส่งเข้าสู่ขั้นตอนการตรวจคุณสมบัติเรียบร้อยแล้ว
          </p>
        </div>

        <div className="bg-sky-50 border border-sky-200 p-5 rounded-2xl max-w-sm mx-auto">
          <span className="text-xs text-sky-800 font-semibold block">เลขที่ใบสมัครของคุณ (Application No.)</span>
          <p className="text-2xl font-mono font-extrabold text-sky-900 mt-1">{successAppNum}</p>
          <span className="text-[11px] text-sky-600 mt-1 block">
            กรุณาแคปหน้าจอหรือจดบันทึกเลขที่ใบสมัครไว้เป็นหลักฐาน
          </span>
        </div>

        <div className="pt-4">
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition"
          >
            กลับหน้ารายการหลักสูตร
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Part 1: Personal Info */}
      <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200/90 shadow-sm space-y-5">
        <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
          <span>ส่วนที่ 1: ข้อมูลส่วนตัวของผู้สมัคร</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              เลขประจำตัวประชาชน (13 หลัก) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="idCardNumber"
              required
              maxLength={13}
              value={formData.idCardNumber}
              onChange={handleInputChange}
              placeholder="1100400123456"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              เบอร์โทรศัพท์ที่ติดต่อได้สะดวก <span className="text-rose-500">*</span>
            </label>
            <input
              type="tel"
              name="phoneNumber"
              required
              value={formData.phoneNumber}
              onChange={handleInputChange}
              placeholder="0812345678"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ชื่อ <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="firstName"
              required
              value={formData.firstName}
              onChange={handleInputChange}
              placeholder="สมชาย"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              นามสกุล <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="lastName"
              required
              value={formData.lastName}
              onChange={handleInputChange}
              placeholder="ใจดี"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              อายุ (ปี)
            </label>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleInputChange}
              placeholder="25"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              อีเมล (Email)
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="applicant@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              อาชีพปัจจุบัน
            </label>
            <input
              type="text"
              name="occupation"
              value={formData.occupation}
              onChange={handleInputChange}
              placeholder="เช่น รับจ้าง, ค้าขาย, พนักงานบริษัท"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ระดับการศึกษาสูงสุด
            </label>
            <select
              name="educationLevel"
              value={formData.educationLevel}
              onChange={handleInputChange}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
            >
              <option value="ไม่ได้เรียน">ไม่ได้เรียน</option>
              <option value="ประถมศึกษาปีที่ 4">ประถมศึกษาปีที่ 4</option>
              <option value="ประถมศึกษาปีที่ 6">ประถมศึกษาปีที่ 6</option>
              <option value="มัธยมศึกษาตอนต้น (ม.3)">มัธยมศึกษาตอนต้น (ม.3)</option>
              <option value="มัธยมศึกษาตอนปลาย (ม.6)">มัธยมศึกษาตอนปลาย (ม.6)</option>
              <option value="ปวช.">ปวช.</option>
              <option value="ปวส.">ปวส.</option>
              <option value="ปริญญาตรี">ปริญญาตรี</option>
              <option value="สูงกว่าปริญญาตรี">สูงกว่าปริญญาตรี</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ที่อยู่ปัจจุบัน
            </label>
            <textarea
              name="address"
              rows={2}
              value={formData.address}
              onChange={handleInputChange}
              placeholder="ที่อยู่ตามบัตรประชาชน หรือที่พักอาศัยปัจจุบัน"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Part 2: Dynamic Questions from Form Builder */}
      {form && form.sections && form.sections.length > 0 && (
        <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200/90 shadow-sm space-y-6">
          {form.sections.map((section: any) => (
            <div key={section.id} className="space-y-4">
              <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-2">
                {section.title}
              </h3>
              <div className="space-y-4">
                {section.questions.map((q: any) => {
                  let options: string[] = [];
                  if (q.optionsJson) {
                    try {
                      options = JSON.parse(q.optionsJson);
                    } catch {}
                  }

                  return (
                    <div key={q.id}>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {q.label} {q.isRequired && <span className="text-rose-500">*</span>}
                      </label>

                      {q.questionType === 'RADIO' ? (
                        <div className="space-y-2 pt-1">
                          {options.map((opt, i) => (
                            <label key={i} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                              <input
                                type="radio"
                                name={`q_${q.id}`}
                                required={q.isRequired}
                                checked={answers[q.id] === opt}
                                onChange={() => handleDynamicChange(q.id, opt)}
                                className="text-sky-600 focus:ring-sky-500"
                              />
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>
                      ) : q.questionType === 'DROPDOWN' ? (
                        <select
                          required={q.isRequired}
                          value={answers[q.id] || ''}
                          onChange={(e) => handleDynamicChange(q.id, e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                        >
                          <option value="">-- กรุณาเลือก --</option>
                          {options.map((opt, i) => (
                            <option key={i} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : q.questionType === 'LONG_TEXT' ? (
                        <textarea
                          rows={3}
                          required={q.isRequired}
                          value={answers[q.id] || ''}
                          onChange={(e) => handleDynamicChange(q.id, e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                        />
                      ) : (
                        <input
                          type="text"
                          required={q.isRequired}
                          value={answers[q.id] || ''}
                          onChange={(e) => handleDynamicChange(q.id, e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Part 3: Documents Upload */}
      {course.requiredDocuments && course.requiredDocuments.length > 0 && (
        <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200/90 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Upload className="w-4 h-4 text-sky-600" />
            <span>ส่วนที่ 3: แนบเอกสารประกอบการสมัคร</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {course.requiredDocuments.map((doc: any) => (
              <div key={doc.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <span className="text-xs font-bold text-slate-800 block">
                  {doc.title} {doc.isRequired && <span className="text-rose-500">*</span>}
                </span>
                <input
                  type="file"
                  required={doc.isRequired}
                  onChange={(e) => handleFileChange(doc.title, e.target.files?.[0] || null)}
                  className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 cursor-pointer"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Part 4: PDPA & Submission */}
      <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200/90 shadow-sm space-y-4">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2">
          <div className="flex items-center gap-2 text-slate-800 font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>การคุ้มครองข้อมูลส่วนบุคคล (PDPA Notice & Consent)</span>
          </div>
          <p className="leading-relaxed">
            ข้าพเจ้ายินยอมให้หน่วยงานจัดเก็บ รวบรวม และประมวลผลข้อมูลส่วนบุคคลข้างต้น เพื่อประโยชน์ในการคัดเลือก ติดต่อประสานงาน และบริหารจัดการการฝึกอบรมตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562
          </p>
          <label className="flex items-center gap-2 pt-2 cursor-pointer font-bold text-slate-800">
            <input
              type="checkbox"
              name="pdpaConsent"
              checked={formData.pdpaConsent}
              onChange={handleInputChange}
              className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500"
            />
            <span>ข้าพเจ้าได้อ่าน เข้าใจ และยินยอมตามเงื่อนไขข้างต้น</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 px-6 rounded-xl font-extrabold text-sm text-white bg-sky-600 hover:bg-sky-700 shadow-md hover:shadow-lg active:scale-[0.99] transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>ยืนยันการสมัครเข้ารับการฝึกอบรม (Submit Application)</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
