'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle,
  AlertCircle,
  Upload,
  ShieldCheck,
  Send,
} from 'lucide-react';

export default function PublicApplyForm({ course, form }: { course: any; form: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successAppNum, setSuccessAppNum] = useState<string | null>(null);

  // Core fields
  const [formData, setFormData] = useState({
    titlePrefix: 'นาย',
    customPrefix: '',
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
  const [fileError, setFileError] = useState<string>('');

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
    setFileError('');
    if (!file) {
      setFiles((prev) => {
        const next = { ...prev };
        delete next[docTitle];
        return next;
      });
      return;
    }

    // Check maximum file size (10 MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setFileError(`ไฟล์ "${file.name}" มีขนาดเกิน 10 MB กรุณาเลือกไฟล์ใหม่ที่มีขนาดไม่เกิน 10 MB`);
      return;
    }

    // Check supported file extension or MIME type
    const isAllowed =
      file.type.startsWith('image/') ||
      file.type === 'application/pdf' ||
      /\.(jpe?g|png|webp|heic|heif|pdf)$/i.test(file.name);

    if (!isAllowed) {
      setFileError(`ไฟล์ "${file.name}" ไม่ใช่ประเภทที่รองรับ กรุณาแนบไฟล์รูปภาพ (JPG, PNG) หรือไฟล์เอกสาร PDF เท่านั้น`);
      return;
    }

    setFiles((prev) => ({ ...prev, [docTitle]: file }));
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

    const finalPrefix = formData.titlePrefix === 'อื่นๆ' ? formData.customPrefix.trim() : formData.titlePrefix;
    if (!finalPrefix) {
      setError('กรุณาระบุคำนำหน้าชื่อ');
      return;
    }

    setLoading(true);

    try {
      const payload = new FormData();
      payload.append('titlePrefix', finalPrefix);
      payload.append('idCardNumber', cleanId);
      payload.append('firstName', formData.firstName);
      payload.append('lastName', formData.lastName);
      payload.append('phoneNumber', formData.phoneNumber);
      payload.append('email', formData.email);
      payload.append('age', formData.age);
      payload.append('occupation', formData.occupation);
      payload.append('educationLevel', formData.educationLevel);
      payload.append('address', formData.address);
      payload.append('pdpaConsent', String(formData.pdpaConsent));

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
    <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold flex items-start gap-2.5 shadow-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600 mt-0.5" />
          <span className="leading-relaxed">{error}</span>
        </div>
      )}

      {/* Part 1: Personal Info */}
      <div className="bg-white rounded-2xl p-5 sm:p-7 md:p-8 border border-slate-200/90 shadow-sm space-y-5">
        <div className="border-b border-slate-100 pb-3 flex items-center gap-2.5">
          <div className="w-2 h-6 bg-purple-700 rounded-full" />
          <h3 className="text-base sm:text-lg font-bold text-slate-800">
            ส่วนที่ 1: ข้อมูลส่วนตัวของผู้สมัคร
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              เลขประจำตัวประชาชน (13 หลัก) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="idCardNumber"
              required
              maxLength={13}
              inputMode="numeric"
              pattern="[0-9]*"
              value={formData.idCardNumber}
              onChange={handleInputChange}
              placeholder="1100400123456"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-base sm:text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition shadow-xs"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              เบอร์โทรศัพท์ที่ติดต่อได้สะดวก <span className="text-rose-500">*</span>
            </label>
            <input
              type="tel"
              name="phoneNumber"
              required
              inputMode="tel"
              autoComplete="tel"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              placeholder="0812345678"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-base sm:text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition shadow-xs"
            />
          </div>

          {/* Title Prefix Selector - Touch-friendly card buttons */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              คำนำหน้าชื่อ <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              {['นาย', 'นาง', 'นางสาว', 'อื่นๆ'].map((p) => {
                const isSelected = formData.titlePrefix === p;
                return (
                  <label
                    key={p}
                    className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl border text-sm font-semibold cursor-pointer transition select-none active:scale-[0.98] ${
                      isSelected
                        ? 'bg-purple-50 border-purple-600 text-purple-900 ring-2 ring-purple-500/20 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="titlePrefix"
                      value={p}
                      checked={isSelected}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-purple-600 focus:ring-purple-500 accent-purple-600"
                    />
                    <span>{p}</span>
                  </label>
                );
              })}
            </div>

            {formData.titlePrefix === 'อื่นๆ' && (
              <div className="mt-3">
                <input
                  type="text"
                  name="customPrefix"
                  required
                  value={formData.customPrefix}
                  onChange={handleInputChange}
                  placeholder="ระบุคำนำหน้าชื่อ เช่น ดร. / ว่าที่ร้อยตรี"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-base sm:text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition shadow-xs"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              ชื่อ <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="firstName"
              required
              autoComplete="given-name"
              value={formData.firstName}
              onChange={handleInputChange}
              placeholder="สมชาย"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-base sm:text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition shadow-xs"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              นามสกุล <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              name="lastName"
              required
              autoComplete="family-name"
              value={formData.lastName}
              onChange={handleInputChange}
              placeholder="ใจดี"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-base sm:text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition shadow-xs"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              อายุ (ปี)
            </label>
            <input
              type="number"
              name="age"
              inputMode="numeric"
              value={formData.age}
              onChange={handleInputChange}
              placeholder="25"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-base sm:text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition shadow-xs"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              อีเมล (Email) <span className="text-slate-400 font-normal text-xs">(ไม่บังคับใส่)</span>
            </label>
            <input
              type="email"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="applicant@example.com (ไม่บังคับใส่)"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-base sm:text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition shadow-xs"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              อาชีพปัจจุบัน
            </label>
            <input
              type="text"
              name="occupation"
              value={formData.occupation}
              onChange={handleInputChange}
              placeholder="เช่น รับจ้าง, ค้าขาย, พนักงานบริษัท"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-base sm:text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition shadow-xs"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              ระดับการศึกษาสูงสุด
            </label>
            <select
              name="educationLevel"
              value={formData.educationLevel}
              onChange={handleInputChange}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-base sm:text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition shadow-xs bg-white"
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
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              ที่อยู่ปัจจุบัน
            </label>
            <textarea
              name="address"
              rows={2}
              value={formData.address}
              onChange={handleInputChange}
              placeholder="ที่อยู่ตามบัตรประชาชน หรือที่พักอาศัยปัจจุบัน"
              className="w-full px-4 py-3 rounded-xl border border-slate-300 text-base sm:text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition shadow-xs resize-y"
            />
          </div>
        </div>
      </div>

      {/* Part 2: Dynamic Questions from Form Builder */}
      {form && form.sections && form.sections.length > 0 && (
        <div className="bg-white rounded-2xl p-5 sm:p-7 md:p-8 border border-slate-200/90 shadow-sm space-y-6">
          {form.sections.map((section: any) => (
            <div key={section.id} className="space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center gap-2.5">
                <div className="w-2 h-6 bg-purple-700 rounded-full" />
                <h3 className="text-base sm:text-lg font-bold text-slate-800">
                  {section.title}
                </h3>
              </div>
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
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        {q.label} {q.isRequired && <span className="text-rose-500">*</span>}
                      </label>

                      {q.questionType === 'RADIO' ? (
                        <div className="space-y-2 pt-1">
                          {options.map((opt, i) => (
                            <label
                              key={i}
                              className={`flex items-center gap-3 p-3 rounded-xl border text-sm cursor-pointer transition select-none ${
                                answers[q.id] === opt
                                  ? 'bg-purple-50 border-purple-600 text-purple-950 font-semibold ring-1 ring-purple-500/20'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`q_${q.id}`}
                                required={q.isRequired}
                                checked={answers[q.id] === opt}
                                onChange={() => handleDynamicChange(q.id, opt)}
                                className="w-4 h-4 text-purple-600 focus:ring-purple-500 accent-purple-600"
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
                          className="w-full px-4 py-3 rounded-xl border border-slate-300 text-base sm:text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition shadow-xs bg-white"
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
                          className="w-full px-4 py-3 rounded-xl border border-slate-300 text-base sm:text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition shadow-xs resize-y"
                        />
                      ) : (
                        <input
                          type="text"
                          required={q.isRequired}
                          value={answers[q.id] || ''}
                          onChange={(e) => handleDynamicChange(q.id, e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-slate-300 text-base sm:text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition shadow-xs"
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

      {/* Part 3: Documents Upload (Optional - ไม่บังคับใส่) */}
      {course.requiredDocuments && course.requiredDocuments.length > 0 && (
        <div className="bg-white rounded-2xl p-5 sm:p-7 md:p-8 border border-slate-200/90 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-6 bg-purple-700 rounded-full" />
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-purple-700" />
                <h3 className="text-base sm:text-lg font-bold text-slate-800">
                  ส่วนที่ 3: แนบเอกสารประกอบการสมัคร
                </h3>
              </div>
            </div>
            <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full flex-shrink-0">
              ไม่บังคับแนบ
            </span>
          </div>

          {/* Guide banner explaining allowed file types and sizes */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-purple-50/80 border border-purple-200 text-purple-950 text-xs sm:text-sm space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-purple-900">
              <span className="text-base">📄</span>
              <span>ประเภทไฟล์ที่สามารถแนบได้:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-purple-900/90 pl-1 leading-relaxed">
              <li>
                <strong>ประเภทไฟล์ที่รองรับ:</strong> ไฟล์รูปภาพ (<strong>JPG, JPEG, PNG</strong>) หรือไฟล์เอกสาร (<strong>PDF</strong>)
              </li>
              <li>
                <strong>ขนาดไฟล์:</strong> ไม่เกิน <strong>10 MB</strong> ต่อไฟล์
              </li>
              <li>
                <strong>บนโทรศัพท์มือถือ:</strong> สามารถกดเลือกไฟล์แล้วใช้กล้องถ่ายรูปเอกสาร หรือเลือกรูปภาพจากเครื่องได้โดยตรง
              </li>
            </ul>
          </div>

          {fileError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{fileError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {course.requiredDocuments.map((doc: any) => {
              const selectedFile = files[doc.title];
              return (
                <div key={doc.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-800 block">
                      {doc.title}
                    </span>
                    {selectedFile && (
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        ✓ แนบไฟล์แล้ว
                      </span>
                    )}
                  </div>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                    onChange={(e) => handleFileChange(doc.title, e.target.files?.[0] || null)}
                    className="block w-full text-xs sm:text-sm text-slate-500 file:mr-3 file:py-2 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-purple-100 file:text-purple-800 hover:file:bg-purple-200 cursor-pointer"
                  />
                  {selectedFile ? (
                    <div className="space-y-2">
                      <div className="text-[11px] sm:text-xs text-slate-600 truncate bg-white p-2 rounded-lg border border-slate-200">
                        📎 <strong>{selectedFile.name}</strong> ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                      </div>
                      {selectedFile.type.startsWith('image/') && (
                        <div className="relative w-28 h-28 rounded-xl overflow-hidden border border-purple-200 shadow-xs bg-white">
                          <img
                            src={URL.createObjectURL(selectedFile)}
                            alt="ตัวอย่างรูปแนบ"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-400 block">
                      รองรับ JPG, PNG, PDF (ไม่เกิน 10MB)
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Part 4: PDPA & Submission */}
      <div className="bg-white rounded-2xl p-5 sm:p-7 md:p-8 border border-slate-200/90 shadow-sm space-y-5">
        <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-600 space-y-3">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm sm:text-base">
            <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>การคุ้มครองข้อมูลส่วนบุคคล (PDPA Notice & Consent)</span>
          </div>
          <p className="leading-relaxed text-slate-600 text-xs sm:text-sm">
            ข้าพเจ้ายินยอมให้หน่วยงานจัดเก็บ รวบรวม และประมวลผลข้อมูลส่วนบุคคลข้างต้น เพื่อประโยชน์ในการคัดเลือก ติดต่อประสานงาน และบริหารจัดการการฝึกอบรมตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562
          </p>
          <label className="flex items-start sm:items-center gap-3 pt-2 cursor-pointer font-bold text-slate-800 select-none">
            <input
              type="checkbox"
              name="pdpaConsent"
              checked={formData.pdpaConsent}
              onChange={handleInputChange}
              className="w-5 h-5 mt-0.5 sm:mt-0 text-purple-600 rounded focus:ring-purple-500 accent-purple-600 flex-shrink-0 cursor-pointer"
            />
            <span className="text-xs sm:text-sm leading-normal">ข้าพเจ้าได้อ่าน เข้าใจ และยินยอมตามเงื่อนไขข้างต้น</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 sm:py-4 px-6 rounded-xl font-extrabold text-sm sm:text-base text-white bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 shadow-md hover:shadow-lg active:scale-[0.99] transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
        >
          {loading ? (
            <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          ) : (
            <>
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>ยืนยันการสมัครเข้ารับการฝึกอบรม (Submit Application)</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
