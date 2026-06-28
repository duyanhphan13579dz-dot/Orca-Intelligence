"use client";
import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Loader2, Database, Server, Search, Clock, Activity } from "lucide-react";
import { PageHeader, Card, SectionTitle } from "@/components/ui";
import { Breadcrumbs } from "@/components/Breadcrumbs";

interface Provider { name: string; key: string; scope: string[]; health: "ok" | "syncing" | "error"; note?: string }
interface Status {
  providers: Provider[];
  sync: { totalStocks: number; activeStocks: number; withPrice: number; lastSync: string | null } | null;
  exchanges: Record<string, number>;
  refreshSeconds: number;
  serverTime: string;
}

const DOT: Record<string, string> = { ok: "🟢", syncing: "🟡", error: "🔴" };

export default function AdminSystemPage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/system/status");
      const json = await res.json();
      if (json.ok) setStatus(json);
    } catch { /* */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const runSync = async (full: boolean) => {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const res = await fetch(`/api/stocks/sync?batch=${full ? 150 : 80}`, { method: "POST" });
      const json = await res.json();
      if (json.ok) {
        setSyncMsg(`Đồng bộ thành công: +${json.listing?.inserted ?? 0} mã mới, ${json.pricesSynced ?? 0} mã cập nhật giá. Tổng ${json.status?.totalStocks ?? 0} mã.`);
        load();
      } else {
        setSyncMsg(`Lỗi: ${json.error ?? "không xác định"}`);
      }
    } catch (e) {
      setSyncMsg(`Lỗi kết nối: ${e instanceof Error ? e.message : "unknown"}`);
    }
    setSyncing(false);
  };

  const sync = status?.sync;
  const ex = status?.exchanges ?? {};

  return (
    <div>
      <Breadcrumbs items={[{ label: "Quản trị" }, { label: "Trạng thái hệ thống" }]} />
      <PageHeader
        title="Trạng thái hệ thống"
        subtitle="Giám sát Data Pipeline: nguồn dữ liệu, Master Database, Search Index, Scheduler và đồng bộ."
        action={
          <button onClick={load} className="flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2 text-sm hover:border-gold/50">
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Tải lại
          </button>
        }
      />

      {loading && !status ? (
        <div className="flex items-center gap-2 text-muted"><Loader2 className="animate-spin" size={16} /> Đang tải trạng thái...</div>
      ) : (
        <div className="space-y-6">
          {/* Tổng quan số liệu */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard icon={<Database size={18} />} label="Tổng số mã" value={(sync?.totalStocks ?? 0).toLocaleString("vi-VN")} />
            <StatCard icon={<Activity size={18} />} label="Đang giao dịch" value={(sync?.activeStocks ?? 0).toLocaleString("vi-VN")} />
            <StatCard icon={<Search size={18} />} label="Đã có giá realtime" value={(sync?.withPrice ?? 0).toLocaleString("vi-VN")} />
            <StatCard icon={<Clock size={18} />} label="Đồng bộ giá lần cuối" value={sync?.lastSync ? new Date(sync.lastSync).toLocaleString("vi-VN") : "—"} small />
          </div>

          {/* Phân bố theo sàn */}
          <Card>
            <SectionTitle>Search Index theo sàn</SectionTitle>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {["HOSE", "HNX", "UPCOM"].map((e) => (
                <div key={e} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                  <div className="text-[11px] text-muted">{e}</div>
                  <div className="mt-1 text-lg font-bold text-gold">{(ex[e] ?? 0).toLocaleString("vi-VN")}</div>
                </div>
              ))}
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <div className="text-[11px] text-muted">Trạng thái Index</div>
                <div className="mt-1 text-sm font-semibold">{(sync?.totalStocks ?? 0) > 0 ? "🟢 Sẵn sàng" : "🟡 Đang khởi tạo"}</div>
              </div>
            </div>
          </Card>

          {/* Nguồn dữ liệu */}
          <Card>
            <SectionTitle>Nguồn dữ liệu (Data Providers)</SectionTitle>
            <div className="space-y-2">
              {status?.providers.map((p) => (
                <div key={p.key} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/5 bg-white/[0.02] p-3">
                  <span className="flex items-center gap-2 font-medium"><span>{DOT[p.health]}</span> {p.name}</span>
                  <span className="text-xs text-muted">{p.scope.join(" • ")}</span>
                  {p.note && <span className="text-[11px] text-muted">({p.note})</span>}
                </div>
              ))}
            </div>
          </Card>

          {/* Scheduler & đồng bộ */}
          <Card>
            <SectionTitle>Scheduler & Đồng bộ</SectionTitle>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="flex items-center gap-2"><Server size={15} className="text-gold" /> Chu kỳ tự động: {(status?.refreshSeconds ?? 900) / 60} phút/lần</span>
              <span className="text-muted">Giờ máy chủ: {status ? new Date(status.serverTime).toLocaleString("vi-VN") : "—"}</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={() => runSync(false)} disabled={syncing} className="flex items-center gap-2 rounded-lg border border-gold/40 bg-gold/10 px-4 py-2 text-sm font-medium text-gold hover:bg-gold/20 disabled:opacity-50">
                <RefreshCw size={14} className={syncing ? "animate-spin" : ""} /> Đồng bộ danh sách + giá
              </button>
              <button onClick={() => runSync(true)} disabled={syncing} className="flex items-center gap-2 rounded-lg gold-gradient px-4 py-2 text-sm font-semibold text-navy disabled:opacity-50">
                <RefreshCw size={14} className={syncing ? "animate-spin" : ""} /> Đồng bộ đầy đủ (Initial Sync)
              </button>
            </div>
            {syncMsg && <p className="mt-3 rounded-lg border border-white/10 bg-white/[0.02] p-3 text-xs text-muted">{syncMsg}</p>}
          </Card>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, small }: { icon: React.ReactNode; label: string; value: string; small?: boolean }) {
  return (
    <Card>
      <div className="mb-2 flex items-center gap-2 text-gold">{icon}<span className="text-xs font-semibold">{label}</span></div>
      <div className={small ? "text-sm font-bold" : "text-2xl font-bold"}>{value}</div>
    </Card>
  );
}
