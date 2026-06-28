// ====================================================================
// Data Engine — Orchestrator tổng hợp tất cả module đồng bộ.
// Lịch chạy: :00/:15/:30/:45 mỗi giờ (15 phút/lần).
// Mỗi module có single-flight guard riêng — an toàn khi gọi song song.
// ====================================================================

import { syncNews, getRecentNews, getNewsSyncStatus } from "./news-engine";
import { syncMacroIndicators, getMacroData } from "./macro-engine";
import { syncCalendar, getCalendarEvents } from "./calendar-engine";
import type { SyncResult } from "./types";

export type { LiveNewsItem } from "./types";
export type { LiveMacroItem } from "./types";
export type { LiveCalendarEvent } from "./types";
export { getRecentNews, getNewsSyncStatus } from "./news-engine";
export { getMacroData } from "./macro-engine";
export { getCalendarEvents } from "./calendar-engine";

export interface EngineRunResult {
  news: SyncResult[];
  macro: SyncResult;
  calendar: SyncResult;
  totalDurationMs: number;
  ranAt: string;
}

let engineInflight: Promise<EngineRunResult> | null = null;

/** Chạy toàn bộ Data Engine một lần. Single-flight: nếu đang chạy thì chờ. */
export async function runDataEngine(): Promise<EngineRunResult> {
  if (engineInflight) {
    console.info("[data-engine] Đang chạy — chờ kết quả hiện tại...");
    return engineInflight;
  }
  const t0 = Date.now();
  const ranAt = new Date().toISOString();

  engineInflight = (async (): Promise<EngineRunResult> => {
    console.info("[data-engine] Bắt đầu chu kỳ đồng bộ lúc", ranAt);
    const [news, macro, calendar] = await Promise.allSettled([
      syncNews(),
      syncMacroIndicators(),
      syncCalendar(),
    ]);
    const result: EngineRunResult = {
      news: news.status === "fulfilled" ? news.value : [],
      macro: macro.status === "fulfilled" ? macro.value : { source: "macro", inserted: 0, updated: 0, skipped: 0, errors: 1, syncedAt: ranAt, durationMs: 0 },
      calendar: calendar.status === "fulfilled" ? calendar.value : { source: "calendar", inserted: 0, updated: 0, skipped: 0, errors: 1, syncedAt: ranAt, durationMs: 0 },
      totalDurationMs: Date.now() - t0,
      ranAt,
    };
    console.info(`[data-engine] Hoàn tất sau ${result.totalDurationMs}ms`);
    return result;
  })().finally(() => { engineInflight = null; });

  return engineInflight;
}

/** Fire-and-forget: kích hoạt engine chạy nền, không chặn. */
export function triggerDataEngine(): void {
  runDataEngine().catch((e) =>
    console.error("[data-engine] Lỗi:", e instanceof Error ? e.message : e),
  );
}

/** Trạng thái engine để hiển thị trên UI / admin panel. */
export async function getEngineStatus() {
  const newsStatus = await getNewsSyncStatus().catch(() => ({ total: 0, valid: 0, lastSync: null, sourceCount: 0 }));
  return {
    news: newsStatus,
    refreshIntervalSeconds: 900,
    nextRefreshMark: nextQuarterMark(),
  };
}

function nextQuarterMark(): string {
  const now = new Date();
  const nextMark = new Date(now);
  const m = now.getMinutes();
  const nextMinute = Math.floor(m / 15) * 15 + 15;
  nextMark.setMinutes(nextMinute, 0, 0);
  return nextMark.toISOString();
}
