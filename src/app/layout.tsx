import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ระบบรับสมัครและบริหารคัดเลือกผู้เข้าฝึกอบรม",
  description: "Training Form Builder & Applicant Screening Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className="antialiased min-h-screen bg-slate-50 text-slate-800">
        {children}
      </body>
    </html>
  );
}
