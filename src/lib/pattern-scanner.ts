import type { Candle } from "./types";

export interface DetectedPattern {
  name: string;
  group: "Đảo chiều" | "Tiếp diễn" | "Nến";
  status: "Đã xác nhận" | "Đang hình thành";
  confidence: number; // 0-100
  meaning: string;
  direction: "Tăng" | "Giảm" | "Trung lập";
  detectedAt: string; // ISO date
}

// ====================================================================
// Pattern Scanner — nhận diện mẫu hình kỹ thuật từ dữ liệu nến THẬT.
// Phân tích, không phải dữ liệu giả: mọi tín hiệu suy ra từ giá thực tế.
// ====================================================================

const body = (c: Candle) => Math.abs(c.c - c.o);
const range = (c: Candle) => c.h - c.l || 0.0001;
const upperWick = (c: Candle) => c.h - Math.max(c.o, c.c);
const lowerWick = (c: Candle) => Math.min(c.o, c.c) - c.l;
const isBull = (c: Candle) => c.c >= c.o;

// ---------- Mẫu nến (candlestick) ----------
function scanCandlePatterns(candles: Candle[]): DetectedPattern[] {
  const out: DetectedPattern[] = [];
  if (candles.length < 3) return out;
  const n = candles.length;
  const c1 = candles[n - 1];
  const c2 = candles[n - 2];
  const c3 = candles[n - 3];
  const at = c1.t;

  const b1 = body(c1), r1 = range(c1);

  // Doji
  if (b1 / r1 < 0.1) {
    out.push({ name: "Doji", group: "Nến", status: "Đã xác nhận", confidence: 62, meaning: "Cân bằng cung cầu, thị trường lưỡng lự.", direction: "Trung lập", detectedAt: at });
  }
  // Hammer (bullish) / Hanging Man
  if (lowerWick(c1) > b1 * 2 && upperWick(c1) < b1 * 0.6) {
    const prevDown = c2.c < c3.c;
    out.push(prevDown
      ? { name: "Hammer", group: "Nến", status: "Đã xác nhận", confidence: 70, meaning: "Lực cầu bắt đáy mạnh sau nhịp giảm.", direction: "Tăng", detectedAt: at }
      : { name: "Hanging Man", group: "Nến", status: "Đang hình thành", confidence: 58, meaning: "Cảnh báo đảo chiều giảm sau nhịp tăng.", direction: "Giảm", detectedAt: at });
  }
  // Shooting Star
  if (upperWick(c1) > b1 * 2 && lowerWick(c1) < b1 * 0.6 && c2.c > c3.c) {
    out.push({ name: "Shooting Star", group: "Nến", status: "Đã xác nhận", confidence: 66, meaning: "Áp lực bán xuất hiện tại đỉnh.", direction: "Giảm", detectedAt: at });
  }
  // Bullish / Bearish Engulfing
  if (isBull(c1) && !isBull(c2) && c1.c >= c2.o && c1.o <= c2.c) {
    out.push({ name: "Bullish Engulfing", group: "Nến", status: "Đã xác nhận", confidence: 74, meaning: "Nến tăng nhấn chìm nến giảm — tín hiệu đảo chiều tăng.", direction: "Tăng", detectedAt: at });
  }
  if (!isBull(c1) && isBull(c2) && c1.o >= c2.c && c1.c <= c2.o) {
    out.push({ name: "Bearish Engulfing", group: "Nến", status: "Đã xác nhận", confidence: 74, meaning: "Nến giảm nhấn chìm nến tăng — tín hiệu đảo chiều giảm.", direction: "Giảm", detectedAt: at });
  }
  // Harami
  if (body(c2) > body(c1) * 1.6 && Math.max(c1.o, c1.c) < Math.max(c2.o, c2.c) && Math.min(c1.o, c1.c) > Math.min(c2.o, c2.c)) {
    out.push({ name: "Harami", group: "Nến", status: "Đang hình thành", confidence: 55, meaning: "Động lượng suy yếu, khả năng đảo chiều.", direction: isBull(c2) ? "Giảm" : "Tăng", detectedAt: at });
  }
  // Morning Star / Evening Star
  if (!isBull(c3) && body(c2) / range(c2) < 0.4 && isBull(c1) && c1.c > (c3.o + c3.c) / 2) {
    out.push({ name: "Morning Star", group: "Nến", status: "Đã xác nhận", confidence: 72, meaning: "Mẫu 3 nến đảo chiều tăng đáy.", direction: "Tăng", detectedAt: at });
  }
  if (isBull(c3) && body(c2) / range(c2) < 0.4 && !isBull(c1) && c1.c < (c3.o + c3.c) / 2) {
    out.push({ name: "Evening Star", group: "Nến", status: "Đã xác nhận", confidence: 72, meaning: "Mẫu 3 nến đảo chiều giảm đỉnh.", direction: "Giảm", detectedAt: at });
  }
  // Three White Soldiers / Three Black Crows
  if (isBull(c1) && isBull(c2) && isBull(c3) && c1.c > c2.c && c2.c > c3.c) {
    out.push({ name: "Three White Soldiers", group: "Nến", status: "Đã xác nhận", confidence: 76, meaning: "Ba nến tăng liên tiếp — xu hướng tăng mạnh.", direction: "Tăng", detectedAt: at });
  }
  if (!isBull(c1) && !isBull(c2) && !isBull(c3) && c1.c < c2.c && c2.c < c3.c) {
    out.push({ name: "Three Black Crows", group: "Nến", status: "Đã xác nhận", confidence: 76, meaning: "Ba nến giảm liên tiếp — xu hướng giảm mạnh.", direction: "Giảm", detectedAt: at });
  }
  // Piercing Line / Dark Cloud Cover
  if (isBull(c1) && !isBull(c2) && c1.o < c2.l && c1.c > (c2.o + c2.c) / 2 && c1.c < c2.o) {
    out.push({ name: "Piercing Line", group: "Nến", status: "Đang hình thành", confidence: 60, meaning: "Phục hồi quá nửa thân nến giảm trước.", direction: "Tăng", detectedAt: at });
  }
  if (!isBull(c1) && isBull(c2) && c1.o > c2.h && c1.c < (c2.o + c2.c) / 2 && c1.c > c2.o) {
    out.push({ name: "Dark Cloud Cover", group: "Nến", status: "Đang hình thành", confidence: 60, meaning: "Áp lực bán che phủ quá nửa nến tăng trước.", direction: "Giảm", detectedAt: at });
  }

  return out;
}

// ---------- Mẫu hình giá (chart) ----------
function localExtrema(closes: number[], win = 3) {
  const peaks: number[] = [];
  const troughs: number[] = [];
  for (let i = win; i < closes.length - win; i++) {
    const seg = closes.slice(i - win, i + win + 1);
    if (closes[i] === Math.max(...seg)) peaks.push(i);
    if (closes[i] === Math.min(...seg)) troughs.push(i);
  }
  return { peaks, troughs };
}

function scanChartPatterns(candles: Candle[]): DetectedPattern[] {
  const out: DetectedPattern[] = [];
  if (candles.length < 25) return out;
  const closes = candles.map((c) => c.c);
  const recent = closes.slice(-60);
  const at = candles[candles.length - 1].t;
  const { peaks, troughs } = localExtrema(recent, 3);
  const near = (a: number, b: number, tol = 0.03) => Math.abs(a - b) / ((a + b) / 2) <= tol;

  // Double Top / Triple Top
  if (peaks.length >= 2) {
    const lastPeaks = peaks.slice(-3).map((i) => recent[i]);
    if (lastPeaks.length >= 2 && near(lastPeaks[lastPeaks.length - 1], lastPeaks[lastPeaks.length - 2])) {
      if (lastPeaks.length >= 3 && near(lastPeaks[0], lastPeaks[1]) && near(lastPeaks[1], lastPeaks[2])) {
        out.push({ name: "Triple Top", group: "Đảo chiều", status: "Đang hình thành", confidence: 64, meaning: "Ba đỉnh ngang nhau — kháng cự mạnh, nguy cơ đảo chiều giảm.", direction: "Giảm", detectedAt: at });
      } else {
        out.push({ name: "Double Top", group: "Đảo chiều", status: "Đang hình thành", confidence: 66, meaning: "Hai đỉnh ngang nhau — tín hiệu đảo chiều giảm.", direction: "Giảm", detectedAt: at });
      }
    }
  }
  // Double Bottom / Triple Bottom
  if (troughs.length >= 2) {
    const lastTr = troughs.slice(-3).map((i) => recent[i]);
    if (lastTr.length >= 2 && near(lastTr[lastTr.length - 1], lastTr[lastTr.length - 2])) {
      if (lastTr.length >= 3 && near(lastTr[0], lastTr[1]) && near(lastTr[1], lastTr[2])) {
        out.push({ name: "Triple Bottom", group: "Đảo chiều", status: "Đang hình thành", confidence: 64, meaning: "Ba đáy ngang nhau — hỗ trợ mạnh, khả năng đảo chiều tăng.", direction: "Tăng", detectedAt: at });
      } else {
        out.push({ name: "Double Bottom", group: "Đảo chiều", status: "Đang hình thành", confidence: 66, meaning: "Hai đáy ngang nhau — tín hiệu đảo chiều tăng.", direction: "Tăng", detectedAt: at });
      }
    }
  }
  // Head & Shoulders (3 đỉnh, đỉnh giữa cao nhất)
  if (peaks.length >= 3) {
    const p = peaks.slice(-3).map((i) => recent[i]);
    if (p[1] > p[0] && p[1] > p[2] && near(p[0], p[2], 0.05)) {
      out.push({ name: "Head & Shoulders", group: "Đảo chiều", status: "Đang hình thành", confidence: 68, meaning: "Vai-đầu-vai — mẫu đảo chiều giảm điển hình.", direction: "Giảm", detectedAt: at });
    }
  }
  if (troughs.length >= 3) {
    const t = troughs.slice(-3).map((i) => recent[i]);
    if (t[1] < t[0] && t[1] < t[2] && near(t[0], t[2], 0.05)) {
      out.push({ name: "Inverse Head & Shoulders", group: "Đảo chiều", status: "Đang hình thành", confidence: 68, meaning: "Vai-đầu-vai ngược — mẫu đảo chiều tăng.", direction: "Tăng", detectedAt: at });
    }
  }

  // Triangle patterns dựa trên dải biến động co lại
  const firstHalf = recent.slice(0, 30);
  const secondHalf = recent.slice(30);
  const volat = (arr: number[]) => (Math.max(...arr) - Math.min(...arr)) / (arr.reduce((a, b) => a + b, 0) / arr.length);
  const v1 = volat(firstHalf), v2 = volat(secondHalf);
  const slope = (recent[recent.length - 1] - recent[0]) / recent[0];
  if (v2 < v1 * 0.7) {
    if (slope > 0.02) out.push({ name: "Ascending Triangle", group: "Tiếp diễn", status: "Đang hình thành", confidence: 60, meaning: "Đáy nâng dần, kháng cự ngang — thiên hướng tăng.", direction: "Tăng", detectedAt: at });
    else if (slope < -0.02) out.push({ name: "Descending Triangle", group: "Tiếp diễn", status: "Đang hình thành", confidence: 60, meaning: "Đỉnh hạ dần, hỗ trợ ngang — thiên hướng giảm.", direction: "Giảm", detectedAt: at });
    else out.push({ name: "Symmetrical Triangle", group: "Tiếp diễn", status: "Đang hình thành", confidence: 56, meaning: "Biên độ co hẹp — chuẩn bị bứt phá.", direction: "Trung lập", detectedAt: at });
  }

  // Flag (xu hướng mạnh + điều chỉnh nhẹ)
  const strongUp = (recent[40] - recent[0]) / recent[0] > 0.08;
  const strongDown = (recent[40] - recent[0]) / recent[0] < -0.08;
  const pullback = Math.abs(recent[recent.length - 1] - recent[40]) / recent[40] < 0.05;
  if (strongUp && pullback) out.push({ name: "Bull Flag", group: "Tiếp diễn", status: "Đang hình thành", confidence: 58, meaning: "Cờ tăng — tích lũy sau nhịp tăng mạnh.", direction: "Tăng", detectedAt: at });
  if (strongDown && pullback) out.push({ name: "Bear Flag", group: "Tiếp diễn", status: "Đang hình thành", confidence: 58, meaning: "Cờ giảm — hồi kỹ thuật trong xu hướng giảm.", direction: "Giảm", detectedAt: at });

  // Rounding Bottom
  const minIdx = recent.indexOf(Math.min(...recent));
  if (minIdx > 15 && minIdx < 45 && recent[0] > recent[minIdx] && recent[recent.length - 1] > recent[minIdx]) {
    out.push({ name: "Rounding Bottom", group: "Đảo chiều", status: "Đang hình thành", confidence: 54, meaning: "Đáy vòng cung — tích lũy chuyển sang tăng.", direction: "Tăng", detectedAt: at });
  }

  return out;
}

export function scanPatterns(candles: Candle[]): DetectedPattern[] {
  if (!candles || candles.length < 5) return [];
  const all = [...scanChartPatterns(candles), ...scanCandlePatterns(candles)];
  // Sắp xếp theo độ tin cậy giảm dần, giới hạn 8 mẫu nổi bật
  return all.sort((a, b) => b.confidence - a.confidence).slice(0, 8);
}
