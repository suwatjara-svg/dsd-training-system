import React from 'react';
import { FolderPlus, Copy, FileText, CheckCircle2 } from 'lucide-react';

const DEFAULT_TEMPLATES = [
  {
    id: 'tpl_1',
    name: 'แบบฟอร์มช่างเครื่องปรับอากาศและการพาณิชย์',
    category: 'ช่างเครื่องปรับอากาศ',
    description: 'แบบฟอร์มคัดกรองความรู้พื้นฐานงานช่างไฟฟ้าและเครื่องมือช่าง',
    questionsCount: 3,
  },
  {
    id: 'tpl_2',
    name: 'แบบฟอร์มการประกอบอาหารและเบเกอรี่',
    category: 'อาหารและโภชนาการ',
    description: 'แบบฟอร์มประเมินความพร้อมและประสบการณ์งานครัว',
    questionsCount: 2,
  },
  {
    id: 'tpl_3',
    name: 'แบบฟอร์มช่างซ่อมบำรุงรถยนต์และรถจักรยานยนต์',
    category: 'ช่างยนต์',
    description: 'แบบฟอร์มคัดกรองความรู้พื้นฐานเครื่องยนต์และเครื่องมือกล',
    questionsCount: 4,
  },
  {
    id: 'tpl_4',
    name: 'แบบฟอร์มการใช้คอมพิวเตอร์และดิจิทัลสำหรับสำนักงาน',
    category: 'เทคโนโลยีดิจิทัล',
    description: 'แบบฟอร์มทดสอบทักษะคอมพิวเตอร์เบื้องต้นและโปรแกรมสำนักงาน',
    questionsCount: 3,
  },
  {
    id: 'tpl_5',
    name: 'แบบฟอร์มช่างเชื่อมอาร์กโลหะด้วยมือ',
    category: 'ช่างเชื่อม',
    description: 'แบบฟอร์มประเมินความพร้อมด้านความปลอดภัยและสุขภาพในการทำงานช่างเชื่อม',
    questionsCount: 3,
  },
];

export default function FormTemplatesPage() {
  const templates = DEFAULT_TEMPLATES;

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <FolderPlus className="w-5 h-5 text-sky-600" />
          <span>เทมเพลตแบบฟอร์มรับสมัคร (Form Templates)</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          เทมเพลตมาตรฐานตามสายวิชาชีพ (เบเกอรี่, ช่างไฟฟ้า, ช่างยนต์ ฯลฯ) เพื่อคัดลอกไปใช้เปิดหลักสูตรใหม่ได้ทันที
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((tpl) => (
          <div key={tpl.id} className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">
                {tpl.category}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {tpl.questionsCount} คำถาม
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-800">{tpl.name}</h3>
              <p className="text-xs text-slate-500 mt-1">{tpl.description}</p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> พร้อมใช้งาน
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
