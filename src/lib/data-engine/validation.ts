// ====================================================================
// Multi-Stage Validation & Quality Scoring Layer
// ====================================================================
import { QUALITY_THRESHOLDS, SOURCE_PRIORITIES } from "./types";
import type { RssItem } from "./rss-parser";

export interface ValidationResult {
  valid: boolean;
  score: number;   // 0-100
  reasons: string[];
}

const MAX_AGE_HOURS = 24;
const ARCHIVE_AGE_HOURS = 72;

// ── Stage 1: Structural validation ──
function validateStructure(item: RssItem): string[] {
  const errs: string[] = [];
  if (!item.title || item.title.length < 5) errs.push("Tiêu đề quá ngắn hoặc thiếu");
  if (!item.guid && !item.link) errs.push("Thiếu guid và link");
  if (!item.link) errs.push("Thiếu link bài gốc");
  if (item.summary && item.summary.length < 10) errs.push("Tóm tắt quá ngắn");
  return errs;
}

// ── Stage 2: Temporal validation ──
function validateTime(item: RssItem): { errors: string[]; ageHours: number } {
  if (!item.publishedAt) {
    return { errors: ["Không có thông tin thời gian phát hành"], ageHours: -1 };
  }
  const ageHours = (Date.now() - item.publishedAt.getTime()) / 3_600_000;
  const errors: string[] = [];
  if (ageHours > ARCHIVE_AGE_HOURS) errors.push(`Tin cũ hơn ${ARCHIVE_AGE_HOURS}h: ${item.publishedAtRaw}`);
  if (ageHours < 0) errors.push("Thời gian phát hành trong tương lai — không hợp lệ");
  return { errors, ageHours };
}

// ── Stage 3: Content quality ──
function scoreContent(item: RssItem): number {
  let score = 50;
  // Title quality
  if (item.title.length > 20) score += 10;
  if (item.title.length > 60) score += 5;
  // Summary quality
  if (item.summary) score += 10;
  if (item.summary && item.summary.length > 100) score += 5;
  // Image
  if (item.imageUrl) score += 8;
  // Tags / categories
  if (item.tags && item.tags.length > 0) score += 5;
  // Source reliability
  if (item.publishedAt) score += 7;
  return Math.min(100, score);
}

// ── Stage 4: Source priority bonus ──
function sourceBonus(sourceKey: string): number {
  const priority = SOURCE_PRIORITIES[sourceKey] ?? 5;
  // Priority 1 = +15, 2 = +10, 3 = +5, 4+ = 0
  return Math.max(0, (5 - priority) * 5);
}

// ── Stage 5: Recency scoring ──
function recencyScore(ageHours: number): number {
  if (ageHours < 0) return 0;
  if (ageHours < 1) return 20;
  if (ageHours < 4) return 15;
  if (ageHours < 8) return 10;
  if (ageHours < 24) return 5;
  return 0;
}

/** Full multi-stage validation pipeline for a news item */
export function validateNewsItem(item: RssItem, sourceKey: string): ValidationResult {
  const reasons: string[] = [];

  // Stage 1: structure
  const structErrors = validateStructure(item);
  if (structErrors.length > 0) {
    return { valid: false, score: 0, reasons: structErrors };
  }

  // Stage 2: time
  const { errors: timeErrors, ageHours } = validateTime(item);
  if (timeErrors.some((e) => e.includes("Tin cũ hơn"))) {
    return { valid: false, score: 0, reasons: timeErrors };
  }
  if (timeErrors.some((e) => e.includes("tương lai"))) {
    return { valid: false, score: 0, reasons: timeErrors };
  }
  reasons.push(...timeErrors); // Non-fatal time warnings

  // Stage 3+4+5: scoring
  const contentScore = scoreContent(item);
  const bonus = sourceBonus(sourceKey);
  const recency = recencyScore(ageHours);
  const total = Math.min(100, contentScore + bonus + recency);

  return {
    valid: total >= QUALITY_THRESHOLDS.MIN_DISPLAY,
    score: total,
    reasons,
  };
}

/** Deduplicate items by normalized title similarity */
export function deduplicateItems<T extends { title: string; guid: string }>(items: T[]): T[] {
  const seen = new Map<string, T>();
  for (const item of items) {
    const key = normalizeTitle(item.title);
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, item);
    }
    // Keep item already in map (first = higher priority since sorted by priority)
  }
  return Array.from(seen.values());
}

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60); // Only compare first 60 chars for near-duplicate detection
}
