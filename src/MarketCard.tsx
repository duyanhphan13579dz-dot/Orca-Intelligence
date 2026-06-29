import Link from "next/link";
import { Sparkline } from "./Sparkline";
import { PriceChange } from "./PriceChange";
import { formatNumber } from "@/lib/format";
import type { Quote } from "@/lib/types";

export function MarketCard({
  quote,
  href,
  digits = 2,
}: {
  quote: Quote;
  href?: string;
  digits?: number;
}) {
  const body = (
    <div className="glass group h-full rounded-xl p-4 transition hover:border-gold/40 hover:gold-glow">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-bold tracking-wide">{quote.symbol}</div>
          <div className="text-[11px] text-muted line-clamp-1">{quote.name}</div>
        </div>
        <Sparkline data={quote.series} positive={quote.changePct >= 0} />
      </div>
      <div className="mt-3 flex items-end justify-between">
        <div className="text-xl font-bold">{formatNumber(quote.price, digits)}</div>
        <PriceChange change={quote.change} pct={quote.changePct} digits={digits} />
      </div>
      {quote.unit && <div className="mt-1 text-[10px] text-muted">{quote.unit}</div>}
    </div>
  );
  if (href) return <Link href={href}>{body}</Link>;
  return body;
}
