import Link from "next/link";
import { formatPercent } from "@/lib/format";
import type { Stock } from "@/lib/types";

function heatColor(pct: number): string {
  if (pct >= 3) return "bg-emerald-600/80";
  if (pct >= 1.5) return "bg-emerald-600/55";
  if (pct > 0) return "bg-emerald-600/30";
  if (pct === 0) return "bg-slate-600/40";
  if (pct > -1.5) return "bg-rose-600/30";
  if (pct > -3) return "bg-rose-600/55";
  return "bg-rose-600/80";
}

export function Heatmap({ stocks }: { stocks: Stock[] }) {
  const sectors = Array.from(new Set(stocks.map((s) => s.sector)));
  return (
    <div className="space-y-4">
      {sectors.map((sec) => {
        const items = stocks.filter((s) => s.sector === sec);
        return (
          <div key={sec}>
            <div className="mb-1.5 text-xs font-semibold text-muted">{sec}</div>
            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 md:grid-cols-6">
              {items.map((s) => (
                <Link
                  key={s.symbol}
                  href={`/co-phieu/${s.symbol}`}
                  className={`flex flex-col items-center justify-center rounded-md p-2 text-center transition hover:ring-1 hover:ring-gold ${heatColor(s.changePct)}`}
                >
                  <span className="text-xs font-bold">{s.symbol}</span>
                  <span className="text-[10px] font-medium">{formatPercent(s.changePct)}</span>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
