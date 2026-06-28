// ====================================================================
// News Engine — thu thập tin tức từ RSS công khai.
// Nguồn: VnExpress (trong nước), CNBC & Investing.com (quốc tế).
// published_at: GIỮ NGUYÊN từ nguồn, KHÔNG chỉnh sửa hoặc giả lập.
// synced_at:    thời điểm Orca thu thập.
// Loại bỏ: tin > 24h, tin trùng guid, tin thiếu nguồn.
// ====================================================================

import { db } from "@/db";
import { newsItems } from "@/db/schema";
import { eq, sql, and, lt } from "drizzle-orm";
import { fetchRSS, validateItem, type RssItem } from "./rss-parser";
import type { SyncResult, LiveNewsItem } from "./types";

const MAX_AGE_HOURS = 24; // Ngưỡng "tin mới" để hiển thị ở khu vực realtime
const ARCHIVE_AGE_HOURS = 72; // Giữ trong DB tối đa 72h, sau đó có thể đánh dấu cũ

interface SourceDef {
  key: string;
  name: string;
  url: string;
  category: string;
  region: "vn" | "world";
  maxItems: number;
}

const SOURCES: SourceDef[] = [
  // --- Trong nước (VN) ---
  {
    key: "vnexpress-kinh-doanh", name: "VnExpress Kinh doanh",
    url: "https://vnexpress.net/rss/kinh-doanh.rss",
    category: "Trong nước", region: "vn", maxItems: 20,
  },
  // --- Quốc tế ---
  {
    key: "cnbc-finance", name: "CNBC Finance",
    url: "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=19854910",
    category: "Quốc tế", region: "world", maxItems: 15,
  },
  {
    key: "investing-news", name: "Investing.com News",
    url: "https://www.investing.com/rss/news.rss",
    category: "Quốc tế", region: "world", maxItems: 15,
  },
];

function classifyImpact(title: string, category: string): "cao" | "trung bình" | "thấp" {
  const t = title.toLowerCase();
  const high = ["fed", "ecb", "boj", "lãi suất", "interest rate", "gdp", "cpi", "nonfarm",
    "khủng hoảng", "sụp đổ", "crash", "khẩn cấp", "chiến tranh", "war", "tariff"];
  const med = ["ngân hàng", "bank", "chứng khoán", "stock market", "vn-index", "nasdaq",
    "s&p", "dầu", "vàng", "gold", "oil", "tăng trưởng", "growth", "lạm phát", "inflation"];
  if (high.some((k) => t.includes(k))) return "cao";
  if (med.some((k) => t.includes(k))) return "trung bình";
  return "thấp";
}

function buildAiSummary(item: RssItem, sourceName: string): string {
  // Tóm tắt AI từ nội dung thật (không tự tạo nội dung)
  const s = item.summary || item.title;
  const truncated = s.length > 200 ? s.slice(0, 200) + "..." : s;
  return `Nguồn ${sourceName}: ${truncated}`;
}

function buildGuid(item: RssItem, sourceKey: string): string {
  return item.guid || item.link || `${sourceKey}-${Date.now()}-${Math.random()}`;
}

export async function syncNews(): Promise<SyncResult[]> {
  const results: SyncResult[] = [];
  const now = new Date();

  for (const src of SOURCES) {
    const t0 = Date.now();
    let inserted = 0, updated = 0, skipped = 0, errors = 0;
    try {
      const items = await fetchRSS(src.url, src.maxItems);
      console.info(`[news-engine] ${src.key}: nhận ${items.length} tin`);

      for (const item of items) {
        try {
          // --- Quality check ---
          const err = validateItem(item, src.key);
          if (err) {
            // Tin quá cũ hoặc thiếu trường → bỏ qua, không lưu vào DB
            if (err.includes("Tin cũ")) {
              console.warn(`[news-engine] Bỏ qua (${err})`);
              skipped++;
              continue;
            }
            // Thiếu title / guid → log và bỏ
            console.warn(`[news-engine] Dữ liệu không hợp lệ: ${err}`);
            skipped++;
            continue;
          }

          const guid = buildGuid(item, src.key);
          const tags = [...(item.tags || []), src.category].filter(Boolean);

          const row = {
            guid,
            title: item.title,
            summary: item.summary || "",
            aiSummary: buildAiSummary(item, src.name),
            imageUrl: item.imageUrl || "",   // Ảnh thật từ nguồn RSS
            link: item.link || "",
            sourceKey: src.key,
            sourceName: src.name,
            category: src.category,
            tags: JSON.stringify(tags),
            impact: classifyImpact(item.title, src.category),
            // publishedAt: GIỮ NGUYÊN từ nguồn — KHÔNG chỉnh sửa
            publishedAt: item.publishedAt ?? null,
            publishedAtRaw: item.publishedAtRaw || "Không có thông tin thời gian",
            timezone: "+07:00",
            syncedAt: now,
            isValid: true,
          };

          // Upsert (chỉ cập nhật aiSummary và syncedAt nếu đã tồn tại)
          await db.insert(newsItems)
            .values(row)
            .onConflictDoUpdate({
              target: newsItems.guid,
              set: { aiSummary: row.aiSummary, imageUrl: row.imageUrl, syncedAt: now, isValid: true },
            });
          inserted++;
        } catch (e) {
          errors++;
          console.error("[news-engine] Lỗi lưu item:", e instanceof Error ? e.message : e);
        }
      }

      // Đánh dấu tin cũ hơn ARCHIVE_AGE_HOURS là không hợp lệ (không xóa, chỉ ẩn)
      const cutoff = new Date(Date.now() - ARCHIVE_AGE_HOURS * 3_600_000);
      await db.update(newsItems)
        .set({ isValid: false })
        .where(and(eq(newsItems.sourceKey, src.key), lt(newsItems.publishedAt, cutoff)))
        .catch(() => { /* non-critical */ });

    } catch (e) {
      errors++;
      console.error(`[news-engine] Lỗi nguồn ${src.key}:`, e instanceof Error ? e.message : e);
    }

    results.push({ source: src.key, inserted, updated, skipped, errors, syncedAt: now.toISOString(), durationMs: Date.now() - t0 });
  }
  return results;
}

export async function getRecentNews(limit = 20, category?: string, maxHours = MAX_AGE_HOURS): Promise<LiveNewsItem[]> {
  const cutoff = new Date(Date.now() - maxHours * 3_600_000);
  const query = db.select().from(newsItems)
    .where(
      and(
        eq(newsItems.isValid, true),
        sql`${newsItems.publishedAt} > ${cutoff} OR ${newsItems.publishedAt} IS NULL`,
        ...(category ? [eq(newsItems.category, category)] : []),
      ),
    )
    .orderBy(sql`${newsItems.publishedAt} DESC NULLS LAST, ${newsItems.syncedAt} DESC`)
    .limit(limit);

  const rows = await query;
  return rows.map((r) => ({
    guid: r.guid,
    title: r.title,
    summary: r.summary || "",
    aiSummary: r.aiSummary || "",
    imageUrl: r.imageUrl || null,
    link: r.link,
    sourceKey: r.sourceKey,
    sourceName: r.sourceName,
    category: r.category || "",
    tags: tryParseJson(r.tags),
    impact: (r.impact || "thấp") as LiveNewsItem["impact"],
    // publishedAt: KHÔNG chỉnh sửa, trả nguyên như lưu
    publishedAt: r.publishedAt ? r.publishedAt.toISOString() : null,
    publishedAtRaw: r.publishedAtRaw || "Không có thông tin thời gian",
    timezone: r.timezone || "+07:00",
    syncedAt: r.syncedAt.toISOString(),
  }));
}

export async function getNewsSyncStatus(): Promise<{ total: number; valid: number; lastSync: string | null; sourceCount: number }> {
  const r = await db.select({
    total: sql<number>`count(*)`,
    valid: sql<number>`count(*) filter (where ${newsItems.isValid} = true)`,
    lastSync: sql<string>`max(${newsItems.syncedAt})`,
  }).from(newsItems);
  return {
    total: Number(r[0]?.total ?? 0),
    valid: Number(r[0]?.valid ?? 0),
    lastSync: r[0]?.lastSync ?? null,
    sourceCount: SOURCES.length,
  };
}

function tryParseJson(s: string | null | undefined): string[] {
  try { return JSON.parse(s || "[]"); } catch { return []; }
}
