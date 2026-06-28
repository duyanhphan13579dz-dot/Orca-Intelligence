import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: {
    default: "Orca Financial — Nền tảng phân tích tài chính chuyên sâu",
    template: "%s | Orca Financial",
  },
  description:
    "Orca Financial — nền tảng phân tích tài chính chuyên nghiệp với dữ liệu thời gian thực về cổ phiếu, hàng hóa, ngoại hối, tiền mã hóa và kinh tế vĩ mô.",
  icons: { icon: "/logo.png", apple: "/logo.png" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <body className="antialiased">
        <div className="watermark" aria-hidden />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
