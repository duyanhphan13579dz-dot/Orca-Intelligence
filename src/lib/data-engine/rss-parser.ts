// ====================================================================
// Lightweight RSS/Atom parser (no external deps)
// Parses pubDate EXACTLY as provided by source — never manipulates.
// ====================================================================

export interface RssItem {
  guid: string;
  title: string;
  link: string;
  summary: string;
  imageUrl: string | null;  // Ảnh thật từ nguồn (enclosure / media:thumbnail / img trong desc)
  publishedAtRaw: string;   // Chuỗi gốc từ nguồn
  publishedAt: Date | null; // Đã parse, null nếu nguồn không cung cấp
  tags: string[];
}

const UA = "Mozilla/5.0 (compatible; OrcaBot/2.0; +https://orcafinancial.vn)";
const MAX_RETRIES_RSS = 2;

function getTextContent(el: Element | null, tag: string): string {
  if (!el) return "";
  const child = el.getElementsByTagName(tag)[0];
  if (!child) return "";
  return (child.textContent ?? "").trim();
}

function parsePubDate(raw: string): Date | null {
  if (!raw) return null;
  // Standard RSS RFC 2822: "Sun, 28 Jun 2026 17:13:41 +0700"
  // ISO 8601 variant: "2026-06-28T10:13:41Z"
  try {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) return d;
  } catch { /* */ }
  return null;
}

/** Validate: trả về false nếu tin quá cũ hoặc thời gian sai */
export function isRecentItem(publishedAt: Date | null, maxHours = 24): boolean {
  if (!publishedAt) return true; // không có timestamp → không lọc, để lớp trên quyết định
  const diffHours = (Date.now() - publishedAt.getTime()) / 3_600_000;
  return diffHours <= maxHours;
}

export async function fetchRSS(url: string, maxItems = 30): Promise<RssItem[]> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= MAX_RETRIES_RSS; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { Accept: "application/rss+xml, application/xml, text/xml, */*", "User-Agent": UA },
        signal: AbortSignal.timeout(12_000),
        next: { revalidate: 900 },
      });
      if (!res.ok) throw new Error(`RSS HTTP ${res.status}`);
      const text = await res.text();
      return parseRSSText(text, maxItems);
    } catch (e) {
      lastErr = e;
      if (attempt < MAX_RETRIES_RSS) await new Promise((r) => setTimeout(r, 600 * attempt));
    }
  }
  throw new Error(`fetchRSS failed after ${MAX_RETRIES_RSS} attempts: ${url} — ${lastErr instanceof Error ? lastErr.message : lastErr}`);
}

export function parseRSSText(text: string, maxItems = 30): RssItem[] {
  // Use DOMParser-compatible fallback via string parsing for Node.js
  const items: RssItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match: RegExpExecArray | null;
  let count = 0;

  const extract = (block: string, tag: string): string => {
    const re = new RegExp(`<${tag}(?:[^>]*)>([\\s\\S]*?)</${tag}>`, "i");
    const m = re.exec(block);
    if (!m) return "";
    // Strip CDATA
    const val = m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim();
    // Decode basic HTML entities
    return val.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/<[^>]+>/g, "").trim();
  };

  const extractImageUrl = (block: string): string | null => {
    // 1. enclosure tag (VnExpress, Reuters, most RSS feeds)
    const enc = /enclosure[^>]+url="(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp|gif))"/i.exec(block);
    if (enc) return enc[1];
    // 2. media:thumbnail or media:content
    const med = /media:(?:thumbnail|content)[^>]+url="(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp))/i.exec(block);
    if (med) return med[1];
    // 3. img src inside description/content (strip CDATA first)
    const descM = /<description>([\s\S]*?)<\/description>/i.exec(block);
    if (descM) {
      const plain = descM[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
      const imgM = /src="(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp|gif))"/i.exec(plain);
      if (imgM) return imgM[1];
    }
    return null;
  };

  const extractRaw = (block: string, tag: string): string => {
    const re = new RegExp(`<${tag}(?:[^>]*)>([\\s\\S]*?)</${tag}>`, "i");
    const m = re.exec(block);
    return m ? m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim() : "";
  };

  // eslint-disable-next-line no-cond-assign
  while ((match = itemRegex.exec(text)) !== null && count < maxItems) {
    const block = match[1];
    const title = extract(block, "title");
    if (!title) continue;

    const link = extract(block, "link") || extract(block, "guid");
    const guid = extract(block, "guid") || link;
    const desc = extract(block, "description") || extract(block, "summary");
    const pubRaw = extractRaw(block, "pubDate") || extractRaw(block, "updated") || extractRaw(block, "dc:date") || "";
    const publishedAt = parsePubDate(pubRaw);

    // --- Extract real image URL from source (not placeholder) ---
    const imageUrl = extractImageUrl(block);

    const cats: string[] = [];
    const catRe = /<category>([\s\S]*?)<\/category>/gi;
    let cm: RegExpExecArray | null;
    // eslint-disable-next-line no-cond-assign
    while ((cm = catRe.exec(block)) !== null) {
      const c = cm[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim();
      if (c) cats.push(c);
    }

    items.push({ guid, title, link, imageUrl, summary: desc.slice(0, 500), publishedAtRaw: pubRaw, publishedAt, tags: cats });
    count++;
  }
  return items;
}

/** Quality checks for a single RSS item. Returns null and logs if invalid. */
export function validateItem(item: RssItem, source: string): string | null {
  if (!item.title) return "Thiếu tiêu đề";
  if (!item.guid && !item.link) return "Thiếu guid và link";
  // Phát hiện tin quá cũ (> 72 giờ) — không loại, chỉ cảnh báo
  if (item.publishedAt && !isRecentItem(item.publishedAt, 72)) {
    return `Tin cũ hơn 72h: ${item.publishedAtRaw} (${source})`;
  }
  return null;
}
