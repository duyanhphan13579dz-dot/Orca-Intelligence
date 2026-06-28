// ====================================================================
// Shared types for the Real-time Data Engine
// ====================================================================

export type SyncStatus = "ok" | "syncing" | "error" | "stale";

export interface SyncResult {
  source: string;
  inserted: number;
  updated: number;
  skipped: number;
  errors: number;
  syncedAt: string;        // ISO — thời điểm Orca thu thập
  durationMs: number;
}

export interface LiveNewsItem {
  guid: string;
  title: string;
  summary: string;
  aiSummary: string;
  imageUrl: string | null;  // Ảnh thật từ nguồn (null nếu không có / không được phép)
  link: string;
  sourceKey: string;
  sourceName: string;
  category: string;
  tags: string[];
  impact: "cao" | "trung bình" | "thấp";
  publishedAt: string | null;   // ISO UTC — GIỮ NGUYÊN từ nguồn
  publishedAtRaw: string;       // Chuỗi gốc chưa xử lý
  timezone: string;
  syncedAt: string;             // ISO — Orca sync time
}

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
  sourceUrl: string;
  publishedAt: string | null;   // Giữ nguyên từ nguồn
  publishedAtRaw: string;
  reportPeriod: string;
  syncedAt: string;
}

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
