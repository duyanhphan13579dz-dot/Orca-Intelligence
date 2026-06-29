import { formatChange, formatPercent, bgOf } from "@/lib/format";
import { TrendingUp, TrendingDown } from "lucide-react";

export function PriceChange({
  change,
  pct,
  digits = 2,
  showIcon = true,
}: {
  change: number;
  pct: number;
  digits?: number;
  showIcon?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${bgOf(pct)}`}
    >
      {showIcon &&
        (pct >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />)}
      {formatChange(change, digits)} ({formatPercent(pct)})
    </span>
  );
}
