import Link from "next/link";
import { PageHeader, ImpactBadge, Badge } from "@/components/ui";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { LiveBadge } from "@/components/LiveBadge";
import { BRAND_STICKER_SRC } from "@/components/brand/OrcaLogo";
import { getRecentNews, getNewsSyncStatus } from "@/lib/data-engine";
import type { LiveNewsItem } from "@/lib/data-engine";
import { getNews as getFallbackNews } from "@/lib/market-data";

export const metadata = { title: "Tin tức" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Hiển thị ảnh tin tức: dùng ảnh thật từ nguồn, fallback sang placeholder SVG nếu không có. */
function NewsImage({ src, alt, className }: { src: string | null; alt: string; className?: string }) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        className={className}
        loading="lazy"
        decoding="async"
        onError={undefined}
        referrerPolicy="no-referrer"
      />
    );
  }
  // Placeholder khi không có ảnh thật
  return (
    <div className={`flex items-center justify-center bg-navy/50 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={BRAND_STICKER_SRC} alt="Orca Financial" className="h-12 w-12 opacity-30" />
    </div>
  );
}

function impactFromStr(s: string): "cao" | "trung bình" | "thấp" {
  if (s === "cao") return "cao";
  if (s === "trung bình") return "trung bình";
  return "thấp";
}

function buildLinkForItem(item: LiveNewsItem): string {
  // Tin từ DB dùng link gốc, tin fallback dùng slug nội bộ
  return item.link || `/tin-tuc/${item.guid}`;
}

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const sp = await searchParams;
  const cat = sp.cat;
  const syncStatus = await getNewsSyncStatus().catch(() => null);

  // Lấy tin từ DB (dữ liệu thật, có published_at từ nguồn)
  let liveNews = await getRecentNews(40, cat, 24).catch(() => []);
  const isLive = liveNews.length > 0;

  // Fallback sang mock khi DB chưa có tin (lần đầu deploy / engine chưa chạy)
  if (liveNews.length === 0) {
    const mock = getFallbackNews();
    liveNews = mock.map((n) => ({
      guid: n.slug,
      title: n.title,
      summary: n.summary,
      aiSummary: `Nguồn ${n.source}: ${n.summary}`,
      imageUrl: null,
      link: `/tin-tuc/${n.slug}`,
      sourceKey: n.source.toLowerCase(),
      sourceName: n.source,
      category: n.category,
      tags: n.tags,
      impact: impactFromStr(n.impact),
      publishedAt: null,
      publishedAtRaw: "Dữ liệu mẫu — chưa có tin thực. Data Engine đang khởi tạo...",
      timezone: "+07:00",
      syncedAt: new Date().toISOString(),
      sourcePriority: 5,
      qualityScore: 0,
    }));
  }

  const cats = Array.from(new Set(liveNews.map((n) => n.category).filter(Boolean)));
  const filtered = cat ? liveNews.filter((n) => n.category === cat) : liveNews;
  const featured = filtered[0];
  const rest = filtered.slice(1);

  return (
    <div>
      <Breadcrumbs items={[{ label: "Tin tức" }]} />
      <PageHeader
        title="Tin tức tài chính"
        subtitle="Tin tức thời gian thực từ VnExpress, CNBC, Investing.com. Chỉ hiển thị tin trong 24 giờ gần nhất. Mỗi tin giữ nguyên thời gian phát hành từ nguồn gốc."
        action={<LiveBadge live={isLive} />}
      />

      {/* Trạng thái đồng bộ */}
      {syncStatus && (
        <div className="mb-4 rounded-lg border border-white/5 bg-white/[0.02] px-4 py-2 text-xs text-muted">
          <span className={isLive ? "text-emerald-400" : "text-gold"}>
            {isLive ? "🟢" : "🟡"}
          </span>{" "}
          Data Engine: {syncStatus.total} tin đã lưu • {syncStatus.valid} tin hợp lệ •{" "}
          {syncStatus.sourceCount} nguồn •{" "}
          Đồng bộ lúc: {syncStatus.lastSync ? new Date(syncStatus.lastSync).toLocaleString("vi-VN") : "Chưa đồng bộ"}
        </div>
      )}

      {!isLive && (
        <div className="mb-4 rounded-lg border border-gold/20 bg-gold/5 px-4 py-2 text-xs text-muted">
          ⚠️ Đang hiển thị dữ liệu mẫu. Data Engine chạy trong nền, tin thật sẽ xuất hiện sau vài phút.
        </div>
      )}

      <div className="mb-5 flex flex-wrap gap-1.5">
        <Link href="/tin-tuc" className={`rounded-full px-3 py-1 text-xs ${!cat ? "gold-gradient text-navy" : "glass text-muted hover:text-white"}`}>Tất cả</Link>
        {cats.map((c) => (
          <Link key={c} href={`/tin-tuc?cat=${encodeURIComponent(c)}`} className={`rounded-full px-3 py-1 text-xs ${cat === c ? "gold-gradient text-navy" : "glass text-muted hover:text-white"}`}>{c}</Link>
        ))}
      </div>

      {featured && (
        <a href={buildLinkForItem(featured)} target={featured.link ? "_blank" : undefined} rel={featured.link ? "noopener noreferrer" : undefined} className="glass group mb-6 grid overflow-hidden rounded-xl md:grid-cols-2">
          <NewsImage src={featured.imageUrl} alt={featured.title} className="h-56 w-full object-cover md:h-full" />
          <div className="p-6">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge tone="gold">{featured.category || featured.sourceName}</Badge>
              <ImpactBadge impact={featured.impact} />
            </div>
            <h2 className="text-xl font-bold group-hover:text-gold">{featured.title}</h2>
            <p className="mt-2 text-sm text-muted">{featured.summary || featured.aiSummary}</p>
            <div className="mt-3">
              <DataSourceBadge
                sourceName={featured.sourceName}
                publishedAt={featured.publishedAt}
                publishedAtRaw={featured.publishedAtRaw}
                syncedAt={featured.syncedAt}
                status={isLive ? "ok" : "syncing"}
              />
            </div>
          </div>
        </a>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {rest.map((n) => (
          <a key={n.guid} href={buildLinkForItem(n)} target={n.link ? "_blank" : undefined} rel={n.link ? "noopener noreferrer" : undefined} className="glass group overflow-hidden rounded-xl transition hover:border-gold/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <NewsImage src={n.imageUrl} alt={n.title} className="h-40 w-full object-cover" />
            <div className="p-4">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge>{n.category || n.sourceName}</Badge>
                <ImpactBadge impact={n.impact} />
              </div>
              <h3 className="line-clamp-2 font-semibold group-hover:text-gold">{n.title}</h3>
              <p className="mt-1.5 line-clamp-2 text-xs text-muted">{n.summary || n.aiSummary}</p>
              <div className="mt-3">
                <DataSourceBadge
                  sourceName={n.sourceName}
                  publishedAt={n.publishedAt}
                  publishedAtRaw={n.publishedAtRaw}
                  syncedAt={n.syncedAt}
                  compact
                />
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
