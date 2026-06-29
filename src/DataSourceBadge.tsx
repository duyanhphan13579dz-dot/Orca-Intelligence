import { Database, Clock, RefreshCw } from "lucide-react";

interface Props {
  sourceName: string;
  publishedAt: string | null;        // ISO từ nguồn — GIỮ NGUYÊN, không chỉnh
  publishedAtRaw?: string;           // Chuỗi gốc từ nguồn (fallback nếu parse lỗi)
  syncedAt: string;                  // ISO — Orca sync time
  status?: "ok" | "syncing" | "error" | "stale";
  compact?: boolean;
}

const STATUS_ICON: Record<string, string> = { ok: "🟢", syncing: "🟡", error: "🔴", stale: "🟠" };

function fmtVn(iso: string | null, raw?: string): string {
  if (!iso && !raw) return "Không có thông tin thời gian";
  if (!iso) return raw || "Không có thông tin thời gian";
  try {
    return new Date(iso).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour12: false });
  } catch {
    return raw || iso;
  }
}

export function DataSourceBadge({ sourceName, publishedAt, publishedAtRaw, syncedAt, status = "ok", compact }: Props) {
  if (compact) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-white/[0.04] px-2 py-0.5 text-[10px] text-muted">
        {STATUS_ICON[status]} {sourceName}
        {publishedAt && <span className="text-white/50">• {fmtVn(publishedAt, publishedAtRaw)}</span>}
      </span>
    );
  }
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-2.5 text-[11px]">
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <span className="flex items-center gap-1 text-muted">
          <Database size={11} /> Nguồn: <span className="font-medium text-white/80">{sourceName}</span>
          <span className="ml-1">{STATUS_ICON[status]}</span>
        </span>
        <span className="flex items-center gap-1 text-muted">
          <Clock size={11} /> Phát hành:{" "}
          <span className="font-medium text-white/80">
            {publishedAt ? fmtVn(publishedAt, publishedAtRaw) : (publishedAtRaw || "Không có thông tin thời gian")}
          </span>
        </span>
        <span className="flex items-center gap-1 text-muted">
          <RefreshCw size={11} /> Đồng bộ:{" "}
          <span className="font-medium text-white/80">{fmtVn(syncedAt)}</span>
        </span>
      </div>
    </div>
  );
}
