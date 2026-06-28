// ====================================================================
// Macro Engine — lấy chỉ số kinh tế từ World Bank API (free, public).
// published_at: năm/kỳ mà chỉ số được công bố CHÍNH THỨC — không sửa.
// synced_at: thời điểm Orca thu thập.
// ====================================================================

import { db } from "@/db";
import { macroIndicators } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import type { SyncResult, LiveMacroItem } from "./types";

const UA = "Mozilla/5.0 (compatible; OrcaBot/1.0)";

interface WBIndicator {
  slug: string;
  name: string;
  region: "vn" | "world";
  unit: string;
  description: string;
  countryCode: string;
  indicatorCode: string;
  sourceKey: string;
  sourceName: string;
  sourceUrl: string;
  format?: (v: number) => string;
}

const WB_INDICATORS: WBIndicator[] = [
  // Vietnam
  { slug: "gdp-vn", name: "GDP", region: "vn", unit: "%", description: "Tăng trưởng GDP của Việt Nam theo năm.", countryCode: "VN", indicatorCode: "NY.GDP.MKTP.KD.ZG", sourceKey: "worldbank", sourceName: "World Bank", sourceUrl: "https://data.worldbank.org/indicator/NY.GDP.MKTP.KD.ZG?locations=VN" },
  { slug: "cpi-vn", name: "CPI", region: "vn", unit: "%", description: "Lạm phát tiêu dùng Việt Nam (tăng trưởng CPI theo năm).", countryCode: "VN", indicatorCode: "FP.CPI.TOTL.ZG", sourceKey: "worldbank", sourceName: "World Bank", sourceUrl: "https://data.worldbank.org/indicator/FP.CPI.TOTL.ZG?locations=VN" },
  { slug: "fdi-vn", name: "FDI", region: "vn", unit: "% GDP", description: "Vốn đầu tư trực tiếp nước ngoài vào Việt Nam (% GDP).", countryCode: "VN", indicatorCode: "BX.KLT.DINV.WD.GD.ZS", sourceKey: "worldbank", sourceName: "World Bank", sourceUrl: "https://data.worldbank.org/indicator/BX.KLT.DINV.WD.GD.ZS?locations=VN" },
  { slug: "xnk-vn", name: "Xuất khẩu", region: "vn", unit: "% GDP", description: "Kim ngạch xuất khẩu hàng hóa và dịch vụ của Việt Nam (% GDP).", countryCode: "VN", indicatorCode: "NE.EXP.GNFS.ZS", sourceKey: "worldbank", sourceName: "World Bank", sourceUrl: "https://data.worldbank.org/indicator/NE.EXP.GNFS.ZS?locations=VN" },
  // US / Global
  { slug: "gdp-us", name: "GDP Mỹ", region: "world", unit: "%", description: "Tăng trưởng GDP Hoa Kỳ theo năm.", countryCode: "US", indicatorCode: "NY.GDP.MKTP.KD.ZG", sourceKey: "worldbank", sourceName: "World Bank", sourceUrl: "https://data.worldbank.org/indicator/NY.GDP.MKTP.KD.ZG?locations=US" },
  { slug: "cpi-us", name: "CPI Mỹ", region: "world", unit: "%", description: "Lạm phát tiêu dùng Hoa Kỳ theo năm.", countryCode: "US", indicatorCode: "FP.CPI.TOTL.ZG", sourceKey: "worldbank", sourceName: "World Bank", sourceUrl: "https://data.worldbank.org/indicator/FP.CPI.TOTL.ZG?locations=US" },
];

// Dữ liệu lãi suất từ FRED / nguồn cấu hình — World Bank không có realtime lãi suất.
// Các chỉ số lãi suất FED/ECB/BOJ/PBOC/Lãi suất VN hiện dùng dữ liệu cuối cùng đã biết.
// Khi có FRED API key hoặc connector phù hợp, thay thế ở đây.
const RATE_FALLBACK: Omit<LiveMacroItem, "syncedAt">[] = [
  { slug: "lai-suat-vn", name: "Lãi suất điều hành", region: "vn", value: "4,50", valueNumeric: 4.5, prev: "4,50", forecast: "4,50", unit: "%", change: 0, description: "Lãi suất tái cấp vốn của Ngân hàng Nhà nước Việt Nam.", sourceKey: "sbv-static", sourceName: "Ngân hàng Nhà nước VN", sourceUrl: "https://www.sbv.gov.vn", publishedAt: null, publishedAtRaw: "Dữ liệu cấu hình — cập nhật khi SBV thay đổi lãi suất", reportPeriod: "2026" },
  { slug: "fed-rate", name: "Lãi suất FED", region: "world", value: "4,25–4,50", valueNumeric: 4.375, prev: "4,50–4,75", forecast: "4,00–4,25", unit: "%", change: -0.25, description: "Lãi suất mục tiêu của Cục Dự trữ Liên bang Mỹ (FED).", sourceKey: "fed-static", sourceName: "Federal Reserve", sourceUrl: "https://www.federalreserve.gov/monetarypolicy/openmarket.htm", publishedAt: null, publishedAtRaw: "Dữ liệu cấu hình — nguồn: Federal Reserve. Cập nhật sau mỗi kỳ họp FOMC.", reportPeriod: "2026" },
  { slug: "ecb-rate", name: "Lãi suất ECB", region: "world", value: "2,15", valueNumeric: 2.15, prev: "2,40", forecast: "2,00", unit: "%", change: -0.25, description: "Lãi suất tái cấp vốn của Ngân hàng Trung ương châu Âu (ECB).", sourceKey: "ecb-static", sourceName: "ECB", sourceUrl: "https://www.ecb.europa.eu/press/pr/date/2025/html/", publishedAt: null, publishedAtRaw: "Dữ liệu cấu hình — nguồn: ECB. Cập nhật sau mỗi kỳ họp chính sách.", reportPeriod: "2026" },
  { slug: "boj-rate", name: "Lãi suất BOJ", region: "world", value: "0,50", valueNumeric: 0.5, prev: "0,25", forecast: "0,75", unit: "%", change: 0.25, description: "Lãi suất chính sách của Ngân hàng Trung ương Nhật Bản (BOJ).", sourceKey: "boj-static", sourceName: "BOJ", sourceUrl: "https://www.boj.or.jp/en/mopo/decisions/index.htm", publishedAt: null, publishedAtRaw: "Dữ liệu cấu hình — nguồn: BOJ. Cập nhật sau mỗi kỳ họp.", reportPeriod: "2026" },
  { slug: "pboc-rate", name: "Lãi suất PBOC", region: "world", value: "3,10", valueNumeric: 3.1, prev: "3,35", forecast: "3,00", unit: "%", change: -0.25, description: "Lãi suất cho vay cơ bản kỳ hạn 1 năm của PBOC.", sourceKey: "pboc-static", sourceName: "PBOC", sourceUrl: "http://www.pbc.gov.cn/en/3688229/index.html", publishedAt: null, publishedAtRaw: "Dữ liệu cấu hình — nguồn: PBOC. Cập nhật theo công bố chính thức.", reportPeriod: "2026" },
  { slug: "ty-gia-vn", name: "Tỷ giá trung tâm", region: "vn", value: "24.835", valueNumeric: 24835, prev: "24.780", forecast: "25.000", unit: "VND/USD", change: 55, description: "Tỷ giá trung tâm USD/VND do Ngân hàng Nhà nước Việt Nam công bố.", sourceKey: "sbv-static", sourceName: "Ngân hàng Nhà nước VN", sourceUrl: "https://www.sbv.gov.vn/webcenter/portal/vi/menu/trangchu/tk/tghoi", publishedAt: null, publishedAtRaw: "Dữ liệu tham chiếu — cập nhật mỗi ngày làm việc.", reportPeriod: "2026" },
];

async function fetchWBLatest(countryCode: string, indicatorCode: string): Promise<{ value: number; date: string; lastupdated: string } | null> {
  try {
    const url = `https://api.worldbank.org/v2/country/${countryCode}/indicator/${indicatorCode}?format=json&mrv=4&per_page=4`;
    const res = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": UA },
      next: { revalidate: 900 },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const meta = json[0];
    const data: Array<{ value: number | null; date: string }> = json[1] || [];
    const latest = data.find((d) => d.value !== null);
    if (!latest || latest.value === null) return null;
    return { value: latest.value, date: latest.date, lastupdated: meta?.lastupdated ?? "" };
  } catch {
    return null;
  }
}

export async function syncMacroIndicators(): Promise<SyncResult> {
  const t0 = Date.now();
  const now = new Date();
  let inserted = 0, updated = 0, skipped = 0, errors = 0;

  for (const ind of WB_INDICATORS) {
    try {
      const wb = await fetchWBLatest(ind.countryCode, ind.indicatorCode);
      if (!wb) { skipped++; continue; }

      const valueNumeric = wb.value;
      const valueStr = valueNumeric.toFixed(2).replace(".", ",");
      const reportPeriod = wb.date;         // Năm công bố từ World Bank: "2024"
      const publishedAtRaw = `Năm ${reportPeriod} — World Bank lastupdated: ${wb.lastupdated}`;
      // publishedAt: dùng ngày World Bank cập nhật dataset (không fake thời gian)
      const publishedAt = wb.lastupdated ? new Date(wb.lastupdated) : null;

      // Lấy kỳ trước để tính change
      const existing = await db.select().from(macroIndicators).where(eq(macroIndicators.slug, ind.slug)).limit(1);
      const prevValue = existing[0]?.valueNumeric ?? 0;
      const change = valueNumeric - prevValue;

      await db.insert(macroIndicators).values({
        slug: ind.slug,
        name: ind.name,
        region: ind.region,
        value: valueStr,
        valueNumeric,
        prev: prevValue ? prevValue.toFixed(2).replace(".", ",") : "",
        forecast: "",
        unit: ind.unit,
        change: Number(change.toFixed(4)),
        description: ind.description,
        sourceKey: ind.sourceKey,
        sourceName: ind.sourceName,
        sourceUrl: ind.sourceUrl,
        publishedAt,
        publishedAtRaw,
        reportPeriod,
        syncedAt: now,
        updatedAt: now,
      }).onConflictDoUpdate({
        target: macroIndicators.slug,
        set: { value: valueStr, valueNumeric, prev: prevValue ? prevValue.toFixed(2).replace(".", ",") : sql`prev`, change: Number(change.toFixed(4)), publishedAt, publishedAtRaw, reportPeriod, syncedAt: now, updatedAt: now },
      });
      inserted++;
    } catch (e) {
      errors++;
      console.error(`[macro-engine] Lỗi ${ind.slug}:`, e instanceof Error ? e.message : e);
    }
  }

  // Upsert các chỉ số lãi suất tĩnh (có metadata nguồn rõ ràng)
  for (const item of RATE_FALLBACK) {
    try {
      // onConflictDoNothing: không ghi đè nếu đã có (lãi suất chỉ thay đổi khi kỳ họp)
      const row = {
        slug: item.slug,
        name: item.name,
        region: item.region,
        value: item.value,
        valueNumeric: item.valueNumeric,
        prev: item.prev,
        forecast: item.forecast,
        unit: item.unit,
        change: item.change,
        description: item.description,
        sourceKey: item.sourceKey,
        sourceName: item.sourceName,
        sourceUrl: item.sourceUrl,
        publishedAt: undefined as Date | undefined,
        publishedAtRaw: item.publishedAtRaw,
        reportPeriod: item.reportPeriod,
        syncedAt: now,
        updatedAt: now,
      } satisfies Parameters<typeof db.insert<typeof macroIndicators>>[0] extends unknown ? object : object;
      await db.execute(
        sql`INSERT INTO macro_indicators
          (slug,name,region,value,value_numeric,prev,forecast,unit,change,description,
           source_key,source_name,source_url,published_at_raw,report_period,synced_at,updated_at)
          VALUES (${item.slug},${item.name},${item.region},${item.value},${item.valueNumeric},
                  ${item.prev},${item.forecast},${item.unit},${item.change},${item.description},
                  ${item.sourceKey},${item.sourceName},${item.sourceUrl},
                  ${item.publishedAtRaw},${item.reportPeriod},${now},${now})
          ON CONFLICT (slug) DO NOTHING`
      );
      void row;
      inserted++;
    } catch { skipped++; }
  }

  console.info(`[macro-engine] Xong sau ${Date.now() - t0}ms: ${inserted} upsert, ${skipped} bỏ qua, ${errors} lỗi`);
  return { source: "worldbank+static", inserted, updated, skipped, errors, syncedAt: now.toISOString(), durationMs: Date.now() - t0 };
}

export async function getMacroData(): Promise<LiveMacroItem[]> {
  const rows = await db.select().from(macroIndicators).orderBy(macroIndicators.region, macroIndicators.name);
  const now = new Date().toISOString();
  if (rows.length === 0) {
    // Trả về dữ liệu tĩnh với metadata nguồn rõ ràng khi DB chưa sync
    return RATE_FALLBACK.map((r) => ({ ...r, syncedAt: now }));
  }
  return rows.map((r) => ({
    slug: r.slug,
    name: r.name,
    region: (r.region || "world") as "vn" | "world",
    value: r.value,
    valueNumeric: r.valueNumeric ?? 0,
    prev: r.prev || "",
    forecast: r.forecast || "",
    unit: r.unit || "",
    change: r.change ?? 0,
    description: r.description || "",
    sourceKey: r.sourceKey || "unknown",
    sourceName: r.sourceName || "Không rõ nguồn",
    sourceUrl: r.sourceUrl || "",
    publishedAt: r.publishedAt ? r.publishedAt.toISOString() : null,
    publishedAtRaw: r.publishedAtRaw || "Không có thông tin thời gian",
    reportPeriod: r.reportPeriod || "",
    syncedAt: r.syncedAt.toISOString(),
  }));
}
