import { db } from "@/db";
import { stocks } from "@/db/schema";
import { eq, sql, inArray } from "drizzle-orm";

const WIFEED_URL = "https://wifeed.vn/api/thong-tin-co-phieu/danh-sach-ma-chung-khoan";
const VNDIRECT_URL = "https://dchart-api.vndirect.com.vn/dchart/history";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
const VALID_EXCHANGES = new Set(["HOSE", "HNX", "UPCOM"]);

interface WifeedStock {
  code: string;
  fullname_vi: string;
  san: string;
  loaidn: number;
  updated_at: string;
}

// Lấy danh sách toàn bộ mã cổ phiếu từ WiGroup/Wifeed
async function fetchListing(): Promise<WifeedStock[]> {
  const res = await fetch(WIFEED_URL, {
    headers: { Accept: "*/*", "User-Agent": UA },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Wifeed listing: ${res.status}`);
  const json = await res.json();
  return (json.data ?? []) as WifeedStock[];
}

// Lấy giá mới nhất từ VNDirect dchart
async function fetchPrice(symbol: string): Promise<{
  price: number; open: number; high: number; low: number; prevClose: number;
  volume: number; closes: number[];
} | null> {
  try {
    const from = Math.floor(Date.now() / 1000) - 300 * 86400;
    const to = Math.floor(Date.now() / 1000);
    const url = `${VNDIRECT_URL}?resolution=D&symbol=${symbol}&from=${from}&to=${to}`;
    const res = await fetch(url, {
      headers: { Accept: "*/*", "User-Agent": UA },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const d = await res.json();
    if (d.s !== "ok" || !d.c || d.c.length < 2) return null;
    const n = d.c.length;
    return {
      price: d.c[n - 1],
      open: d.o[n - 1],
      high: d.h[n - 1],
      low: d.l[n - 1],
      prevClose: d.c[n - 2],
      volume: d.v[n - 1],
      closes: d.c,
    };
  } catch {
    return null;
  }
}

// Tính RSI(14) từ mảng close
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

function macdVal(closes: number[]): number {
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

function ma(closes: number[], n: number): number {
  const sl = closes.slice(-n);
  return Number((sl.reduce((a, b) => a + b, 0) / sl.length).toFixed(2));
}

// ---------- SYNC LISTING (bulk upsert — nhanh & ổn định cho Production) ----------
export async function syncListing(): Promise<{ inserted: number; updated: number; delisted: number; total: number }> {
  const t0 = Date.now();
  const remote = await fetchListing();
  console.info(`[stock-sync] Listing: nhận ${remote.length} mã từ WiData`);

  // Tập hợp mã đang giao dịch và mã hủy niêm yết
  const active = remote.filter((r) => VALID_EXCHANGES.has(r.san));
  const delistedCodes = remote.filter((r) => r.san === "DELISTING").map((r) => r.code);

  // Đếm số mã đã có trước khi upsert (để tính inserted/updated)
  const before = await db.select({ c: sql<number>`count(*)` }).from(stocks);
  const beforeCount = Number(before[0]?.c ?? 0);

  // Bulk upsert theo lô (chunk) — dùng ON CONFLICT để tránh select-from-loop
  const CHUNK = 250;
  for (let i = 0; i < active.length; i += CHUNK) {
    const slice = active.slice(i, i + CHUNK);
    await db.insert(stocks).values(
      slice.map((item) => ({
        symbol: item.code,
        name: item.fullname_vi,
        exchange: item.san,
        status: "active" as const,
        listingUpdatedAt: new Date(item.updated_at),
        updatedAt: new Date(),
      })),
    ).onConflictDoUpdate({
      target: stocks.symbol,
      set: {
        name: sql`excluded.name`,
        exchange: sql`excluded.exchange`,
        status: sql`'active'`,
        listingUpdatedAt: sql`excluded.listing_updated_at`,
        updatedAt: new Date(),
      },
    });
  }

  // Đánh dấu các mã hủy niêm yết (bulk)
  let delisted = 0;
  if (delistedCodes.length > 0) {
    for (let i = 0; i < delistedCodes.length; i += CHUNK) {
      const slice = delistedCodes.slice(i, i + CHUNK);
      const res = await db.update(stocks)
        .set({ status: "delisted", updatedAt: new Date() })
        .where(inArray(stocks.symbol, slice));
      delisted += slice.length;
      void res;
    }
  }

  const after = await db.select({ c: sql<number>`count(*)` }).from(stocks);
  const afterCount = Number(after[0]?.c ?? 0);
  const inserted = Math.max(0, afterCount - beforeCount);
  const updated = active.length - inserted;

  console.info(`[stock-sync] Listing xong sau ${Date.now() - t0}ms: +${inserted} mới, ~${updated} cập nhật, ${delisted} hủy niêm yết, tổng ${afterCount}`);
  return { inserted, updated, delisted, total: afterCount };
}

// ---------- SYNC PRICES (batch, top N by volume/market cap) ----------
export async function syncPrices(symbols: string[]): Promise<number> {
  let count = 0;
  // Process in small parallel batches to avoid overwhelming
  const batchSize = 5;
  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map(async (sym) => {
        const p = await fetchPrice(sym);
        if (!p) return;
        const change = p.price - p.prevClose;
        const changePct = p.prevClose ? (change / p.prevClose) * 100 : 0;
        const closes = p.closes;
        const h52 = Math.max(...closes.slice(-252));
        const l52 = Math.min(...closes.slice(-252));

        await db.update(stocks).set({
          price: p.price,
          open: p.open,
          high: p.high,
          low: p.low,
          prevClose: p.prevClose,
          change: Number(change.toFixed(2)),
          changePct: Number(changePct.toFixed(2)),
          volume: p.volume,
          rsi: rsi14(closes),
          macd: macdVal(closes),
          ma20: ma(closes, 20),
          ma50: ma(closes, 50),
          ma200: ma(closes, Math.min(200, closes.length)),
          high52w: h52,
          low52w: l52,
          dataSource: "VNDirect",
          priceUpdatedAt: new Date(),
          updatedAt: new Date(),
        }).where(eq(stocks.symbol, sym));
        count++;
      }),
    );
  }
  return count;
}

// ---------- GET SYNC STATUS ----------
export async function getSyncStatus() {
  const result = await db.select({
    total: sql<number>`count(*)`,
    active: sql<number>`count(*) filter (where ${stocks.status} = 'active')`,
    withPrice: sql<number>`count(*) filter (where ${stocks.price} > 0)`,
    lastSync: sql<string>`max(${stocks.priceUpdatedAt})`,
  }).from(stocks);

  const row = result[0];
  return {
    totalStocks: Number(row?.total ?? 0),
    activeStocks: Number(row?.active ?? 0),
    withPrice: Number(row?.withPrice ?? 0),
    lastSync: row?.lastSync ?? null,
  };
}
