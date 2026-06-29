"use client";
import { useCallback, useEffect, useState } from "react";
import {
  RefreshCw, Loader2, Database, Server, Search, Clock,
  Activity, Zap, TrendingUp, AlertTriangle, CheckCircle2,
  Radio, BarChart3,
} from "lucide-react";
import { PageHeader, Card, SectionTitle } from "@/components/ui";
import { Breadcrumbs } from "@/components/Breadcrumbs";

interface Provider { name: string; key: string; scope: string[]; health: "ok" | "syncing" | "error"; note?: string }
interface EngineMetrics {
  totalInserted: number; totalSkipped: number; totalErrors: number;
  successRate: number; avgQualityScore: number; sourcesOk: number; sourcesFailed: number;
  totalFetchMs: number;
}
interface SyncResult { source: string; inserted: number; skipped: number; errors: number; durationMs: number; qualityAvg?: number }
interface LastResult { news: SyncResult[]; macro: SyncResult; calendar: SyncResult; totalDurationMs: number; ranAt: string; metrics: EngineMetrics }
interface SyncStatus { total: number; active: number; withPrice: number; lastSync: string | null }
interface SystemStatus {
  providers: Provider[];
  sync: SyncStatus | null;
  exchanges: Record<string, number>;
  refreshSeconds: number;
  serverTime: string;
}

const DOT: Record<string, string> = { ok: "🟢", syncing: "🟡", error: "🔴" };

export default function AdminSystemPage() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [engineResult, setEngineResult] = useState<LastResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(900);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sysRes, engRes] = await Promise.all([
        fetch("/api/system/status"),
        fetch("/api/data-engine/sync"),
      ]);
      const [sys, eng] = await Promise.all([sysRes.json(), engRes.json()]);
      if (sys.ok) setStatus(sys);
      if (eng.ok && eng.lastResult) setEngineResult(eng.lastResult);
    } catch { /* */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const tick = setInterval(() => {
      const now = new Date();
      const nextMark = new Date(now);
      nextMark.setMinutes(Math.floor(now.getMinutes() / 15) * 15 + 15, 0, 0);
      setRemaining(Math.max(0, Math.round((nextMark.getTime() - now.getTime()) / 1000)));
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  const runSync = async (type: "data" | "stocks") => {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const url = type === "data" ? "/api/data-engine/sync" : "/api/stocks/sync?batch=120";
      const method = "POST";
      const res = await fetch(url, { method });
      const json = await res.json();
      if (json.ok) {
        const r = json.result;
        if (type === "data" && r) {
          const news = (r.news || []).reduce((a: number, x: SyncResult) => a + x.inserted, 0);
          setSyncMsg(`✓ Data Engine: +${news} tin | macro: +${r.macro?.inserted ?? 0} | calendar: +${r.calendar?.inserted ?? 0} | ${r.totalDurationMs}ms | Quality: ${r.metrics?.avgQualityScore ?? 0}/100`);
          setEngineResult(r);
        } else {
          setSyncMsg(`✓ Đồng bộ cổ phiếu: ${json.pricesSynced ?? 0} mã cập nhật giá.`);
        }
        load();
      } else {
        setSyncMsg(`❌ Lỗi: ${json.error ?? "không xác định"}`);
      }
    } catch (e) {
      setSyncMsg(`❌ Lỗi kết nối: ${e instanceof Error ? e.message : "unknown"}`);
    }
    setSyncing(false);
  };

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const sync = status?.sync;
  const ex = status?.exchanges ?? {};
  const m = engineResult?.metrics;

  return (
    <div>
      <Breadcrumbs items={[{ label: "Quản trị" }, { label: "Data Engine" }]} />
      <PageHeader
        title="Data Engine — Observability Dashboard"
        subtitle="Giám sát hiệu năng, chất lượng dữ liệu và trạng thái đồng bộ theo thời gian thực."
        action={
          <button onClick={load} className="flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2 text-sm hover:border-gold/50">
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Tải lại
          </button>
        }
      />

      {loading && !status ? (
        <div className="flex items-center gap-2 text-muted"><Loader2 className="animate-spin" size={16} /> Đang tải...</div>
      ) : (
        <div className="space-y-6">

          {/* === Scheduler countdown === */}
          <Card>
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-2 text-sm">
                <span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"/><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"/></span>
                <span className="font-semibold text-gold">Auto Refresh — Mốc :00 / :15 / :30 / :45</span>
              </span>
              <span className="text-sm text-muted">Chu kỳ tiếp theo: <span className="font-mono text-gold">{mm}:{ss}</span></span>
              {status && <span className="text-xs text-muted">Server: {new Date(status.serverTime).toLocaleString("vi-VN")}</span>}
            </div>
          </Card>

          {/* === Engine Metrics === */}
          {m && (
            <section>
              <SectionTitle>Hiệu năng chu kỳ gần nhất</SectionTitle>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
                <MetricCard icon={<Zap size={16}/>} label="Tổng thời gian" value={`${engineResult?.totalDurationMs}ms`} good={(engineResult?.totalDurationMs ?? 9999) < 5000}/>
                <MetricCard icon={<TrendingUp size={16}/>} label="Đã thêm mới" value={`+${m.totalInserted}`} good={m.totalInserted > 0}/>
                <MetricCard icon={<BarChart3 size={16}/>} label="Bỏ qua" value={m.totalSkipped}/>
                <MetricCard icon={<AlertTriangle size={16}/>} label="Lỗi" value={m.totalErrors} good={m.totalErrors === 0}/>
                <MetricCard icon={<CheckCircle2 size={16}/>} label="Tỷ lệ thành công" value={`${m.successRate}%`} good={m.successRate >= 80}/>
                <MetricCard icon={<Activity size={16}/>} label="Điểm chất lượng TB" value={`${m.avgQualityScore}/100`} good={m.avgQualityScore >= 60}/>
                <MetricCard icon={<Radio size={16}/>} label="Nguồn OK/Lỗi" value={`${m.sourcesOk}/${m.sourcesFailed + m.sourcesOk}`} good={m.sourcesFailed === 0}/>
              </div>
            </section>
          )}

          {/* === News Workers Detail === */}
          {engineResult?.news && engineResult.news.length > 0 && (
            <Card>
              <SectionTitle>News Workers — Chi tiết từng nguồn</SectionTitle>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b text-left text-xs text-muted">
                    <th className="py-2">Nguồn</th><th className="py-2 text-right">Thêm mới</th>
                    <th className="py-2 text-right">Bỏ qua</th><th className="py-2 text-right">Lỗi</th>
                    <th className="py-2 text-right">Thời gian</th><th className="py-2 text-right">Chất lượng TB</th>
                    <th className="py-2 text-right">Trạng thái</th>
                  </tr></thead>
                  <tbody>
                    {engineResult.news.map((r) => (
                      <tr key={r.source} className="border-b border-white/5">
                        <td className="py-2 font-medium">{r.source}</td>
                        <td className="py-2 text-right text-emerald-400">+{r.inserted}</td>
                        <td className="py-2 text-right text-muted">{r.skipped}</td>
                        <td className="py-2 text-right text-rose-400">{r.errors}</td>
                        <td className="py-2 text-right tabular-nums">{r.durationMs}ms</td>
                        <td className="py-2 text-right"><QualityBadge score={r.qualityAvg ?? 0}/></td>
                        <td className="py-2 text-right">{r.errors === 0 ? "🟢 OK" : "🔴 Lỗi"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {engineResult.ranAt && (
                <div className="mt-2 text-[11px] text-muted">Last Scan: {new Date(engineResult.ranAt).toLocaleString("vi-VN")} (GMT+7)</div>
              )}
            </Card>
          )}

          {/* === Stock DB === */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard icon={<Database size={18}/>} label="Tổng số mã" value={(sync?.total ?? 0).toLocaleString("vi-VN")}/>
            <StatCard icon={<Activity size={18}/>} label="Đang giao dịch" value={(sync?.active ?? 0).toLocaleString("vi-VN")}/>
            <StatCard icon={<Search size={18}/>} label="Có giá realtime" value={(sync?.withPrice ?? 0).toLocaleString("vi-VN")}/>
            <StatCard icon={<Clock size={18}/>} label="Cập nhật giá lần cuối" value={sync?.lastSync ? new Date(sync.lastSync).toLocaleString("vi-VN") : "—"} small/>
          </div>

          {/* === Exchange breakdown === */}
          <Card>
            <SectionTitle>Search Index theo sàn</SectionTitle>
            <div className="grid grid-cols-3 gap-3">
              {["HOSE","HNX","UPCOM"].map((e) => (
                <div key={e} className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-center">
                  <div className="text-[11px] text-muted">{e}</div>
                  <div className="mt-1 text-xl font-bold text-gold">{(ex[e] ?? 0).toLocaleString("vi-VN")}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* === Data Sources === */}
          <Card>
            <SectionTitle>Data Providers</SectionTitle>
            <div className="space-y-2">
              {status?.providers.map((p) => (
                <div key={p.key} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/5 bg-white/[0.02] p-3">
                  <span className="flex items-center gap-2 font-medium"><span>{DOT[p.health]}</span>{p.name}</span>
                  <span className="text-xs text-muted">{p.scope.join(" • ")}</span>
                  {p.note && <span className="text-[11px] text-muted">({p.note})</span>}
                </div>
              ))}
            </div>
          </Card>

          {/* === Actions === */}
          <Card>
            <SectionTitle>Đồng bộ thủ công</SectionTitle>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => runSync("data")} disabled={syncing}
                className="flex items-center gap-2 rounded-lg gold-gradient px-4 py-2 text-sm font-semibold text-navy disabled:opacity-50">
                <Zap size={15} className={syncing ? "animate-pulse" : ""}/> Chạy Data Engine (Tin tức + Vĩ mô + Lịch)
              </button>
              <button onClick={() => runSync("stocks")} disabled={syncing}
                className="flex items-center gap-2 rounded-lg border border-gold/40 bg-gold/10 px-4 py-2 text-sm font-medium text-gold hover:bg-gold/20 disabled:opacity-50">
                <Server size={14}/> Đồng bộ giá cổ phiếu
              </button>
              <button onClick={load} disabled={loading}
                className="flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2 text-sm disabled:opacity-50">
                <RefreshCw size={14} className={loading ? "animate-spin" : ""}/> Tải lại trạng thái
              </button>
            </div>
            {syncMsg && (
              <div className="mt-3 rounded-lg border border-white/10 bg-white/[0.02] p-3 font-mono text-xs text-muted">
                {syncMsg}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

function MetricCard({ icon, label, value, good }: { icon: React.ReactNode; label: string; value: string | number; good?: boolean }) {
  return (
    <div className="glass rounded-xl p-3">
      <div className={`mb-1 flex items-center gap-1.5 text-xs ${good === true ? "text-emerald-400" : good === false ? "text-rose-400" : "text-gold"}`}>{icon} {label}</div>
      <div className="text-lg font-bold">{value}</div>
    </div>
  );
}

function QualityBadge({ score }: { score: number }) {
  const cls = score >= 70 ? "text-emerald-400" : score >= 40 ? "text-gold" : "text-rose-400";
  return <span className={`font-semibold ${cls}`}>{score}/100</span>;
}

function StatCard({ icon, label, value, small }: { icon: React.ReactNode; label: string; value: string; small?: boolean }) {
  return (
    <Card>
      <div className="mb-2 flex items-center gap-2 text-gold">{icon}<span className="text-xs font-semibold">{label}</span></div>
      <div className={small ? "text-sm font-bold" : "text-2xl font-bold"}>{value}</div>
    </Card>
  );
}
