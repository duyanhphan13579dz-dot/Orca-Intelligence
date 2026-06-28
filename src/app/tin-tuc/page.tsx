import Link from "next/link";
import { getNews } from "@/lib/market-data";
import { PageHeader, ImpactBadge, Badge } from "@/components/ui";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export const metadata = { title: "Tin tức" };

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ cat?: string }>;
}) {
  const sp = await searchParams;
  const cat = sp.cat;
  const all = getNews();
  const cats = Array.from(new Set(all.map((n) => n.category)));
  const news = cat ? all.filter((n) => n.category === cat) : all;
  const featured = news[0];
  const rest = news.slice(1);

  return (
    <div>
      <Breadcrumbs items={[{ label: "Tin tức" }]} />
      <PageHeader
        title="Tin tức tài chính"
        subtitle="Cập nhật tin tức realtime từ CafeF, Vietstock, SSI, VCBS, Reuters, Bloomberg và Trading Economics."
      />
      <div className="mb-5 flex flex-wrap gap-1.5">
        <Link href="/tin-tuc" className={`rounded-full px-3 py-1 text-xs ${!cat ? "gold-gradient text-navy" : "glass text-muted hover:text-white"}`}>Tất cả</Link>
        {cats.map((c) => (
          <Link key={c} href={`/tin-tuc?cat=${encodeURIComponent(c)}`} className={`rounded-full px-3 py-1 text-xs ${cat === c ? "gold-gradient text-navy" : "glass text-muted hover:text-white"}`}>{c}</Link>
        ))}
      </div>

      {featured && (
        <Link href={`/tin-tuc/${featured.slug}`} className="glass group mb-6 grid overflow-hidden rounded-xl md:grid-cols-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={featured.image} alt={featured.title} className="h-56 w-full object-cover md:h-full" />
          <div className="p-6">
            <div className="mb-2 flex items-center gap-2">
              <Badge tone="gold">{featured.category}</Badge>
              <ImpactBadge impact={featured.impact} />
            </div>
            <h2 className="text-xl font-bold group-hover:text-gold">{featured.title}</h2>
            <p className="mt-2 text-sm text-muted">{featured.summary}</p>
            <div className="mt-3 text-xs text-muted"><span className="text-gold">{featured.source}</span> • {featured.time}</div>
          </div>
        </Link>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {rest.map((n) => (
          <Link key={n.slug} href={`/tin-tuc/${n.slug}`} className="glass group overflow-hidden rounded-xl transition hover:border-gold/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={n.image} alt={n.title} className="h-40 w-full object-cover" />
            <div className="p-4">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge>{n.category}</Badge>
                <ImpactBadge impact={n.impact} />
              </div>
              <h3 className="line-clamp-2 font-semibold group-hover:text-gold">{n.title}</h3>
              <p className="mt-1.5 line-clamp-2 text-xs text-muted">{n.summary}</p>
              <div className="mt-3 text-[11px] text-muted"><span className="text-gold">{n.source}</span> • {n.time}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
