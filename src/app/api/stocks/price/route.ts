import { db } from "@/db";
import { stocks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { fetchOHLCV } from "@/lib/vndirect";

export const dynamic = "force-dynamic";

/**
 * GET /api/stocks/price?symbol=VCB
 * Fetches real-time price for a single stock and updates DB.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbol = (searchParams.get("symbol") ?? "").toUpperCase();
  if (!symbol) return Response.json({ ok: false, error: "Missing symbol" }, { status: 400 });

  try {
    // 1. Fetch candles from VNDirect
    const candles = await fetchOHLCV(symbol, "D", 300);
    if (!candles || candles.length < 2) {
      // Return existing DB data if VNDirect fails
      const existing = await db.select().from(stocks).where(eq(stocks.symbol, symbol)).limit(1);
      if (existing.length > 0) return Response.json({ ok: true, data: existing[0], live: false });
      return Response.json({ ok: false, error: "No data" }, { status: 404 });
    }

    const closes = candles.map((c) => c.c);
    const last = candles[candles.length - 1];
    const prev = candles[candles.length - 2];
    const price = last.c;
    const change = Number((price - prev.c).toFixed(2));
    const changePct = prev.c ? Number(((change / prev.c) * 100).toFixed(2)) : 0;

    // Technical indicators
    const rsi = rsi14(closes);
    const macd = macdCalc(closes);
    const ma20 = maCalc(closes, 20);
    const ma50 = maCalc(closes, 50);
    const ma200 = maCalc(closes, Math.min(200, closes.length));
    const high52 = Math.max(...closes.slice(-252));
    const low52 = Math.min(...closes.slice(-252));

    // 2. Upsert into DB
    const existing = await db.select({ id: stocks.id }).from(stocks).where(eq(stocks.symbol, symbol));
    const updateData = {
      price,
      open: last.o,
      high: last.h,
      low: last.l,
      prevClose: prev.c,
      change,
      changePct,
      volume: last.v,
      rsi,
      macd,
      ma20,
      ma50,
      ma200,
      high52w: high52,
      low52w: low52,
      dataSource: "VNDirect",
      priceUpdatedAt: new Date(),
      updatedAt: new Date(),
    };

    if (existing.length > 0) {
      await db.update(stocks).set(updateData).where(eq(stocks.symbol, symbol));
    } else {
      await db.insert(stocks).values({
        symbol,
        name: symbol,
        exchange: "HOSE",
        ...updateData,
      });
    }

    const row = await db.select().from(stocks).where(eq(stocks.symbol, symbol)).limit(1);
    return Response.json({ ok: true, data: row[0], live: true, candles: candles.length }, {
      headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=300" },
    });
  } catch (e) {
    return Response.json({ ok: false, error: e instanceof Error ? e.message : "Error" }, { status: 500 });
  }
}

function rsi14(closes: number[]): number {
  if (closes.length < 15) return 50;
  let gain = 0, loss = 0;
  for (let i = closes.length - 14; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    if (d >= 0) gain += d; else loss -= d;
  }
  const rs = loss === 0 ? 100 : gain / loss;
  return Number((100 - 100 / (1 + rs)).toFixed(1));
}

function macdCalc(closes: number[]): number {
  if (closes.length < 26) return 0;
  const ema = (period: number) => {
    const k = 2 / (period + 1);
    const out: number[] = [];
    closes.forEach((c, i) => out.push(i === 0 ? c : c * k + out[i - 1] * (1 - k)));
    return out;
  };
  const e12 = ema(12), e26 = ema(26);
  return Number((e12[e12.length - 1] - e26[e26.length - 1]).toFixed(3));
}

function maCalc(closes: number[], n: number): number {
  const sl = closes.slice(-n);
  return Number((sl.reduce((a, b) => a + b, 0) / sl.length).toFixed(2));
}
