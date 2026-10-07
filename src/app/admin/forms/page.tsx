import React from 'react';
import { prisma } from '@/lib/prisma';
import { FolderPlus, Copy, FileText, CheckCircle2 } from 'lucide-react';

export default async function FormTemplatesPage() {
  const templates = await prisma.formTemplate.findMany({
    orderBy: { createdAt: 'desc' },
  });

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
        {templates.map((tpl) => {
          let questionsCount = 0;
          try {
            const parsed = JSON.parse(tpl.schemaJson);
            questionsCount = parsed[0]?.questions?.length || 0;
          } catch {}

          return (
            <div key={tpl.id} className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">
                  {tpl.category}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {questionsCount} คำถาม
                </span>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-800">{tpl.name}</h3>
                <p className="text-xs text-slate-500 mt-1">{tpl.description}</p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>คัดลอกฟอร์มนี้ (Copy Template)</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
