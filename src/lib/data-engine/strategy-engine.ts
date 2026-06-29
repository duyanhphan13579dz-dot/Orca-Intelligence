// ====================================================================
// AI Strategy Engine — tạo chiến lược theo ngày/tuần/tháng từ dữ liệu
// thị trường mới nhất. Không sử dụng mốc VNINDEX hoặc chỉ số hard-code.
//
// Nguồn dữ liệu: VNDirect dchart (giá thật) → tính RSI, MA, MACD,
// biên dao động, xu hướng → tổng hợp chiến lược AI.
//
// Mỗi lần đồng bộ tạo mới chiến lược và lưu timestamp đầy đủ.
// ====================================================================

import type { Strategy } from "@/lib/types";

const UA = "Mozilla/5.0 (compatible; OrcaBot/1.0)";
const VND_URL = "https://dchart-api.vndirect.com.vn/dchart/history";

export interface LiveStrategy extends Strategy {
  // Dữ liệu thị trường cơ sở (KHÔNG hard-code)
  baseIndex: string;       // "VNINDEX"
  basePrice: number;       // Giá VNINDEX thật tại thời điểm tạo chiến lược
  basePricePrev: number;   // Giá phiên trước
  baseChangePct: number;   // % thay đổi thật
  high30d: number;         // Đỉnh 30 ngày
  low30d: number;          // Đáy 30 ngày
  rsi14: number;           // RSI thật từ dữ liệu
  ma20: number;            // MA20 thật
  ma50: number;            // MA50 thật
  // trend: inherited from Strategy — Xu hướng tự động từ dữ liệu thật
  dataSource: string;      // "VNDirect dchart"
  dataTime: string;        // ISO — thời điểm dữ liệu mới nhất
  generatedAt: string;     // ISO — thời điểm AI tạo chiến lược
  isLive: boolean;
}

interface OHLCVData {
  closes: number[];
  highs: number[];
  lows: number[];
  volumes: number[];
  lastDate: string;
}

async function fetchVNINDEX(days = 60): Promise<OHLCVData | null> {
  try {
    const from = Math.floor(Date.now() / 1000) - days * 86400;
    const to = Math.floor(Date.now() / 1000);
    const url = `${VND_URL}?resolution=D&symbol=VNINDEX&from=${from}&to=${to}`;
    const res = await fetch(url, {
      headers: { Accept: "*/*", "User-Agent": UA },
      next: { revalidate: 900 },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    const d = await res.json();
    if (d.s !== "ok" || !d.c || d.c.length < 5) return null;
    const n = d.c.length;
    return {
      closes: d.c,
      highs: d.h,
      lows: d.l,
      volumes: d.v,
      lastDate: new Date(d.t[n - 1] * 1000).toISOString(),
    };
  } catch {
    return null;
  }
}

function calcRsi14(closes: number[]): number {
  if (closes.length < 15) return 50;
  let gain = 0, loss = 0;
  for (let i = closes.length - 14; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    if (d >= 0) gain += d; else loss -= d;
  }
  const rs = loss === 0 ? 100 : gain / loss;
  return Number((100 - 100 / (1 + rs)).toFixed(1));
}

function calcMA(closes: number[], n: number): number {
  const sl = closes.slice(-n);
  return Number((sl.reduce((a, b) => a + b, 0) / sl.length).toFixed(2));
}

function calcEMA(closes: number[], n: number): number {
  const k = 2 / (n + 1);
  let ema = closes[0];
  for (let i = 1; i < closes.length; i++) ema = closes[i] * k + ema * (1 - k);
  return Number(ema.toFixed(2));
}

function fmtPoint(v: number): string {
  return v.toLocaleString("vi-VN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtRange(a: number, b: number): string {
  return `${fmtPoint(a)} – ${fmtPoint(b)}`;
}

function assessRisk(rsi: number, changePct: number, deviFromMa: number): string {
  if (rsi > 70 || deviFromMa > 5) return "Cao — thị trường quá mua";
  if (rsi < 30 || changePct < -3) return "Cao — thị trường quá bán";
  if (rsi > 60 || deviFromMa > 2) return "Trung bình cao";
  if (rsi < 40 || deviFromMa < -2) return "Trung bình thấp";
  return "Trung bình";
}

function calcConfidence(rsi: number, trendStrength: number, vol: number): number {
  let score = 60;
  if (rsi >= 40 && rsi <= 65) score += 15; // RSI healthy zone
  if (trendStrength > 0.03) score += 10;
  if (trendStrength < 0) score -= 10;
  if (vol > 0.7) score += 5; // Khối lượng cao
  return Math.max(45, Math.min(92, Math.round(score)));
}

export async function generateStrategies(): Promise<LiveStrategy[]> {
  const generatedAt = new Date().toISOString();
  const data = await fetchVNINDEX(60);

  if (!data || data.closes.length < 5) {
    // Fallback rõ ràng: không có dữ liệu thật → trả trạng thái chờ
    const base: LiveStrategy = {
      slug: "chien-luoc-cho-dong-bo",
      period: "ngày",
      title: "Chiến lược: Đang chờ đồng bộ dữ liệu",
      trend: "Đang chờ đồng bộ — chưa có dữ liệu thị trường mới nhất",
      entry: "—",
      exit: "—",
      stopLoss: "—",
      takeProfit: "—",
      risk: "—",
      confidence: 0,
      summary: "Hệ thống chưa đồng bộ được dữ liệu VNINDEX từ nguồn VNDirect. Chiến lược sẽ được tạo tự động sau khi kết nối nguồn dữ liệu thành công.",
      baseIndex: "VNINDEX",
      basePrice: 0,
      basePricePrev: 0,
      baseChangePct: 0,
      high30d: 0,
      low30d: 0,
      rsi14: 0,
      ma20: 0,
      ma50: 0,
      dataSource: "VNDirect dchart",
      dataTime: generatedAt,
      generatedAt,
      isLive: false,
    };
    return [{ ...base, slug: "chien-luoc-ngay", period: "ngày", title: "Chiến lược ngày: Đang chờ đồng bộ" },
            { ...base, slug: "chien-luoc-tuan", period: "tuần", title: "Chiến lược tuần: Đang chờ đồng bộ" },
            { ...base, slug: "chien-luoc-thang", period: "tháng", title: "Chiến lược tháng: Đang chờ đồng bộ" }];
  }

  const closes = data.closes;
  const n = closes.length;
  const last = closes[n - 1];
  const prev = closes[n - 2];
  const changePct = ((last - prev) / prev) * 100;
  const rsi = calcRsi14(closes);
  const ma20 = calcMA(closes, 20);
  const ma50 = calcMA(closes, Math.min(50, n));
  const ema12 = calcEMA(closes, 12);
  const ema26 = calcEMA(closes, 26);
  const macdVal = ema12 - ema26;
  const high30 = Math.max(...closes.slice(-30));
  const low30 = Math.min(...closes.slice(-30));
  const deviFromMa20 = ((last - ma20) / ma20) * 100;
  const trendStrength = (closes[n - 1] - closes[Math.max(0, n - 10)]) / closes[Math.max(0, n - 10)];
  const avgVol = data.volumes.slice(-5).reduce((a, b) => a + b, 0) / 5;
  const volRatio = avgVol > 0 ? data.volumes[n - 1] / avgVol : 1;

  // Xác định xu hướng từ dữ liệu thật
  const trendLabel = last > ma20 && ma20 > ma50
    ? "Tăng bền — trên MA20 & MA50"
    : last > ma20
    ? "Tăng ngắn hạn — trên MA20, kiểm định MA50"
    : last < ma20 && ma20 < ma50
    ? "Giảm bền — dưới MA20 & MA50"
    : "Điều chỉnh / tích lũy — dưới MA20";

  const isBull = last > ma20;
  const risk = assessRisk(rsi, changePct, deviFromMa20);
  const conf = calcConfidence(rsi, trendStrength, volRatio);

  // Support & resistance từ dữ liệu
  const supportZone = Number((ma20 * 0.975).toFixed(2));
  const support2 = Number((ma50 * 0.97).toFixed(2));
  const resist = Number((last * (isBull ? 1.035 : 1.02)).toFixed(2));
  const resist2 = Number((high30 * 1.01).toFixed(2));

  const dataSource = "VNDirect dchart";
  const dataTime = data.lastDate;
  const base = { baseIndex: "VNINDEX", basePrice: last, basePricePrev: prev, baseChangePct: Number(changePct.toFixed(2)), high30d: high30, low30d: low30, rsi14: rsi, ma20, ma50, dataSource, dataTime, generatedAt, isLive: true, trend: trendLabel };

  const strategies: LiveStrategy[] = [
    {
      ...base,
      slug: "chien-luoc-ngay",
      period: "ngày",
      title: "Chiến lược giao dịch trong ngày",
      entry: fmtRange(last * 0.992, last * 0.998),
      exit: fmtPoint(resist),
      stopLoss: fmtPoint(supportZone),
      takeProfit: fmtPoint(resist * 1.012),
      risk,
      confidence: conf,
      summary: `VNINDEX đang ở mức ${fmtPoint(last)} (${changePct > 0 ? "+" : ""}${changePct.toFixed(2)}%), ${trendLabel}. RSI ${rsi} — ${rsi > 70 ? "vùng quá mua, thận trọng" : rsi < 30 ? "vùng quá bán, cơ hội" : "vùng trung lập"}. MACD ${macdVal > 0 ? "dương (ủng hộ xu hướng tăng)" : "âm (xu hướng giảm)"}. Ưu tiên giao dịch theo xu hướng ngắn hạn, quản lý chặt vùng cắt lỗ.`,
    },
    {
      ...base,
      slug: "chien-luoc-tuan",
      period: "tuần",
      title: "Chiến lược đầu tư theo tuần",
      entry: fmtRange(supportZone, last * 0.998),
      exit: fmtPoint(resist),
      stopLoss: fmtPoint(support2),
      takeProfit: fmtPoint(resist2),
      risk: rsi > 65 ? "Trung bình cao" : "Trung bình",
      confidence: Math.max(50, conf - 5),
      summary: `Tuần này VNINDEX đứng ở ${fmtPoint(last)}, MA20 = ${fmtPoint(ma20)}, MA50 = ${fmtPoint(ma50)}. ${isBull ? "Xu hướng tăng trung hạn được duy trì, ưu tiên mua tại vùng hỗ trợ." : "Thị trường đang trong nhịp điều chỉnh, chờ tín hiệu xác nhận trước khi giải ngân."} Đỉnh 30 ngày: ${fmtPoint(high30)}, đáy 30 ngày: ${fmtPoint(low30)}.`,
    },
    {
      ...base,
      slug: "chien-luoc-thang",
      period: "tháng",
      title: "Chiến lược đầu tư theo tháng",
      entry: fmtRange(low30 * 1.01, ma20),
      exit: fmtPoint(high30 * 1.02),
      stopLoss: fmtPoint(low30 * 0.97),
      takeProfit: fmtPoint(high30 * 1.05),
      risk: "Thấp đến trung bình",
      confidence: Math.max(50, conf - 8),
      summary: `Tháng này VNINDEX biên độ dao động ${fmtRange(low30, high30)} (dao động ${((high30 / low30 - 1) * 100).toFixed(1)}%). ${isBull && rsi < 65 ? "Định giá thị trường còn hấp dẫn — phù hợp tích lũy cổ phiếu cơ bản tốt." : isBull ? "Thị trường cận vùng kháng cự, thận trọng với tỷ trọng mới." : "Thị trường đang kiểm định vùng hỗ trợ — cơ hội mua tích lũy dài hạn nếu giữ vững."} Theo dõi diễn biến khối ngoại và thanh khoản để điều chỉnh danh mục.`,
    },
  ];

  return strategies;
}

/** Tạo chiến lược ngay lập tức (cached 15 phút phía caller) */
export async function getStrategiesLive(): Promise<LiveStrategy[]> {
  return generateStrategies();
}
