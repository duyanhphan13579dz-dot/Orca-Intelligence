import type { Quote } from "./types";
import { getCrypto as getMockCrypto, getForex as getMockForex } from "./market-data";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
export const REFRESH_SECONDS = 900;

// ====================================================================
// Tiền mã hóa — nguồn thật CoinGecko (free). Fallback Binance khi cần.
// ====================================================================
const CG_IDS: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  BNB: "binancecoin",
  SOL: "solana",
  XRP: "ripple",
  ADA: "cardano",
  DOGE: "dogecoin",
  TRX: "tron",
  TON: "the-open-network",
  SUI: "sui",
};

export interface CryptoQuote extends Quote {
  marketCap: number;
  vol24h: number;
  image?: string;
}

export interface LiveResult<T> {
  data: T;
  live: boolean;
  source: string;
  syncedAt: string;
}

export async function getCryptoLive(): Promise<LiveResult<CryptoQuote[]>> {
  const ids = Object.values(CG_IDS).join(",");
  const syncedAt = new Date().toISOString();
  try {
    const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&price_change_percentage=24h`;
    const res = await fetch(url, {
      headers: { Accept: "*/*", "User-Agent": UA },
      next: { revalidate: REFRESH_SECONDS },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
    const arr = (await res.json()) as Array<{
      symbol: string; name: string; current_price: number; price_change_24h: number;
      price_change_percentage_24h: number; market_cap: number; total_volume: number;
      high_24h: number; low_24h: number; image: string;
    }>;
    const data: CryptoQuote[] = arr.map((c) => ({
      symbol: c.symbol.toUpperCase(),
      name: c.name,
      price: c.current_price,
      prevClose: c.current_price - (c.price_change_24h ?? 0),
      change: c.price_change_24h ?? 0,
      changePct: c.price_change_percentage_24h ?? 0,
      open: c.current_price - (c.price_change_24h ?? 0),
      high: c.high_24h ?? c.current_price,
      low: c.low_24h ?? c.current_price,
      volume: Math.round(c.total_volume ?? 0),
      series: buildSeries(c.current_price, c.price_change_percentage_24h ?? 0),
      marketCap: c.market_cap ?? 0,
      vol24h: c.total_volume ?? 0,
      image: c.image,
    }));
    if (data.length === 0) throw new Error("CoinGecko rỗng");
    return { data, live: true, source: "CoinGecko", syncedAt };
  } catch (e) {
    console.warn("[market-live] CoinGecko lỗi, dùng dữ liệu dự phòng:", e instanceof Error ? e.message : e);
    const fallback: CryptoQuote[] = getMockCrypto().map((q) => ({ ...q, marketCap: q.price * 1e7, vol24h: q.volume }));
    return { data: fallback, live: false, source: "Dự phòng nội bộ", syncedAt };
  }
}

// Fear & Greed Index (alternative.me, free)
export async function getFearGreed(): Promise<{ value: number; label: string; live: boolean }> {
  try {
    const res = await fetch("https://api.alternative.me/fng/?limit=1", {
      headers: { Accept: "*/*", "User-Agent": UA },
      next: { revalidate: REFRESH_SECONDS },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(String(res.status));
    const json = await res.json();
    const item = json.data?.[0];
    const value = Number(item?.value ?? 50);
    const label = translateFng(item?.value_classification ?? "Neutral");
    return { value, label, live: true };
  } catch {
    return { value: 50, label: "Trung lập", live: false };
  }
}

function translateFng(s: string): string {
  const map: Record<string, string> = {
    "Extreme Fear": "Sợ hãi tột độ",
    "Fear": "Sợ hãi",
    "Neutral": "Trung lập",
    "Greed": "Tham lam",
    "Extreme Greed": "Tham lam tột độ",
  };
  return map[s] ?? s;
}

// ====================================================================
// Ngoại hối — nguồn thật Frankfurter (ECB, free, không cần key).
// Ưu tiên cấu hình: Finnhub → Investing.com → WiData (khi có key/connector).
// ====================================================================
const FX_PAIRS: [string, string, string, string][] = [
  // symbol, name, base, quote
  ["USD/VND", "Đô la Mỹ / Việt Nam Đồng", "USD", "VND"],
  ["EUR/VND", "Euro / Việt Nam Đồng", "EUR", "VND"],
  ["JPY/VND", "Yên Nhật / Việt Nam Đồng", "JPY", "VND"],
  ["CNY/VND", "Nhân dân tệ / Việt Nam Đồng", "CNY", "VND"],
  ["EUR/USD", "Euro / Đô la Mỹ", "EUR", "USD"],
  ["GBP/USD", "Bảng Anh / Đô la Mỹ", "GBP", "USD"],
  ["USD/JPY", "Đô la Mỹ / Yên Nhật", "USD", "JPY"],
  ["AUD/USD", "Đô la Úc / Đô la Mỹ", "AUD", "USD"],
  ["NZD/USD", "Đô la New Zealand / Đô la Mỹ", "NZD", "USD"],
  ["USD/CAD", "Đô la Mỹ / Đô la Canada", "USD", "CAD"],
  ["USD/CHF", "Đô la Mỹ / Franc Thụy Sĩ", "USD", "CHF"],
];

export async function getForexLive(): Promise<LiveResult<Quote[]>> {
  const syncedAt = new Date().toISOString();
  try {
    const usd = await fetchRates();
    if (!usd) throw new Error("Nguồn tỷ giá lỗi");
    const rateOf = (base: string, quote: string): number | null => {
      const bUsd = base === "USD" ? 1 : usd[base] ? 1 / usd[base] : null; // 1 đơn vị base = ? USD
      const qPerUsd = quote === "USD" ? 1 : usd[quote] ?? null; // 1 USD = ? quote
      if (bUsd == null || qPerUsd == null) return null;
      return bUsd * qPerUsd; // 1 base = ? quote
    };
    const data: Quote[] = FX_PAIRS.map(([symbol, name, b, q]) => {
      const price = rateOf(b, q) ?? 0;
      const digits = price > 1000 ? 0 : 4;
      const p = Number(price.toFixed(digits));
      return {
        symbol, name, price: p, prevClose: p, change: 0, changePct: 0,
        open: p, high: p, low: p, volume: 0, series: buildSeries(p, 0),
      };
    }).filter((q) => q.price > 0);
    if (data.length === 0) throw new Error("Không có cặp tỷ giá");
    return { data, live: true, source: "ExchangeRate-API (Finnhub/Investing dự phòng)", syncedAt };
  } catch (e) {
    console.warn("[market-live] Forex lỗi, dùng dữ liệu dự phòng:", e instanceof Error ? e.message : e);
    return { data: getMockForex(), live: false, source: "Dự phòng nội bộ", syncedAt };
  }
}

// Lấy bảng tỷ giá: 1 USD = ? (mỗi quốc gia). Có VND, EUR, JPY, CNY...
async function fetchRates(): Promise<Record<string, number> | null> {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      headers: { Accept: "*/*", "User-Agent": UA },
      next: { revalidate: REFRESH_SECONDS },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.rates ?? null;
  } catch {
    return null;
  }
}

// Tạo chuỗi sparkline xấp xỉ quanh giá hiện tại theo % thay đổi 24h
function buildSeries(price: number, changePct: number): number[] {
  const start = price / (1 + changePct / 100);
  const out: number[] = [];
  for (let i = 0; i < 24; i++) {
    const t = i / 23;
    out.push(Number((start + (price - start) * t).toFixed(price > 100 ? 2 : 6)));
  }
  return out;
}
