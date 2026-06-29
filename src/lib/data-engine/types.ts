// ====================================================================
// Data Engine Types — High Performance Architecture v2
// ====================================================================

export type SyncStatus = "ok" | "syncing" | "error" | "stale";

export interface SyncResult {
  source: string;
  inserted: number;
  updated: number;
  skipped: number;
  errors: number;
  syncedAt: string;
  durationMs: number;
  qualityAvg?: number;    // Điểm chất lượng TB của batch (0-100)
  retries?: number;
}

export interface WorkerResult {
  worker: string;
  status: "success" | "error" | "partial";
  results: SyncResult[];
  totalDurationMs: number;
  startedAt: string;
  completedAt: string;
  error?: string;
}

export interface EngineRunResult {
  news: SyncResult[];
  macro: SyncResult;
  calendar: SyncResult;
  totalDurationMs: number;
  ranAt: string;
  metrics: EngineMetrics;
}

export interface EngineMetrics {
  totalFetchMs: number;
  totalValidateMs: number;
  totalSaveMs: number;
  totalInserted: number;
  totalSkipped: number;
  totalErrors: number;
  successRate: number;       // 0-100 %
  avgQualityScore: number;   // 0-100
  sourcesOk: number;
  sourcesFailed: number;
}

// ── Dữ liệu tin tức ──
export interface LiveNewsItem {
  guid: string;
  title: string;
  summary: string;
  aiSummary: string;
  imageUrl: string | null;
  link: string;
  sourceKey: string;
  sourceName: string;
  sourcePriority: number;     // Mức ưu tiên nguồn (1=cao nhất)
  category: string;
  tags: string[];
  impact: "cao" | "trung bình" | "thấp";
  qualityScore: number;       // 0-100 điểm chất lượng
  publishedAt: string | null;
  publishedAtRaw: string;
  timezone: string;
  syncedAt: string;
}

// ── Dữ liệu vĩ mô ──
export interface LiveMacroItem {
  slug: string;
  name: string;
  region: "vn" | "world";
  value: string;
  valueNumeric: number;
  prev: string;
  forecast: string;
  unit: string;
  change: number;
  description: string;
  sourceKey: string;
  sourceName: string;
  sourcePriority: number;
  sourceUrl: string;
  publishedAt: string | null;
  publishedAtRaw: string;
  reportPeriod: string;
  syncedAt: string;
  qualityScore: number;
}

// ── Lịch kinh tế ──
export interface LiveCalendarEvent {
  eventId: string;
  eventDate: string;
  eventTime: string;
  timezone: string;
  country: string;
  flag: string;
  event: string;
  impact: "cao" | "trung bình" | "thấp";
  actual: string;
  forecast: string;
  previous: string;
  status: "Sắp diễn ra" | "Đang diễn ra" | "Đã công bố";
  sourceKey: string;
  syncedAt: string;
}

// ── Quality scoring constants ──
export const QUALITY_THRESHOLDS = {
  MIN_DISPLAY: 40,   // Điểm tối thiểu để hiển thị
  GOOD: 70,
  EXCELLENT: 90,
};

export const SOURCE_PRIORITIES: Record<string, number> = {
  // Tin tức VN
  "vnexpress-kinh-doanh": 1,
  "cafef": 2,
  "vietstock": 3,
  // Tin tức quốc tế
  "reuters": 1,
  "cnbc-finance": 2,
  "ft": 3,
  "marketwatch": 4,
  "investing-news": 5,
  // Dữ liệu
  "worldbank": 1,
  "fed-static": 1,
  "sbv-static": 1,
};
