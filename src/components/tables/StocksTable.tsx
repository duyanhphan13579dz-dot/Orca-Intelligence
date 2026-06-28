"use client";
import { DataTable, type Column } from "@/components/DataTable";
import { PriceChange } from "@/components/PriceChange";
import { Sparkline } from "@/components/Sparkline";
import { formatNumber, formatUsdCompact, colorOf } from "@/lib/format";
import type { Stock } from "@/lib/types";

export function StocksTable({ rows }: { rows: Stock[] }) {
  const columns: Column<Stock>[] = [
    { key: "symbol", label: "Mã", value: (r) => r.symbol, render: (r) => <span className="font-bold text-gold">{r.symbol}</span> },
    { key: "name", label: "Tên", value: (r) => r.name, render: (r) => <span className="text-muted">{r.name}</span> },
    { key: "exchange", label: "Sàn", value: (r) => r.exchange },
    { key: "price", label: "Giá", numeric: true, value: (r) => r.price, render: (r) => formatNumber(r.price) },
    { key: "changePct", label: "%", numeric: true, value: (r) => r.changePct, render: (r) => <PriceChange change={r.change} pct={r.changePct} showIcon={false} /> },
    { key: "chart", label: "Biểu đồ", value: () => "", render: (r) => <span className="inline-flex"><Sparkline data={r.series} width={70} height={24} positive={r.changePct >= 0} /></span> },
    { key: "volume", label: "Khối lượng", numeric: true, value: (r) => r.volume, render: (r) => formatNumber(r.volume, 0) },
    { key: "marketCap", label: "Vốn hóa", numeric: true, value: (r) => r.marketCap, render: (r) => formatUsdCompact(r.marketCap) },
    { key: "pe", label: "P/E", numeric: true, value: (r) => r.pe },
    { key: "eps", label: "EPS", numeric: true, value: (r) => r.eps },
    { key: "roe", label: "ROE", numeric: true, value: (r) => r.roe, render: (r) => `${r.roe}%` },
    { key: "beta", label: "Beta", numeric: true, value: (r) => r.beta },
    { key: "rsi", label: "RSI", numeric: true, value: (r) => r.rsi, render: (r) => <span className={r.rsi > 70 ? "text-rose-400" : r.rsi < 30 ? "text-emerald-400" : ""}>{r.rsi}</span> },
    { key: "macd", label: "MACD", numeric: true, value: (r) => r.macd, render: (r) => <span className={colorOf(r.macd)}>{r.macd}</span> },
    { key: "ma20", label: "MA20", numeric: true, value: (r) => r.ma20 },
    { key: "ma50", label: "MA50", numeric: true, value: (r) => r.ma50 },
    { key: "ma200", label: "MA200", numeric: true, value: (r) => r.ma200 },
  ];

  const sectors = Array.from(new Set(rows.map((r) => r.sector)));
  const filters = [
    { label: "HOSE", predicate: (r: Stock) => r.exchange === "HOSE" },
    { label: "HNX", predicate: (r: Stock) => r.exchange === "HNX" },
    { label: "UPCOM", predicate: (r: Stock) => r.exchange === "UPCOM" },
    ...sectors.slice(0, 6).map((s) => ({ label: s, predicate: (r: Stock) => r.sector === s })),
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      getHref={(r) => `/co-phieu/${r.symbol}`}
      searchValue={(r) => `${r.symbol} ${r.name}`}
      exportName="co-phieu-orca"
      filters={filters}
    />
  );
}
