"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpDown, FileDown, FileSpreadsheet, FileText, Search } from "lucide-react";

export interface Column<T> {
  key: string;
  label: string;
  numeric?: boolean;
  render?: (row: T) => React.ReactNode;
  value: (row: T) => string | number;
}

export function DataTable<T>({
  columns,
  rows,
  getHref,
  searchValue,
  exportName = "du-lieu",
  filters,
}: {
  columns: Column<T>[];
  rows: T[];
  getHref?: (row: T) => string;
  searchValue: (row: T) => string;
  exportName?: string;
  filters?: { label: string; predicate: (row: T) => boolean }[];
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [asc, setAsc] = useState(false);
  const [activeFilter, setActiveFilter] = useState<number | null>(null);

  const data = useMemo(() => {
    let d = rows;
    if (q) d = d.filter((r) => searchValue(r).toLowerCase().includes(q.toLowerCase()));
    if (activeFilter != null && filters) d = d.filter(filters[activeFilter].predicate);
    if (sortKey) {
      const col = columns.find((c) => c.key === sortKey);
      if (col) {
        d = [...d].sort((a, b) => {
          const va = col.value(a);
          const vb = col.value(b);
          if (typeof va === "number" && typeof vb === "number") return asc ? va - vb : vb - va;
          return asc ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
        });
      }
    }
    return d;
  }, [rows, q, sortKey, asc, activeFilter, columns, filters, searchValue]);

  const toggleSort = (key: string) => {
    if (sortKey === key) setAsc((v) => !v);
    else {
      setSortKey(key);
      setAsc(false);
    }
  };

  const exportCSV = () => {
    const header = columns.map((c) => c.label).join(",");
    const lines = data.map((r) => columns.map((c) => `"${c.value(r)}"`).join(","));
    download(`${exportName}.csv`, [header, ...lines].join("\n"), "text/csv;charset=utf-8");
  };
  const exportExcel = () => {
    const head = columns.map((c) => `<th>${c.label}</th>`).join("");
    const body = data
      .map((r) => `<tr>${columns.map((c) => `<td>${c.value(r)}</td>`).join("")}</tr>`)
      .join("");
    const html = `<html><head><meta charset="utf-8"></head><body><table border="1"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></body></html>`;
    download(`${exportName}.xls`, html, "application/vnd.ms-excel");
  };

  return (
    <div className="glass overflow-hidden rounded-xl">
      <div className="flex flex-wrap items-center gap-2 border-b p-3">
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5">
          <Search size={14} className="text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm kiếm..."
            className="w-40 bg-transparent text-sm outline-none placeholder:text-muted"
          />
        </div>
        {filters && (
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setActiveFilter(null)}
              className={`rounded-full px-2.5 py-1 text-[11px] ${activeFilter == null ? "gold-gradient text-navy" : "text-muted hover:bg-white/5"}`}
            >
              Tất cả
            </button>
            {filters.map((f, i) => (
              <button
                key={f.label}
                onClick={() => setActiveFilter(i)}
                className={`rounded-full px-2.5 py-1 text-[11px] ${activeFilter === i ? "gold-gradient text-navy" : "text-muted hover:bg-white/5"}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
        <div className="ml-auto flex gap-1.5">
          <button onClick={exportCSV} className="flex items-center gap-1 rounded-md border border-white/10 px-2.5 py-1.5 text-[11px] text-muted hover:text-gold">
            <FileDown size={13} /> CSV
          </button>
          <button onClick={exportExcel} className="flex items-center gap-1 rounded-md border border-white/10 px-2.5 py-1.5 text-[11px] text-muted hover:text-gold">
            <FileSpreadsheet size={13} /> Excel
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-1 rounded-md border border-white/10 px-2.5 py-1.5 text-[11px] text-muted hover:text-gold">
            <FileText size={13} /> PDF
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-muted">
              {columns.map((c) => (
                <th key={c.key} className={`whitespace-nowrap px-3 py-2.5 ${c.numeric ? "text-right" : ""}`}>
                  <button onClick={() => toggleSort(c.key)} className={`inline-flex items-center gap-1 hover:text-gold ${c.numeric ? "flex-row-reverse" : ""}`}>
                    {c.label}
                    <ArrowUpDown size={11} className={sortKey === c.key ? "text-gold" : "opacity-40"} />
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((r, i) => (
              <tr
                key={i}
                onClick={() => getHref && router.push(getHref(r))}
                className={`border-b border-white/5 transition hover:bg-white/5 ${getHref ? "cursor-pointer" : ""}`}
              >
                {columns.map((c) => (
                  <td key={c.key} className={`whitespace-nowrap px-3 py-2.5 ${c.numeric ? "text-right tabular-nums" : ""}`}>
                    {c.render ? c.render(r) : String(c.value(r))}
                  </td>
                ))}
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-3 py-8 text-center text-muted">
                  Không tìm thấy dữ liệu phù hợp.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function download(filename: string, content: string, type: string) {
  const blob = new Blob(["\ufeff" + content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
