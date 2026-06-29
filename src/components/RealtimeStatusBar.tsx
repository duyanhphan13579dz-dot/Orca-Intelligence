"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Loader2 } from "lucide-react";

interface ProviderStatus {
  name: string;
  key: string;
  scope: string[];
  health: "ok" | "syncing" | "error";
  note?: string;
}
interface SystemStatus {
  providers: ProviderStatus[];
  sync: { totalStocks: number; activeStocks: number; withPrice: number; lastSync: string | null } | null;
  refreshSeconds: number;
}

function msToNextQuarter(now = new Date()): number {
  const next = new Date(now);
  const nextMark = Math.floor(now.getMinutes() / 15) * 15 + 15;
  next.setMinutes(nextMark, 0, 0);
  return Math.max(1000, next.getTime() - now.getTime());
}

const DOT: Record<string, string> = {
  ok: "🟢",
  syncing: "🟡",
  error: "🔴",
};

export function RealtimeStatusBar() {
  const router = useRouter();
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [remaining, setRemaining] = useState(() => msToNextQuarter());
  const [spinning, setSpinning] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/system/status");
      const json = await res.json();
      if (json.ok) {
        setStatus(json);
        setUpdatedAt(new Date());
      }
    } catch { /* keep previous */ }
    setLoading(false);
  }, []);

  const refreshNow = useCallback(() => {
    setSpinning(true);
    router.refresh();
    load().finally(() => setTimeout(() => setSpinning(false), 800));
    setRemaining(msToNextQuarter());
  }, [router, load]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const tick = setInterval(() => {
      const r = msToNextQuarter();
      setRemaining(r);
      if (r <= 1100) refreshNow();
    }, 1000);
    return () => clearInterval(tick);
  }, [refreshNow]);

  const mm = String(Math.floor(remaining / 60000)).padStart(2, "0");
  const ss = String(Math.floor((remaining % 60000) / 1000)).padStart(2, "0");

  return (
    <div className="glass rounded-xl p-3">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
        <span className="flex items-center gap-1.5 font-semibold text-gold">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Realtime Data Engine
        </span>

        {loading ? (
          <span className="flex items-center gap-1 text-muted"><Loader2 size={12} className="animate-spin" /> Đang kiểm tra nguồn...</span>
        ) : (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {status?.providers.map((p) => (
              <span key={p.key} className="flex items-center gap-1 text-muted" title={`${p.scope.join(", ")}${p.note ? ` • ${p.note}` : ""}`}>
                <span>{DOT[p.health]}</span>
                <span className="text-white/85">{p.name}</span>
              </span>
            ))}
          </div>
        )}

        {status?.sync?.lastSync && (
          <span className="text-muted">
            Đồng bộ lần cuối: <span className="text-white/85">{new Date(status.sync.lastSync).toLocaleString("vi-VN")} (GMT+7)</span>
          </span>
        )}
        {status?.sync && (
          <span className="text-muted">
            Master DB: <span className="text-white/85">{status.sync.totalStocks.toLocaleString("vi-VN")} mã • {status.sync.withPrice.toLocaleString("vi-VN")} có giá realtime</span>
          </span>
        )}

        <span className="ml-auto flex items-center gap-3">
          <span className="tabular-nums text-muted">Chu kỳ tiếp theo: <span className="text-gold">{mm}:{ss}</span></span>
          <button onClick={refreshNow} className="flex items-center gap-1.5 rounded-lg border border-gold/40 bg-gold/10 px-2.5 py-1 font-medium text-gold hover:bg-gold/20">
            <RefreshCw size={12} className={spinning ? "animate-spin" : ""} /> Làm mới ngay
          </button>
        </span>
      </div>
      {updatedAt && (
        <div className="mt-1.5 text-[10px] text-muted">
          Tự động làm mới theo mốc :00 / :15 / :30 / :45 mỗi giờ • Cập nhật giao diện lúc {updatedAt.toLocaleTimeString("vi-VN")}
        </div>
      )}
    </div>
  );
}
