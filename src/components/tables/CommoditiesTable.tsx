"use client";
import { DataTable, type Column } from "@/components/DataTable";
import { PriceChange } from "@/components/PriceChange";
import { Sparkline } from "@/components/Sparkline";
import { formatNumber } from "@/lib/format";
import type { Commodity } from "@/lib/types";

export function CommoditiesTable({ rows }: { rows: Commodity[] }) {
  const columns: Column<Commodity>[] = [
    { key: "icon", label: "", value: () => "", render: (r) => <span className="text-lg">{r.icon}</span> },
    { key: "name", label: "Mặt hàng", value: (r) => r.name, render: (r) => <span className="font-semibold">{r.name}</span> },
    { key: "category", label: "Nhóm", value: (r) => r.category },
    { key: "price", label: "Giá hiện tại", numeric: true, value: (r) => r.price, render: (r) => formatNumber(r.price) },
    { key: "unit", label: "Đơn vị", value: (r) => r.unit ?? "" },
    { key: "open", label: "Mở cửa", numeric: true, value: (r) => r.open, render: (r) => formatNumber(r.open) },
    { key: "high", label: "Cao nhất", numeric: true, value: (r) => r.high, render: (r) => formatNumber(r.high) },
    { key: "low", label: "Thấp nhất", numeric: true, value: (r) => r.low, render: (r) => formatNumber(r.low) },
    { key: "prevClose", label: "Đóng cửa", numeric: true, value: (r) => r.prevClose, render: (r) => formatNumber(r.prevClose) },
    { key: "change", label: "Chênh lệch", numeric: true, value: (r) => r.change, render: (r) => formatNumber(r.change) },
    { key: "changePct", label: "% thay đổi", numeric: true, value: (r) => r.changePct, render: (r) => <PriceChange change={r.change} pct={r.changePct} showIcon={false} /> },
    { key: "chart", label: "Biểu đồ", value: () => "", render: (r) => <span className="inline-flex"><Sparkline data={r.series} width={70} height={24} positive={r.changePct >= 0} /></span> },
  ];

  const filters = [
    { label: "Việt Nam", predicate: (r: Commodity) => r.region === "vn" },
    { label: "Quốc tế", predicate: (r: Commodity) => r.region === "world" },
    { label: "Kim loại", predicate: (r: Commodity) => r.category === "Kim loại" },
    { label: "Năng lượng", predicate: (r: Commodity) => r.category === "Năng lượng" },
    { label: "Nông sản", predicate: (r: Commodity) => r.category === "Nông sản" },
    { label: "Phân bón", predicate: (r: Commodity) => r.category === "Phân bón" },
    { label: "Cà phê", predicate: (r: Commodity) => r.category === "Cà phê" },
    { label: "Cao su", predicate: (r: Commodity) => r.category === "Cao su" },
    { label: "Chăn nuôi", predicate: (r: Commodity) => r.category === "Chăn nuôi" },
    { label: "Thủy sản", predicate: (r: Commodity) => r.category === "Thủy sản" },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      getHref={(r) => `/hang-hoa/${r.slug}`}
      searchValue={(r) => `${r.name} ${r.category}`}
      exportName="hang-hoa-orca"
      filters={filters}
    />
  );
}
