import type { Candle, Quote, Stock } from "./types";
import { makeSeries, makeCandles, getStock as getMockStock, getStocks as getMockStocks, getIndices as getMockIndices, getIndex as getMockIndex } from "./market-data";

// ====================================================================
// Lớp dịch vụ dữ liệu thời gian thực — nguồn VNDirect dchart (free tier)
// Cache phía máy chủ 15 phút (revalidate = 900 giây) để tự động làm mới.
// Luôn có cơ chế dự phòng (fallback) sang dữ liệu mô phỏng nếu API lỗi,
// đảm bảo ứng dụng không bao giờ vỡ khi nguồn dữ liệu bị chặn.
// ====================================================================

export const REFRESH_SECONDS = 900; // 15 phút
const BASE = "https://dchart-api.vndirect.com.vn/dchart/history";

interface OHLCVResponse {
  t: number[];
  o: number[];
  h: number[];
  l: number[];
  c: number[];
  v: number[];
  s: string;
}

// Ánh xạ khung thời gian giao diện -> tham số resolution của VNDirect
export const RESOLUTION_MAP: Record<string, string> = {
  "1 phút": "1",
  "5 phút": "5",
  "15 phút": "15",
  "1 giờ": "60",
  "4 giờ": "60",
  "1 ngày": "D",
  "1 tuần": "W",
  "1 tháng": "M",
};

// Ánh xạ symbol nội bộ -> symbol VNDirect
function mapSymbol(symbol: string): string {
  const s = symbol.toUpperCase();
  const map: Record<string, string> = {
    HNX: "HNX",
    UPCOM: "UPCOM",
    VNINDEX: "VNINDEX",
    VN30: "VN30",
  };
  return map[s] ?? s;
}

// Các symbol mà VNDirect hỗ trợ (thị trường Việt Nam)
const VN_SYMBOLS = new Set([
  "VNINDEX", "VN30", "HNX", "UPCOM",
]);

export function isVietnamSymbol(symbol: string): boolean {
  return VN_SYMBOLS.has(symbol.toUpperCase());
}

function daysBack(days: number): number {
  return Math.floor(Date.now() / 1000) - days * 86400;
}

/**
 * Lấy dữ liệu nến OHLCV thật từ VNDirect. Trả về null nếu thất bại.
 */
export async function fetchOHLCV(
  symbol: string,
  resolution = "D",
  days = 200,
): Promise<Candle[] | null> {
  try {
    const from = daysBack(resolution === "D" || resolution === "W" || resolution === "M" ? days : 7);
    const to = Math.floor(Date.now() / 1000);
    const url = `${BASE}?resolution=${resolution}&symbol=${mapSymbol(symbol)}&from=${from}&to=${to}`;
    const res = await fetch(url, {
      headers: {
        // Lưu ý: VNDirect WAF trả 406 nếu Accept là "application/json".
        // Phải dùng "*/*" để vượt qua kiểm tra content negotiation.
        Accept: "*/*",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      next: { revalidate: REFRESH_SECONDS },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data: OHLCVResponse = await res.json();
    if (data.s !== "ok" || !data.t || data.t.length === 0) return null;
    const candles: Candle[] = data.t.map((ts, i) => ({
      t: new Date(ts * 1000).toISOString().slice(0, resolution === "D" || resolution === "W" || resolution === "M" ? 10 : 16),
      o: data.o[i],
      h: data.h[i],
      l: data.l[i],
      c: data.c[i],
      v: data.v[i],
    }));
    return candles;
  } catch {
    return null;
  }
}

function num(n: number, digits?: number): number {
  const d = digits ?? (Math.abs(n) > 100 ? 2 : 4);
  return Number(n.toFixed(d));
}

function quoteFromCandles(symbol: string, name: string, candles: Candle[], unit?: string): Quote {
  const closes = candles.map((c) => c.c);
  const last = candles[candles.length - 1];
  const prev = candles[candles.length - 2] ?? last;
  const price = last.c;
  const prevClose = prev.c;
  const change = price - prevClose;
  const changePct = prevClose ? (change / prevClose) * 100 : 0;
  const window = candles.slice(-20);
  return {
    symbol,
    name,
    price: num(price),
    prevClose: num(prevClose),
    change: num(change),
    changePct: Number(changePct.toFixed(2)),
    open: num(last.o),
    high: num(Math.max(...window.map((c) => c.h))),
    low: num(Math.min(...window.map((c) => c.l))),
    volume: Math.round(last.v),
    unit,
    series: closes.slice(-48).map((c) => num(c)),
  };
}

// ---------- Chỉ báo kỹ thuật từ giá thật ----------
function rsi14(closes: number[]): number {
  if (closes.length < 15) return 50;
  let gain = 0;
  let loss = 0;
  for (let i = closes.length - 14; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    if (d >= 0) gain += d;
    else loss -= d;
  }
  const rs = loss === 0 ? 100 : gain / loss;
  return Number((100 - 100 / (1 + rs)).toFixed(1));
}

function emaArr(values: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const out: number[] = [];
  values.forEach((v, i) => out.push(i === 0 ? v : v * k + out[i - 1] * (1 - k)));
  return out;
}

function macdVal(closes: number[]): number {
  if (closes.length < 26) return 0;
  const e12 = emaArr(closes, 12);
  const e26 = emaArr(closes, 26);
  return Number((e12[e12.length - 1] - e26[e26.length - 1]).toFixed(3));
}

function ma(closes: number[], n: number): number {
  const slice = closes.slice(-n);
  return num(slice.reduce((a, b) => a + b, 0) / slice.length);
}

// ====================================================================
// API CÔNG KHAI — luôn fallback sang dữ liệu mô phỏng khi cần
// ====================================================================

const INDEX_NAMES: Record<string, string> = {
  VNINDEX: "VN-Index",
  VN30: "VN30",
  HNX: "HNX-Index",
  UPCOM: "UPCOM-Index",
};

/** Lấy báo giá chỉ số (real-time nếu là chỉ số VN, ngược lại dùng mock). */
export async function getIndicesLive(): Promise<{ quotes: Quote[]; live: boolean }> {
  const mock = getMockIndices();
  const vnSymbols = Object.keys(INDEX_NAMES);
  let liveCount = 0;

  const results = await Promise.all(
    mock.map(async (m) => {
      if (!vnSymbols.includes(m.symbol)) return m;
      const candles = await fetchOHLCV(m.symbol, "D", 120);
      if (!candles || candles.length < 2) return m;
      liveCount++;
      return quoteFromCandles(m.symbol, INDEX_NAMES[m.symbol], candles);
    }),
  );
  return { quotes: results, live: liveCount > 0 };
}

export async function getIndexLive(symbol: string): Promise<Quote | undefined> {
  const mock = getMockIndex(symbol);
  if (!mock) return undefined;
  if (!INDEX_NAMES[symbol.toUpperCase()]) return mock;
  const candles = await fetchOHLCV(symbol, "D", 120);
  if (!candles || candles.length < 2) return mock;
  return quoteFromCandles(symbol.toUpperCase(), INDEX_NAMES[symbol.toUpperCase()], candles);
}

/** Bổ sung giá thật + chỉ báo cho một cổ phiếu, giữ lại các chỉ số cơ bản (mock). */
async function enrichStock(base: Stock): Promise<Stock> {
  const candles = await fetchOHLCV(base.symbol, "D", 250);
  if (!candles || candles.length < 5) return base;
  const q = quoteFromCandles(base.symbol, base.name, candles);
  const closes = candles.map((c) => c.c);
  return {
    ...base,
    ...q,
    rsi: rsi14(closes),
    macd: macdVal(closes),
    ma20: ma(closes, 20),
    ma50: ma(closes, 50),
    ma200: ma(closes, Math.min(200, closes.length)),
  };
}

/** Danh sách cổ phiếu với giá thật (fallback mock từng mã). */
export async function getStocksLive(): Promise<{ stocks: Stock[]; live: boolean }> {
  const mock = getMockStocks();
  let liveCount = 0;
  const stocks = await Promise.all(
    mock.map(async (m) => {
      const enriched = await enrichStock(m);
      if (enriched !== m) liveCount++;
      return enriched;
    }),
  );
  return { stocks, live: liveCount > 0 };
}

export async function getStockLive(symbol: string): Promise<Stock | undefined> {
  const mock = getMockStock(symbol);
  if (!mock) return undefined;
  return enrichStock(mock);
}

/** Lấy nến cho biểu đồ — real-time với fallback sang nến mô phỏng. */
export async function getCandlesLive(
  symbol: string,
  resolution: string,
  base: number,
): Promise<{ candles: Candle[]; live: boolean }> {
  const real = await fetchOHLCV(symbol, resolution, 250);
  if (real && real.length > 5) return { candles: real, live: true };
  // fallback: nến mô phỏng tất định
  return { candles: makeCandles(symbol + resolution, base, 80, 0.02), live: false };
}

// Re-export tiện ích
export { makeSeries };
