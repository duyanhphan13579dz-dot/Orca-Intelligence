// ====================================================================
// Data Engine Orchestrator v2 — High Performance Architecture
// ────────────────────────────────────────────────────────────────────
// Tất cả Workers chạy SONG SONG, độc lập.
// Một Worker lỗi không dừng các Workers còn lại.
// Pipeline: Fetch → Validate → Deduplicate → Save → Cache → Metrics
// ====================================================================

import { syncNews, getRecentNews, getNewsSyncStatus } from "./news-engine";
import { syncMacroIndicators, getMacroData } from "./macro-engine";
import { syncCalendar, getCalendarEvents } from "./calendar-engine";
import type { SyncResult, EngineRunResult, EngineMetrics } from "./types";

export type { LiveNewsItem } from "./types";
export type { LiveMacroItem } from "./types";
export type { LiveCalendarEvent } from "./types";
export type { EngineRunResult, EngineMetrics } from "./types";
export { getRecentNews, getNewsSyncStatus } from "./news-engine";
export { getMacroData } from "./macro-engine";
export { getCalendarEvents } from "./calendar-engine";

// Single-flight guard prevents duplicate concurrent runs
let engineInflight: Promise<EngineRunResult> | null = null;
let lastResult: EngineRunResult | null = null;

function computeMetrics(
  newsResults: SyncResult[],
  macroResult: SyncResult,
  calendarResult: SyncResult,
  totalMs: number,
): EngineMetrics {
  const all = [...newsResults, macroResult, calendarResult];
  const totalInserted = all.reduce((a, r) => a + r.inserted, 0);
  const totalSkipped = all.reduce((a, r) => a + r.skipped, 0);
  const totalErrors = all.reduce((a, r) => a + r.errors, 0);
  const sourcesOk = all.filter((r) => r.errors === 0).length;
  const sourcesFailed = all.filter((r) => r.errors > 0).length;
  const totalItems = totalInserted + totalSkipped;
  const successRate = totalItems > 0 ? Math.round((totalInserted / totalItems) * 100) : 100;
  const qualityScores = newsResults.map((r) => r.qualityAvg ?? 0).filter((s) => s > 0);
  const avgQualityScore = qualityScores.length > 0
    ? Math.round(qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length)
    : 0;

  return {
    totalFetchMs: newsResults.reduce((a, r) => a + r.durationMs, 0),
    totalValidateMs: 0, // Validation is inline — counted in fetch time
    totalSaveMs: 0,
    totalInserted,
    totalSkipped,
    totalErrors,
    successRate,
    avgQualityScore,
    sourcesOk,
    sourcesFailed,
  };
}

/**
 * Chạy toàn bộ Data Engine — tất cả Workers song song.
 * Single-flight: nếu đang chạy thì chờ kết quả hiện tại.
 */
export async function runDataEngine(): Promise<EngineRunResult> {
  if (engineInflight) {
    console.info("[data-engine] Đang chạy — chờ kết quả hiện tại...");
    return engineInflight;
  }

  const t0 = Date.now();
  const ranAt = new Date().toISOString();
  console.info("[data-engine] ▶ Bắt đầu chu kỳ đồng bộ lúc", ranAt);

  engineInflight = (async (): Promise<EngineRunResult> => {
    // ── All 3 workers start SIMULTANEOUSLY ──────────────────────────
    const [newsSettled, macroSettled, calendarSettled] = await Promise.allSettled([
      syncNews(),           // News Engine (3 sources in parallel)
      syncMacroIndicators(), // Macro Engine (World Bank + static)
      syncCalendar(),       // Calendar Engine (computed events)
    ]);

    const emptyResult = (source: string): SyncResult => ({
      source, inserted: 0, updated: 0, skipped: 0, errors: 1, syncedAt: ranAt, durationMs: 0,
    });

    const newsResults = newsSettled.status === "fulfilled" ? newsSettled.value : [emptyResult("news")];
    const macroResult = macroSettled.status === "fulfilled" ? macroSettled.value : emptyResult("macro");
    const calendarResult = calendarSettled.status === "fulfilled" ? calendarSettled.value : emptyResult("calendar");
    const totalDurationMs = Date.now() - t0;
    const metrics = computeMetrics(newsResults, macroResult, calendarResult, totalDurationMs);

    const result: EngineRunResult = { news: newsResults, macro: macroResult, calendar: calendarResult, totalDurationMs, ranAt, metrics };
    lastResult = result;

    console.info(
      `[data-engine] ✓ Hoàn tất ${totalDurationMs}ms | ` +
      `+${metrics.totalInserted} items | quality: ${metrics.avgQualityScore}/100 | ` +
      `success: ${metrics.successRate}%`,
    );
    return result;
  })().finally(() => { engineInflight = null; });

  return engineInflight;
}

/** Fire-and-forget trigger — không block, không throw */
export function triggerDataEngine(): void {
  runDataEngine().catch((e) =>
    console.error("[data-engine] Lỗi:", e instanceof Error ? e.message : e),
  );
}

/** Lấy kết quả lần chạy gần nhất (dùng cho dashboard) */
export function getLastEngineResult(): EngineRunResult | null {
  return lastResult;
}

/** Trạng thái engine để hiển thị trên admin panel */
export async function getEngineStatus() {
  const newsStatus = await getNewsSyncStatus().catch(() => ({
    total: 0, valid: 0, lastSync: null, sourceCount: 0,
  }));
  return {
    news: newsStatus,
    refreshIntervalSeconds: 900,
    nextRefreshMark: nextQuarterMark(),
    lastResult,
    isRunning: engineInflight !== null,
  };
}

function nextQuarterMark(): string {
  const now = new Date();
  const next = new Date(now);
  next.setMinutes(Math.floor(now.getMinutes() / 15) * 15 + 15, 0, 0);
  return next.toISOString();
}
