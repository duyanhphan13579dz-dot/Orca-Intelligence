import { TrendingUp, TrendingDown, Minus, CheckCircle2, Clock } from "lucide-react";
import type { DetectedPattern } from "@/lib/pattern-scanner";

const DIR_STYLE: Record<string, { cls: string; icon: React.ReactNode }> = {
  "Tăng": { cls: "text-emerald-400", icon: <TrendingUp size={13} /> },
  "Giảm": { cls: "text-rose-400", icon: <TrendingDown size={13} /> },
  "Trung lập": { cls: "text-slate-400", icon: <Minus size={13} /> },
};

const GROUP_TONE: Record<string, string> = {
  "Đảo chiều": "bg-rose-500/15 text-rose-300",
  "Tiếp diễn": "bg-blue-500/15 text-blue-300",
  "Nến": "bg-gold/15 text-gold",
};

export function PatternScanner({ patterns }: { patterns: DetectedPattern[] }) {
  if (!patterns || patterns.length === 0) {
    return (
      <p className="rounded-lg border border-white/10 bg-white/[0.02] p-4 text-sm text-muted">
        Chưa phát hiện mẫu hình kỹ thuật rõ ràng trên dữ liệu giá hiện tại. Hệ thống tiếp tục quét tự động sau mỗi chu kỳ 15 phút.
      </p>
    );
  }
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {patterns.map((p, i) => {
        const dir = DIR_STYLE[p.direction];
        return (
          <div key={`${p.name}-${i}`} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="font-semibold">{p.name}</span>
              <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ${GROUP_TONE[p.group]}`}>{p.group}</span>
            </div>
            <div className="mb-2 flex items-center gap-2 text-xs">
              {p.status === "Đã xác nhận" ? (
                <span className="flex items-center gap-1 text-emerald-400"><CheckCircle2 size={12} /> Đã xác nhận</span>
              ) : (
                <span className="flex items-center gap-1 text-gold"><Clock size={12} /> Đang hình thành</span>
              )}
              <span className={`ml-auto flex items-center gap-1 font-medium ${dir.cls}`}>{dir.icon} {p.direction}</span>
            </div>
            <div className="mb-1.5">
              <div className="mb-0.5 flex justify-between text-[10px] text-muted">
                <span>Độ tin cậy</span><span className="text-gold">{p.confidence}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full gold-gradient" style={{ width: `${p.confidence}%` }} />
              </div>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-muted">{p.meaning}</p>
            <p className="mt-1.5 text-[10px] text-muted">Phát hiện: {p.detectedAt}</p>
          </div>
        );
      })}
    </div>
  );
}
