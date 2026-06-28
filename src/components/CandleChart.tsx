"use client";
import { useEffect, useMemo, useState } from "react";
import { makeCandles } from "@/lib/market-data";
import { Maximize2, X, Radio, Database, Loader2 } from "lucide-react";
import type { Candle } from "@/lib/types";

const TIMEFRAMES = ["1 phút", "5 phút", "15 phút", "1 giờ", "4 giờ", "1 ngày", "1 tuần", "1 tháng"];
const INDICATORS = ["EMA", "SMA", "VWAP", "Bollinger Bands", "RSI", "MACD"] as const;
type Indicator = (typeof INDICATORS)[number];

function sma(data: number[], n: number): (number | null)[] {
  return data.map((_, i) =>
    i < n - 1 ? null : data.slice(i - n + 1, i + 1).reduce((a, b) => a + b, 0) / n,
  );
}

export function CandleChart({
  seed,
  base,
  height = 380,
  symbol,
}: {
  seed: string;
  base: number;
  height?: number;
  symbol?: string;
}) {
  const [tf, setTf] = useState("1 ngày");
  const [active, setActive] = useState<Set<Indicator>>(new Set(["EMA", "SMA"]));
  const [full, setFull] = useState(false);

  const fallback = useMemo(() => makeCandles(seed + tf, base, 80, 0.02), [seed, tf, base]);
  const [candles, setCandles] = useState<Candle[]>(fallback);
  const [live, setLive] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const sym = symbol ?? seed;
    let cancelled = false;
    setLoading(true);
    setCandles(fallback);
    fetch(`/api/history?symbol=${encodeURIComponent(sym)}&tf=${encodeURIComponent(tf)}&base=${base}`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        if (json.ok && Array.isArray(json.candles) && json.candles.length > 5) {
          setCandles(json.candles);
          setLive(Boolean(json.live));
        } else {
          setLive(false);
        }
      })
      .catch(() => !cancelled && setLive(false))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [symbol, seed, tf, base, fallback]);

  const toggle = (ind: Indicator) =>
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(ind)) next.delete(ind);
      else next.add(ind);
      return next;
    });

  const chart = (h: number) => <ChartCanvas candles={candles} height={h} active={active} />;

  return (
    <div className="glass rounded-xl p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1">
          {TIMEFRAMES.map((t) => (
            <button
              key={t}
              onClick={() => setTf(t)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                tf === t ? "gold-gradient text-navy" : "text-muted hover:bg-white/5"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {loading ? (
            <span className="flex items-center gap-1 text-[11px] text-muted"><Loader2 size={12} className="animate-spin" /> Đang tải...</span>
          ) : live ? (
            <span className="flex items-center gap-1 text-[11px] text-emerald-400"><Radio size={11} className="animate-pulse" /> Thời gian thực</span>
          ) : (
            <span className="flex items-center gap-1 text-[11px] text-muted"><Database size={11} /> Mô phỏng</span>
          )}
          <button
            onClick={() => setFull(true)}
            className="flex items-center gap-1.5 rounded-md border border-white/10 px-2.5 py-1 text-xs text-muted hover:text-gold"
          >
            <Maximize2 size={13} /> Toàn màn hình
          </button>
        </div>
      </div>
      <div className="mb-3 flex flex-wrap gap-1.5">
        {INDICATORS.map((ind) => (
          <button
            key={ind}
            onClick={() => toggle(ind)}
            className={`rounded-full border px-2.5 py-0.5 text-[11px] transition ${
              active.has(ind)
                ? "border-gold/50 bg-gold/15 text-gold"
                : "border-white/10 text-muted hover:text-white"
            }`}
          >
            {ind}
          </button>
        ))}
      </div>
      {chart(height)}

      {full && (
        <div className="fixed inset-0 z-50 flex flex-col bg-navy-deep/95 p-6 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold">Biểu đồ kỹ thuật — {tf}</h3>
            <button onClick={() => setFull(false)} className="rounded-md p-2 hover:bg-white/10">
              <X size={20} />
            </button>
          </div>
          <div className="flex-1">{chart(typeof window !== "undefined" ? window.innerHeight - 160 : 600)}</div>
        </div>
      )}
    </div>
  );
}

function ChartCanvas({
  candles,
  height,
  active,
}: {
  candles: Candle[];
  height: number;
  active: Set<Indicator>;
}) {
  const W = 900;
  const showRsi = active.has("RSI");
  const showMacd = active.has("MACD");
  const subCount = (showRsi ? 1 : 0) + (showMacd ? 1 : 0);
  const subH = 70;
  const volH = 60;
  const priceH = height - volH - subCount * subH - 20;

  const closes = candles.map((c) => c.c);
  const highs = candles.map((c) => c.h);
  const lows = candles.map((c) => c.l);
  const max = Math.max(...highs);
  const min = Math.min(...lows);
  const range = max - min || 1;
  const n = candles.length;
  const cw = W / n;
  const bw = cw * 0.6;

  const yPrice = (v: number) => 10 + (1 - (v - min) / range) * priceH;

  const ema = sma(closes, 9);
  const smaArr = sma(closes, 20);
  const linePath = (arr: (number | null)[], color: string) => {
    let d = "";
    arr.forEach((v, i) => {
      if (v == null) return;
      const x = i * cw + cw / 2;
      const y = yPrice(v);
      d += `${d ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`;
    });
    return <path d={d} fill="none" stroke={color} strokeWidth="1.4" />;
  };

  // Bollinger
  let bbUpper = "";
  let bbLower = "";
  if (active.has("Bollinger Bands")) {
    const m = sma(closes, 20);
    closes.forEach((_, i) => {
      if (i < 19) return;
      const slice = closes.slice(i - 19, i + 1);
      const mean = m[i]!;
      const sd = Math.sqrt(slice.reduce((a, b) => a + (b - mean) ** 2, 0) / 20);
      const x = i * cw + cw / 2;
      bbUpper += `${bbUpper ? "L" : "M"}${x.toFixed(1)},${yPrice(mean + 2 * sd).toFixed(1)}`;
      bbLower += `${bbLower ? "L" : "M"}${x.toFixed(1)},${yPrice(mean - 2 * sd).toFixed(1)}`;
    });
  }

  const maxVol = Math.max(...candles.map((c) => c.v));
  const volTop = priceH + 25;

  return (
    <svg viewBox={`0 0 ${W} ${height}`} width="100%" height={height} preserveAspectRatio="none">
      {[0.25, 0.5, 0.75].map((g) => (
        <line key={g} x1={0} x2={W} y1={10 + g * priceH} y2={10 + g * priceH} stroke="rgba(255,255,255,0.05)" />
      ))}
      {candles.map((c, i) => {
        const x = i * cw + cw / 2;
        const up = c.c >= c.o;
        const color = up ? "#34d399" : "#fb7185";
        return (
          <g key={i}>
            <line x1={x} x2={x} y1={yPrice(c.h)} y2={yPrice(c.l)} stroke={color} strokeWidth="1" />
            <rect
              x={x - bw / 2}
              y={yPrice(Math.max(c.o, c.c))}
              width={bw}
              height={Math.max(1, Math.abs(yPrice(c.o) - yPrice(c.c)))}
              fill={color}
            />
          </g>
        );
      })}
      {active.has("EMA") && linePath(ema, "#f5c542")}
      {active.has("SMA") && linePath(smaArr, "#60a5fa")}
      {active.has("VWAP") && linePath(sma(closes, 14), "#c084fc")}
      {active.has("Bollinger Bands") && (
        <>
          <path d={bbUpper} fill="none" stroke="rgba(96,165,250,0.5)" strokeWidth="1" strokeDasharray="3 3" />
          <path d={bbLower} fill="none" stroke="rgba(96,165,250,0.5)" strokeWidth="1" strokeDasharray="3 3" />
        </>
      )}
      {/* Volume */}
      {candles.map((c, i) => {
        const x = i * cw + cw / 2;
        const up = c.c >= c.o;
        const h = (c.v / maxVol) * volH;
        return (
          <rect
            key={`v${i}`}
            x={x - bw / 2}
            y={volTop + (volH - h)}
            width={bw}
            height={h}
            fill={up ? "rgba(52,211,153,0.35)" : "rgba(251,113,133,0.35)"}
          />
        );
      })}
      {showRsi && (
        <RsiPanel closes={closes} cw={cw} W={W} top={volTop + volH + 12} h={subH - 12} />
      )}
      {showMacd && (
        <MacdPanel closes={closes} cw={cw} top={volTop + volH + 12 + (showRsi ? subH : 0)} h={subH - 12} />
      )}
    </svg>
  );
}

function RsiPanel({ closes, cw, W, top, h }: { closes: number[]; cw: number; W: number; top: number; h: number }) {
  const rsi: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (i < 14) {
      rsi.push(50);
      continue;
    }
    let gain = 0;
    let loss = 0;
    for (let j = i - 13; j <= i; j++) {
      const d = closes[j] - closes[j - 1];
      if (d >= 0) gain += d;
      else loss -= d;
    }
    const rs = loss === 0 ? 100 : gain / loss;
    rsi.push(100 - 100 / (1 + rs));
  }
  const y = (v: number) => top + (1 - v / 100) * h;
  const d = rsi.map((v, i) => `${i === 0 ? "M" : "L"}${(i * cw + cw / 2).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  return (
    <g>
      <line x1={0} x2={W} y1={y(70)} y2={y(70)} stroke="rgba(251,113,133,0.3)" strokeDasharray="3 3" />
      <line x1={0} x2={W} y1={y(30)} y2={y(30)} stroke="rgba(52,211,153,0.3)" strokeDasharray="3 3" />
      <path d={d} fill="none" stroke="#f5c542" strokeWidth="1.3" />
      <text x={4} y={top + 10} fill="#9fb2d4" fontSize="10">RSI (14)</text>
    </g>
  );
}

function MacdPanel({ closes, cw, top, h }: { closes: number[]; cw: number; top: number; h: number }) {
  const ema = (period: number) => {
    const k = 2 / (period + 1);
    const out: number[] = [];
    closes.forEach((c, i) => out.push(i === 0 ? c : c * k + out[i - 1] * (1 - k)));
    return out;
  };
  const e12 = ema(12);
  const e26 = ema(26);
  const macd = e12.map((v, i) => v - e26[i]);
  const maxAbs = Math.max(...macd.map((v) => Math.abs(v))) || 1;
  const mid = top + h / 2;
  return (
    <g>
      <line x1={0} x2={900} y1={mid} y2={mid} stroke="rgba(255,255,255,0.08)" />
      {macd.map((v, i) => {
        const bh = (Math.abs(v) / maxAbs) * (h / 2);
        return (
          <rect
            key={i}
            x={i * cw + cw / 2 - cw * 0.3}
            y={v >= 0 ? mid - bh : mid}
            width={cw * 0.6}
            height={bh}
            fill={v >= 0 ? "rgba(52,211,153,0.6)" : "rgba(251,113,133,0.6)"}
          />
        );
      })}
      <text x={4} y={top + 10} fill="#9fb2d4" fontSize="10">MACD</text>
    </g>
  );
}
