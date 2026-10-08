import React from 'react';
import { ShieldCheck, History } from 'lucide-react';
import { formatThaiDate } from '@/lib/utils';

export default async function AuditLogsPage() {
  const logs: any[] = [];

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <span>บันทึกประวัติการเปลี่ยนแปลง (Audit Trail Logs)</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          บันทึกทุกการตัดสินใจคัดเลือก การตรวจคุณสมบัติ และการโทรติดต่อ เพื่อความโปร่งใสและตรวจสอบย้อนหลังได้
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <th className="py-3 px-4">วัน-เวลา</th>
                <th className="py-3 px-4">ผู้ดำเนินการ (Admin)</th>
                <th className="py-3 px-4">ใบสมัครที่เกี่ยวข้อง</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">การเปลี่ยนแปลง</th>
                <th className="py-3 px-4">รายละเอียดเพิ่มเติม</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                    {formatThaiDate(log.createdAt, true)}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800">
                    {log.admin?.fullName || 'System'}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-sky-700">
                    {log.application?.applicationNumber || '-'}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-medium">
                    {log.oldValue ? `${log.oldValue} → ${log.newValue}` : log.newValue || '-'}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {log.details || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
