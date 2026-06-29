import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { AppShell } from "@/components/AppShell";

// ================================================================
// Metadata — tất cả brand icons đều dùng Orca Whale Sticker.
// Nguồn duy nhất: /orca-sticker.svg  (SVG, ~4 KB, vector)
//                  /orca-icon-512.png (PNG 512px, raster fallback)
// ================================================================
export const metadata: Metadata = {
  title: {
    default: "Orca Financial — Nền tảng phân tích tài chính chuyên sâu",
    template: "%s | Orca Financial",
  },
  description:
    "Orca Financial — nền tảng phân tích tài chính chuyên nghiệp với dữ liệu thời gian thực về cổ phiếu, hàng hóa, ngoại hối, tiền mã hóa và kinh tế vĩ mô.",
  keywords: ["phân tích tài chính", "chứng khoán", "VN-Index", "cổ phiếu", "hàng hóa", "ngoại hối", "tiền mã hóa"],
  authors: [{ name: "Orca Financial" }],

  // === Favicon & PWA icons — Orca Whale Sticker ===
  icons: {
    icon: [
      { url: "/orca-sticker.svg", type: "image/svg+xml", sizes: "any" },
      { url: "/orca-icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [
      { url: "/orca-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/orca-icon-512.png",
  },

  // === Open Graph / Social preview — Orca Whale Sticker ===
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: "https://orcafinancial.vn",
    siteName: "Orca Financial",
    title: "Orca Financial — Nền tảng phân tích tài chính chuyên sâu",
    description:
      "Dữ liệu thị trường thời gian thực, phân tích AI chuyên sâu và chiến lược đầu tư cho nhà đầu tư Việt Nam.",
    images: [
      {
        url: "/orca-icon-512.png",
        width: 512,
        height: 512,
        alt: "Orca Financial — Cá Voi Tài Chính",
      },
    ],
  },

  // === Twitter Card ===
  twitter: {
    card: "summary",
    title: "Orca Financial",
    description: "Nền tảng phân tích tài chính chuyên sâu dành cho nhà đầu tư Việt Nam.",
    images: ["/orca-icon-512.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0B1F45",
  colorScheme: "dark light",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <body className="antialiased">
        {/* Watermark — Orca Whale Sticker, opacity 4%, soft-light blend */}
        <div className="watermark" aria-hidden />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
