"use client";
import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Cổ phiếu] Lỗi tải dữ liệu:", error);
  }, [error]);

  return (
    <div className="flex min-h-[55vh] flex-col items-center justify-center text-center">
      <div className="glass max-w-md rounded-2xl p-8">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/15 text-rose-400">
          <AlertTriangle size={28} />
        </div>
        <h1 className="text-xl font-bold">Không thể tải dữ liệu cổ phiếu</h1>
        <p className="mt-2 text-sm text-muted">
          Nguồn dữ liệu tạm thời không phản hồi. Hệ thống đã ghi nhận lỗi và sẽ thử đồng bộ lại.
          Vui lòng thử tải lại trang.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="flex items-center gap-2 rounded-lg gold-gradient px-5 py-2.5 text-sm font-semibold text-navy transition hover:opacity-90"
          >
            <RefreshCw size={16} /> Thử tải lại
          </button>
          <Link
            href="/co-phieu"
            className="flex items-center gap-2 rounded-lg border border-white/15 px-5 py-2.5 text-sm font-semibold transition hover:border-gold/50"
          >
            <ArrowLeft size={16} /> Danh sách cổ phiếu
          </Link>
        </div>
      </div>
    </div>
  );
}
