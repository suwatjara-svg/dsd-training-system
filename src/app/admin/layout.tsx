import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getCurrentUser } from '@/lib/auth';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  CheckCircle,
  FileSpreadsheet,
  Clock,
  ShieldCheck,
  UserCheck,
  FolderPlus,
  ArrowLeft,
} from 'lucide-react';
import AdminLogoutButton from '@/components/AdminLogoutButton';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  const navLinks = [
    { label: 'หน้ารวมหลักสูตร/รุ่น', href: '/admin', icon: LayoutDashboard },
    { label: 'คัดเลือกผู้สมัคร (Screening)', href: '/admin/screening', icon: CheckCircle, highlight: true },
    { label: 'รายชื่อผู้สมัคร', href: '/admin/applicants', icon: Users },
    { label: 'จัดการคิวสำรอง (Waitlist)', href: '/admin/waitlist', icon: Clock },
    { label: 'เทมเพลตฟอร์ม', href: '/admin/forms', icon: FolderPlus },
    { label: 'ส่งออกรายงาน (Export)', href: '/admin/reports', icon: FileSpreadsheet },
    { label: 'จัดการผู้ใช้งาน (เพิ่มรหัส)', href: '/admin/users', icon: UserCheck },
    { label: 'Audit Logs', href: '/admin/audit-logs', icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 shadow-xl border-r border-slate-800">
        <div className="p-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 relative flex-shrink-0 bg-white rounded-xl p-1 shadow-md">
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
              <h2 className="text-xs font-bold text-white tracking-wide leading-tight">
                สถาบันพัฒนาฝีมือแรงงาน 4 ราชบุรี
              </h2>
              <span className="text-[11px] text-sky-400 font-medium">ระบบคัดเลือกผู้เข้าฝึกอบรม</span>
            </div>
          </div>
        </div>

        {/* User Card */}
        <div className="px-5 py-3 border-b border-slate-800/60 bg-slate-950/40">
          <p className="text-[11px] text-slate-400 font-medium">ผู้ใช้งานปัจจุบัน</p>
          <p className="text-xs font-semibold text-white truncate mt-0.5">{user?.fullName || 'เจ้าหน้าที่'}</p>
          <div className="mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-sky-950 text-sky-300 border border-sky-800/50">
            {user?.role || 'OFFICER'}
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  item.highlight
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30 hover:bg-sky-500'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${item.highlight ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60">
          <AdminLogoutButton />
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-wider font-semibold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
              ● สถาบันพัฒนาฝีมือแรงงาน 4 ราชบุรี
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <Link
              href="/"
              target="_blank"
              className="text-sky-600 hover:underline font-medium"
            >
              ↗ ดูหน้าเว็บรับสมัครสำหรับประชาชน
            </Link>
          </div>
        </header>

        <div className="p-6 md:p-8 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
