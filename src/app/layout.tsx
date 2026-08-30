import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Guardians of Talatphlu · 4 ผู้พิทักษ์ตลาดพลู",
  description:
    "เดินชมตลาดพลู สแกน QR เก็บพลัง 4 ธาตุ (ไฟ ดิน ลม น้ำ) และประกอบการ์ดใบที่ 5 ใบใหญ่กลางใจตลาด",
  applicationName: "Guardians of Talatphlu",
};

export const viewport: Viewport = {
  themeColor: "#0d1321",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}