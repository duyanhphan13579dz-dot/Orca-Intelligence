import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Bật instrumentation (auto bootstrap dữ liệu khi server khởi động).
  // Phục vụ static asset (logo/watermark/favicon) trực tiếp từ /public,
  // không qua bộ tối ưu ảnh — tránh lỗi 404 /_next/image trên Production.
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        // Cache hợp lý cho ảnh tĩnh ở /public, vẫn cho phép cache-bust khi đổi tên file.
        source: "/:all*(png|jpg|jpeg|gif|svg|ico|webp|woff|woff2)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=3600, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
