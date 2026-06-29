"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Filter,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Database,
  Radio,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { PriceChange } from "./PriceChange";
import { Sparkline } from "./Sparkline";
import type { StockRecord } from "@/db/schema";
import { formatNumber, formatUsdCompact } from "@/lib/format";

const EXCHANGES = ["Tất cả", "HOSE", "HNX", "UPCOM"];
const SORT_OPTIONS = [
  { key: "symbol", label: "Mã" },
  { key: "name", label: "Tên" },
  { key: "price", label: "Giá" },
  { key: "changePct", label: "% thay đổi" },
  { key: "volume", label: "Khối lượng" },
  { key: "marketCap", label: "Vốn hóa" },
  { key: "pe", label: "P/E" },
];
const PER_PAGE = 40;

export function StockSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [exchange, setExchange] = useState("");
  const [sort, setSort] = useState("symbol");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [data, setData] = useState<StockRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ totalStocks: number; activeStocks: number; withPrice: number; lastSync: string | null } | null>(null);
  const [autocomplete, setAutocomplete] = useState<StockRecord[]>([]);
  const [acOpen, setAcOpen] = useState(false);
  const acRef = useRef<HTMLDivElement>(null);

  const fetchStocks = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (exchange) params.set("exchange", exchange);
    params.set("sort", sort);
    params.set("order", order);
    params.set("limit", String(PER_PAGE));
    params.set("offset", String(page * PER_PAGE));
    try {
      const res = await fetch(`/api/stocks/search?${params}`);
      const json = await res.json();
      if (json.ok) {
        setData(json.data);
        setTotal(json.total);
      }
    } catch { /* fallback */ }
    setLoading(false);
  }, [q, exchange, sort, order, page]);

  useEffect(() => { fetchStocks(); }, [fetchStocks]);

  useEffect(() => {
    fetch("/api/stocks/sync").then((r) => r.json()).then((d) => d.ok && setSyncStatus(d));
  }, []);

  // Autocomplete
  useEffect(() => {
    if (q.length < 1) { setAutocomplete([]); return; }
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/stocks/search?q=${encodeURIComponent(q)}&limit=8`);
      const json = await res.json();
      if (json.ok) { setAutocomplete(json.data); setAcOpen(true); }
    }, 200);
    return () => clearTimeout(timer);
  }, [q]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (acRef.current && !acRef.current.contains(e.target as Node)) setAcOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const doSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/stocks/sync", { method: "POST" });
      const json = await res.json();
      if (json.ok) { setSyncStatus(json.status); fetchStocks(); }
    } catch { /* */ }
    setSyncing(false);
  };

  const toggleSort = (key: string) => {
    if (sort === key) setOrder((o) => o === "asc" ? "desc" : "asc");
    else { setSort(key); setOrder("asc"); }
    setPage(0);
  };

  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <div className="space-y-4">
      {/* Sync status */}
      <div className="flex flex-wrap items-center gap-3">
        {syncStatus && (
          <span className="inline-flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5 text-xs text-muted">
            <Database size={13} />
            {syncStatus.totalStocks.toLocaleString("vi-VN")} mã • {syncStatus.activeStocks.toLocaleString("vi-VN")} đang giao dịch • {syncStatus.withPrice.toLocaleString("vi-VN")} có giá
            {syncStatus.lastSync && <span>• Cập nhật: {new Date(syncStatus.lastSync).toLocaleString("vi-VN")}</span>}
          </span>
        )}
        {syncStatus && syncStatus.withPrice > 0 && (
          <span className="flex items-center gap-1 text-[11px] text-emerald-400"><Radio size={11} className="animate-pulse" /> Dữ liệu thời gian thực</span>
        )}
        <button onClick={doSync} disabled={syncing} className="ml-auto flex items-center gap-1.5 rounded-lg border border-gold/40 bg-gold/10 px-3 py-1.5 text-xs font-medium text-gold hover:bg-gold/20 disabled:opacity-50">
          <RefreshCw size={13} className={syncing ? "animate-spin" : ""} />
          {syncing ? "Đang đồng bộ..." : "Đồng bộ ngay"}
        </button>
      </div>

      {/* Search bar + filters */}
      <div className="glass rounded-xl p-4">
        <div className="flex flex-wrap gap-3">
          <div ref={acRef} className="relative flex-1">
            <div className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-2.5">
              <Search size={16} className="text-muted" />
              <input
                value={q}
                onChange={(e) => { setQ(e.target.value); setPage(0); }}
                onFocus={() => q.length > 0 && setAcOpen(true)}
                placeholder="Tìm theo mã, tên doanh nghiệp, ngành, sàn... (hỗ trợ fuzzy search)"
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
              />
              {q && <button onClick={() => { setQ(""); setAcOpen(false); }}><X size={14} className="text-muted hover:text-white" /></button>}
            </div>
            {acOpen && autocomplete.length > 0 && (
              <div className="glass-strong absolute z-50 mt-2 w-full overflow-hidden rounded-lg">
                {autocomplete.map((s) => (
                  <button key={s.symbol} onClick={() => { router.push(`/co-phieu/${s.symbol}`); setAcOpen(false); }} className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm hover:bg-white/10">
                    <div>
                      <span className="font-bold text-gold">{s.symbol}</span>
                      <span className="ml-2 text-xs text-muted">{s.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="rounded bg-white/10 px-1.5 py-0.5">{s.exchange}</span>
                      {s.price ? <span>{formatNumber(s.price)}</span> : null}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-1">
            {EXCHANGES.map((ex) => (
              <button key={ex} onClick={() => { setExchange(ex === "Tất cả" ? "" : ex); setPage(0); }} className={`rounded-lg px-3 py-2 text-xs font-medium transition ${(ex === "Tất cả" ? !exchange : exchange === ex) ? "gold-gradient text-navy" : "text-muted hover:bg-white/5"}`}>{ex}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Results table */}
      <div className="glass overflow-hidden rounded-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted">
                {SORT_OPTIONS.map((col) => (
                  <th key={col.key} className="whitespace-nowrap px-3 py-2.5">
                    <button onClick={() => toggleSort(col.key)} className={`inline-flex items-center gap-1 hover:text-gold ${sort === col.key ? "text-gold" : ""}`}>
                      {col.label} <ArrowUpDown size={11} />
                    </button>
                  </th>
                ))}
                <th className="px-3 py-2.5">Sàn</th>
                <th className="px-3 py-2.5 text-right">RSI</th>
                <th className="px-3 py-2.5 text-right">MACD</th>
                <th className="px-3 py-2.5">Nguồn</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="px-3 py-8 text-center text-muted"><Loader2 size={20} className="mx-auto animate-spin" /></td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={10} className="px-3 py-8 text-center text-muted">
                  {(syncStatus?.totalStocks ?? 0) === 0
                    ? 'Chưa có dữ liệu. Nhấn "Đồng bộ ngay" để tải danh sách cổ phiếu.'
                    : "Không tìm thấy kết quả phù hợp."}
                </td></tr>
              ) : data.map((s) => (
                <tr key={s.symbol} onClick={() => router.push(`/co-phieu/${s.symbol}`)} className="cursor-pointer border-b border-white/5 transition hover:bg-white/5">
                  <td className="px-3 py-2.5 font-bold text-gold">{s.symbol}</td>
                  <td className="max-w-[200px] truncate px-3 py-2.5 text-muted">{s.name}</td>
                  <td className="px-3 py-2.5 tabular-nums">{s.price ? formatNumber(s.price) : "—"}</td>
                  <td className="px-3 py-2.5">{s.price ? <PriceChange change={s.change ?? 0} pct={s.changePct ?? 0} showIcon={false} /> : "—"}</td>
                  <td className="px-3 py-2.5 tabular-nums text-right">{s.volume ? formatNumber(s.volume, 0) : "—"}</td>
                  <td className="px-3 py-2.5 tabular-nums text-right">{s.marketCap ? formatUsdCompact(s.marketCap) : "—"}</td>
                  <td className="px-3 py-2.5 tabular-nums text-right">{s.pe ? formatNumber(s.pe, 1) : "—"}</td>
                  <td className="px-3 py-2.5"><span className="rounded bg-white/10 px-1.5 py-0.5 text-xs">{s.exchange}</span></td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{s.rsi !== 50 ? formatNumber(s.rsi ?? 50, 1) : "—"}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{s.macd ? formatNumber(s.macd, 3) : "—"}</td>
                  <td className="px-3 py-2.5 text-[10px] text-muted">{s.dataSource ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-3 py-2.5 text-xs text-muted">
            <span>{total.toLocaleString("vi-VN")} mã cổ phiếu • Trang {page + 1}/{totalPages}</span>
            <div className="flex gap-1">
              <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="rounded-md border border-white/10 p-1.5 hover:text-gold disabled:opacity-30"><ChevronLeft size={14} /></button>
              <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1} className="rounded-md border border-white/10 p-1.5 hover:text-gold disabled:opacity-30"><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
