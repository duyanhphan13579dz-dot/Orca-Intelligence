"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

// Tính số mili-giây còn lại đến mốc :00 / :15 / :30 / :45 kế tiếp
function msToNextQuarter(now = new Date()): number {
  const next = new Date(now);
  const m = now.getMinutes();
  const nextMark = Math.floor(m / 15) * 15 + 15;
  next.setMinutes(nextMark, 0, 0);
  return Math.max(1000, next.getTime() - now.getTime());
}

export function AutoRefresh() {
  const router = useRouter();
  const [last, setLast] = useState<Date | null>(null);
  const [remaining, setRemaining] = useState(() => msToNextQuarter());
  const [spinning, setSpinning] = useState(false);

  const doRefresh = useCallback(() => {
    setSpinning(true);
    router.refresh();
    setLast(new Date());
    setRemaining(msToNextQuarter());
    setTimeout(() => setSpinning(false), 800);
  }, [router]);

  useEffect(() => {
    setLast(new Date());
    const tick = setInterval(() => {
      setRemaining(() => {
        const r = msToNextQuarter();
        // Khi vừa chạm mốc quý giờ (còn < ~1.1s) thì làm mới
        if (r <= 1100) {
          doRefresh();
        }
        return r;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [doRefresh]);

  const mm = String(Math.floor(remaining / 60000)).padStart(2, "0");
  const ss = String(Math.floor((remaining % 60000) / 1000)).padStart(2, "0");

  return (
    <button
      onClick={doRefresh}
      title={`Tự động làm mới theo mốc :00 / :15 / :30 / :45.${last ? ` Cập nhật lúc ${last.toLocaleTimeString("vi-VN")}` : ""}`}
      className="hidden items-center gap-2 rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] text-muted transition hover:text-gold sm:flex"
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      <span className="tabular-nums">Làm mới sau {mm}:{ss}</span>
      <RefreshCw size={13} className={spinning ? "animate-spin text-gold" : ""} />
    </button>
  );
}
