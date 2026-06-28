"use client";
import { DataTable, type Column } from "@/components/DataTable";
import { PriceChange } from "@/components/PriceChange";
import { Sparkline } from "@/components/Sparkline";
import { formatNumber } from "@/lib/format";
import type { Quote } from "@/lib/types";

export function QuoteTable({
  rows,
  getHref,
  digits = 2,
  exportName = "du-lieu",
}: {
  rows: Quote[];
  getHref?: (r: Quote) => string;
  digits?: number;
  exportName?: string;
}) {
  const columns: Column<Quote>[] = [
    { key: "symbol", label: "Mã", value: (r) => r.symbol, render: (r) => <span className="font-bold text-gold">{r.symbol}</span> },
    { key: "name", label: "Tên", value: (r) => r.name, render: (r) => <span className="text-muted">{r.name}</span> },
    { key: "price", label: "Giá", numeric: true, value: (r) => r.price, render: (r) => formatNumber(r.price, digits) },
    { key: "open", label: "Mở cửa", numeric: true, value: (r) => r.open, render: (r) => formatNumber(r.open, digits) },
    { key: "high", label: "Cao nhất", numeric: true, value: (r) => r.high, render: (r) => formatNumber(r.high, digits) },
    { key: "low", label: "Thấp nhất", numeric: true, value: (r) => r.low, render: (r) => formatNumber(r.low, digits) },
    { key: "changePct", label: "% thay đổi", numeric: true, value: (r) => r.changePct, render: (r) => <PriceChange change={r.change} pct={r.changePct} digits={digits} showIcon={false} /> },
    { key: "chart", label: "Biểu đồ", value: () => "", render: (r) => <span className="inline-flex"><Sparkline data={r.series} width={80} height={26} positive={r.changePct >= 0} /></span> },
  ];
  return (
    <DataTable columns={columns} rows={rows} getHref={getHref} searchValue={(r) => `${r.symbol} ${r.name}`} exportName={exportName} />
  );
}
