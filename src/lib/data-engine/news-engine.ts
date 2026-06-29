// ====================================================================
// News Engine v2 — High Performance Parallel Architecture
// ────────────────────────────────────────────────────────────────────
// Thay thế hoàn toàn vòng lặp tuần tự (for...of) bằng Promise.all.
// Mỗi nguồn được quét đồng thời, độc lập — một nguồn lỗi không ảnh
// hưởng các nguồn còn lại.
// Pipeline: Fetch → Validate → Quality Score → Deduplicate → Save DB
// published_at: KHÔNG thay đổi — giữ nguyên từ nguồn.
// synced_at: thời điểm Orca thu thập.
// ====================================================================

import { db } from "@/db";
import { newsItems } from "@/db/schema";
import { eq, sql, and, lt } from "drizzle-orm";
import { fetchRSS } from "./rss-parser";
import { validateNewsItem, deduplicateItems } from "./validation";
import { SOURCE_PRIORITIES, QUALITY_THRESHOLDS } from "./types";
import type { SyncResult, LiveNewsItem } from "./types";

const ARCHIVE_AGE_HOURS = 72;

interface SourceDef {
  key: string;
  name: string;
  url: string;
  category: string;
  region: "vn" | "world";
  maxItems: number;
  priority: number;
}

// ─── Nguồn tin tức ưu tiên (song song, không tuần tự) ───────────────
const SOURCES: SourceDef[] = [
  // === Trong nước (VN) ===
  {
    key: "vnexpress-kinh-doanh", name: "VnExpress Kinh doanh",
    url: "https://vnexpress.net/rss/kinh-doanh.rss",
    category: "Trong nước", region: "vn", maxItems: 20, priority: 1,
  },
  // === Quốc tế ===
  {
    key: "cnbc-finance", name: "CNBC Finance",
    url: "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=19854910",
    category: "Quốc tế", region: "world", maxItems: 15, priority: 2,
  },
  {
    key: "investing-news", name: "Investing.com",
    url: "https://www.investing.com/rss/news.rss",
    category: "Quốc tế", region: "world", maxItems: 15, priority: 3,
  },
];

function classifyImpact(title: string): "cao" | "trung bình" | "thấp" {
  const t = title.toLowerCase();
  const high = ["fed", "ecb", "boj", "lãi suất", "interest rate", "gdp", "cpi", "nonfarm",
    "khủng hoảng", "sụp đổ", "crash", "khẩn cấp", "chiến tranh", "war", "tariff", "inflation"];
  const med = ["ngân hàng", "bank", "chứng khoán", "stock market", "vn-index", "nasdaq",
    "s&p", "dầu", "vàng", "gold", "oil", "tăng trưởng", "growth", "lạm phát"];
  if (high.some((k) => t.includes(k))) return "cao";
  if (med.some((k) => t.includes(k))) return "trung bình";
  return "thấp";
}

function buildAiSummary(summary: string, title: string, sourceName: string): string {
  const text = (summary || title).slice(0, 220);
  return `[${sourceName}] ${text}${text.length >= 220 ? "..." : ""}`;
}

// ── Single-source worker (runs in parallel) ──────────────────────────
async function runSourceWorker(src: SourceDef, now: Date): Promise<SyncResult> {
  const t0 = Date.now();
  let inserted = 0, skipped = 0, errors = 0;
  let qualitySum = 0, qualityCount = 0;

  try {
    const items = await fetchRSS(src.url, src.maxItems);
    console.info(`[news-engine:${src.key}] ✓ ${items.length} items fetched in ${Date.now() - t0}ms`);

    // Validate + score all items first (synchronous, fast)
    const validated = items
      .map((item) => ({ item, vr: validateNewsItem(item, src.key) }))
      .filter(({ vr }) => {
        if (!vr.valid) {
          skipped++;
          return false;
        }
        return true;
      });

    // Deduplicate within this source batch
    const deduped = deduplicateItems(validated.map(({ item }) => item));

    // Parallel DB upserts (batch of 10)
    const BATCH = 10;
    for (let i = 0; i < deduped.length; i += BATCH) {
      const batch = deduped.slice(i, i + BATCH);
      const upsertResults = await Promise.allSettled(batch.map(async (item) => {
        const vr = validated.find((v) => v.item.guid === item.guid)!.vr;
        const guid = item.guid || item.link;
        const tags = JSON.stringify([...(item.tags || []), src.category].filter(Boolean));
        const row = {
          guid,
          title: item.title,
          summary: item.summary || "",
          aiSummary: buildAiSummary(item.summary, item.title, src.name),
          imageUrl: item.imageUrl || "",
          link: item.link || "",
          sourceKey: src.key,
          sourceName: src.name,
          category: src.category,
          tags,
          impact: classifyImpact(item.title),
          publishedAt: item.publishedAt ?? null,
          publishedAtRaw: item.publishedAtRaw || "Không có thông tin thời gian",
          timezone: "+07:00",
          syncedAt: now,
          isValid: true,
        };
        await db.insert(newsItems)
          .values(row)
          .onConflictDoUpdate({
            target: newsItems.guid,
            set: { aiSummary: row.aiSummary, imageUrl: row.imageUrl, syncedAt: now, isValid: true },
          });
        qualitySum += vr.score;
        qualityCount++;
        inserted++;
      }));
      errors += upsertResults.filter((r) => r.status === "rejected").length;
    }

    // Archive old items (non-blocking)
    const cutoff = new Date(Date.now() - ARCHIVE_AGE_HOURS * 3_600_000);
    db.update(newsItems)
      .set({ isValid: false })
      .where(and(eq(newsItems.sourceKey, src.key), lt(newsItems.publishedAt, cutoff)))
      .catch(() => {});

  } catch (e) {
    errors++;
    console.error(`[news-engine:${src.key}] ✗ Lỗi:`, e instanceof Error ? e.message : e);
  }

  return {
    source: src.key,
    inserted,
    updated: 0,
    skipped,
    errors,
    syncedAt: now.toISOString(),
    durationMs: Date.now() - t0,
    qualityAvg: qualityCount > 0 ? Math.round(qualitySum / qualityCount) : 0,
  };
}

// ── Main sync: all sources run IN PARALLEL ───────────────────────────
export async function syncNews(): Promise<SyncResult[]> {
  const now = new Date();
  const t0 = Date.now();
  console.info(`[news-engine] Bắt đầu parallel fetch ${SOURCES.length} nguồn...`);

  // ALL sources fetched simultaneously — no sequential waiting
  const settled = await Promise.allSettled(
    SOURCES.map((src) => runSourceWorker(src, now)),
  );

  const results = settled.map((r, i) =>
    r.status === "fulfilled"
      ? r.value
      : { source: SOURCES[i].key, inserted: 0, updated: 0, skipped: 0, errors: 1, syncedAt: now.toISOString(), durationMs: 0, qualityAvg: 0 },
  );

  const total = results.reduce((a, r) => a + r.inserted, 0);
  console.info(`[news-engine] ✓ Hoàn tất ${total} items trong ${Date.now() - t0}ms (parallel)`);
  return results;
}

export async function getRecentNews(
  limit = 20,
  category?: string,
  maxHours = 24,
): Promise<LiveNewsItem[]> {
  const cutoff = new Date(Date.now() - maxHours * 3_600_000);
  let rows: typeof newsItems.$inferSelect[] = [];
  try {
    rows = await db.select().from(newsItems)
      .where(
        and(
          eq(newsItems.isValid, true),
          sql`${newsItems.publishedAt} > ${cutoff} OR ${newsItems.publishedAt} IS NULL`,
          ...(category ? [eq(newsItems.category, category)] : []),
        ),
      )
      .orderBy(sql`${newsItems.publishedAt} DESC NULLS LAST, ${newsItems.syncedAt} DESC`)
      .limit(limit);
  } catch (e) {
    console.warn("[news-engine] getRecentNews fallback:", e instanceof Error ? e.message : e);
    return [];
  }

  return rows
    .map((r) => ({
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
      publishedAt: r.publishedAt ? r.publishedAt.toISOString() : null,
      publishedAtRaw: r.publishedAtRaw || "Không có thông tin thời gian",
      timezone: r.timezone || "+07:00",
      syncedAt: r.syncedAt.toISOString(),
      sourcePriority: SOURCE_PRIORITIES[r.sourceKey] ?? 5,
      qualityScore: QUALITY_THRESHOLDS.GOOD, // Rows in DB already passed validation
    }))
    // Secondary quality filter before display
    .filter((n) => n.qualityScore >= QUALITY_THRESHOLDS.MIN_DISPLAY);
}

export async function getNewsSyncStatus(): Promise<{
  total: number; valid: number; lastSync: string | null; sourceCount: number;
}> {
  try {
    const r = await db.select({
      total: sql<number>`count(*)`,
      valid: sql<number>`count(*) filter (where ${newsItems.isValid} = true)`,
      lastSync: sql<string>`max(${newsItems.syncedAt})`,
    }).from(newsItems);
    return { total: Number(r[0]?.total ?? 0), valid: Number(r[0]?.valid ?? 0), lastSync: r[0]?.lastSync ?? null, sourceCount: SOURCES.length };
  } catch {
    return { total: 0, valid: 0, lastSync: null, sourceCount: SOURCES.length };
  }
}

function tryParseJson(s: string | null | undefined): string[] {
  try { return JSON.parse(s || "[]"); } catch { return []; }
}
