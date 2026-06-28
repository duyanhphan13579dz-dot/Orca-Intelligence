import { notFound } from "next/navigation";
import Link from "next/link";
import { getNewsItem, getNews } from "@/lib/market-data";
import { AiPanel } from "@/components/AiPanel";
import { Card, SectionTitle, Badge, ImpactBadge } from "@/components/ui";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Share2, Bookmark } from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const n = getNewsItem(slug);
  return { title: n ? n.title : "Tin tức" };
}

export default async function NewsDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const n = getNewsItem(slug);
  if (!n) notFound();
  const related = getNews().filter((x) => x.slug !== n.slug).slice(0, 4);

  return (
    <div>
      <Breadcrumbs items={[{ label: "Tin tức", href: "/tin-tuc" }, { label: n.category, href: `/tin-tuc?cat=${encodeURIComponent(n.category)}` }, { label: "Chi tiết" }]} />
      <div className="grid gap-6 lg:grid-cols-3">
        <article className="lg:col-span-2">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge tone="gold">{n.category}</Badge>
            <ImpactBadge impact={n.impact} />
            {n.tags.map((t) => <Badge key={t}>#{t}</Badge>)}
          </div>
          <h1 className="text-2xl font-bold sm:text-3xl">{n.title}</h1>
          <div className="mt-3 flex items-center justify-between">
            <div className="text-sm text-muted"><span className="text-gold">{n.source}</span> • {n.time}</div>
            <div className="flex gap-2">
              <button className="flex items-center gap-1 rounded-md border border-white/10 px-2.5 py-1.5 text-xs text-muted hover:text-gold"><Share2 size={13} /> Chia sẻ</button>
              <button className="flex items-center gap-1 rounded-md border border-white/10 px-2.5 py-1.5 text-xs text-muted hover:text-gold"><Bookmark size={13} /> Lưu</button>
            </div>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={n.image} alt={n.title} className="mt-4 h-72 w-full rounded-xl object-cover" />
          <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-white/85">
            <p className="text-lg font-medium text-muted">{n.summary}</p>
            {n.content.map((p, i) => <p key={i}>{p}</p>)}
          </div>

          <Card className="mt-6">
            <SectionTitle>Bình luận</SectionTitle>
            <div className="flex gap-2">
              <input placeholder="Viết bình luận..." className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-muted" />
              <button className="rounded-lg gold-gradient px-4 py-2 text-sm font-semibold text-navy">Gửi</button>
            </div>
            <p className="mt-3 text-xs text-muted">Hãy là người đầu tiên bình luận về bài viết này.</p>
          </Card>
        </article>

        <aside className="space-y-6">
          <AiPanel
            items={[
              { icon: "summary", title: "Tóm tắt AI", text: n.summary },
              { icon: "trend", title: "Tác động thị trường", text: `Tin tức thuộc nhóm "${n.category}" với mức độ ảnh hưởng ${n.impact}, có thể tác động đến tâm lý nhà đầu tư trong ngắn hạn.` },
            ]}
          />
          <Card>
            <SectionTitle href="/tin-tuc">Tin liên quan</SectionTitle>
            <div className="space-y-3">
              {related.map((r) => (
                <Link key={r.slug} href={`/tin-tuc/${r.slug}`} className="flex gap-3 group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={r.image} alt={r.title} className="h-14 w-20 shrink-0 rounded-md object-cover" />
                  <span className="line-clamp-2 text-sm group-hover:text-gold">{r.title}</span>
                </Link>
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
