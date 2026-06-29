import { Radio, Database } from "lucide-react";

export function LiveBadge({ live }: { live: boolean }) {
  if (live) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
        <Radio size={11} className="animate-pulse" /> Dữ liệu thời gian thực • VNDirect
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-white/10 px-2 py-0.5 text-[11px] font-medium text-muted">
      <Database size={11} /> Dữ liệu mô phỏng
    </span>
  );
}
