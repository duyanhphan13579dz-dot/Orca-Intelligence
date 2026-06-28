import Link from "next/link";
import {
  getCommodities,
  getCrypto,
  getNews,
  getAiInsights,
} from "@/lib/market-data";
import { getIndicesLive, getStocksLive } from "@/lib/vndirect";
import { MarketCard } from "@/components/MarketCard";
import { Heatmap } from "@/components/Heatmap";
import { AiPanel } from "@/components/AiPanel";
import { LiveBadge } from "@/components/LiveBadge";
import { Card, SectionTitle, Badge } from "@/components/ui";
import type { Stock } from "@/lib/types";
import { Counter } from "@/components/Counter";
import { PriceChange } from "@/components/PriceChange";
import { formatPercent, colorOf } from "@/lib/format";
import { LayoutDashboard, FileText, ArrowRight, Maximize2, History, Download } from "lucide-react";

export const revalidate = 900;

export default async function HomePage() {
  const [{ quotes: indices }, { stocks }] = await Promise.all([getIndicesLive(), getStocksLive()]);
  const commodities = getCommodities();
  const crypto = getCrypto();
  const news = getNews().slice(0, 5);
  const byPct = [...stocks].sort((a, b) => b.changePct - a.changePct);
  const movers = { gainers: byPct.slice(0, 5), losers: byPct.slice(-5).reverse() };
  const ai = getAiInsights();
  const vnindex = indices[0];

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="glass relative overflow-hidden rounded-2xl p-8 sm:p-12 animate-fade-up">
        <div className="relative z-10 max-w-2xl">
          <Badge tone="gold">Nền tảng phân tích tài chính chuyên sâu</Badge>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">
            ORCA <span className="text-gold">FINANCIAL</span>
          </h1>
          <p className="mt-4 text-base text-muted">
            Dữ liệu thời gian thực, phân tích kỹ thuật chuyên sâu và trí tuệ nhân tạo dành cho
            nhà đầu tư cá nhân, tổ chức và chuyên gia tài chính.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/thi-truong" className="flex items-center gap-2 rounded-lg gold-gradient px-5 py-2.5 text-sm font-semibold text-navy transition hover:opacity-90">
              <LayoutDashboard size={16} /> Xem Dashboard
            </Link>
            <Link href="/bao-cao" className="flex items-center gap-2 rounded-lg border border-white/15 px-5 py-2.5 text-sm font-semibold transition hover:border-gold/50">
              <FileText size={16} /> Báo cáo hôm nay
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-6">
            <div>
              <div className="text-xs text-muted">VN-Index</div>
              <Counter value={vnindex.price} className="text-2xl font-bold" />
              <div className={`text-sm font-semibold ${colorOf(vnindex.changePct)}`}>{formatPercent(vnindex.changePct)}</div>
            </div>
            <div>
              <div className="text-xs text-muted">Tâm lý thị trường</div>
              <div className="text-2xl font-bold text-gold">{ai.sentiment}/100</div>
              <div className="text-sm text-emerald-400">Tham lam vừa phải</div>
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 right-32 h-64 w-64 rounded-full bg-royal/30 blur-3xl" />
      </section>

      {/* Widget thị trường */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <SectionTitle href="/thi-truong">Widget thị trường</SectionTitle>
          <LiveBadge live />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {indices.map((q) => (
            <MarketCard key={q.symbol} quote={q} href={`/phan-tich-ky-thuat/${q.symbol}`} />
          ))}
        </div>
      </section>

      {/* Widgets grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Heatmap */}
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <SectionTitle href="/co-phieu">Bản đồ nhiệt theo ngành</SectionTitle>
            </div>
            <WidgetActions href="/co-phieu" />
            <div className="mt-4">
              <Heatmap stocks={stocks} />
            </div>
          </Card>

          {/* Hàng hóa + Crypto */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <SectionTitle href="/hang-hoa">Hàng hóa nổi bật</SectionTitle>
              <WidgetActions href="/hang-hoa" />
              <div className="mt-3 space-y-2">
                {commodities.slice(0, 5).map((c) => (
                  <Link key={c.slug} href={`/hang-hoa/${c.slug}`} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-white/5">
                    <span className="flex items-center gap-2 text-sm">
                      <span>{c.icon}</span> {c.name}
                    </span>
                    <span className={`text-xs font-semibold ${colorOf(c.changePct)}`}>{formatPercent(c.changePct)}</span>
                  </Link>
                ))}
              </div>
            </Card>
            <Card>
              <SectionTitle href="/tien-ma-hoa">Tiền mã hóa</SectionTitle>
              <WidgetActions href="/tien-ma-hoa" />
              <div className="mt-3 space-y-2">
                {crypto.slice(0, 5).map((c) => (
                  <Link key={c.symbol} href="/tien-ma-hoa" className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-white/5">
                    <span className="text-sm font-medium">{c.symbol}</span>
                    <span className={`text-xs font-semibold ${colorOf(c.changePct)}`}>{formatPercent(c.changePct)}</span>
                  </Link>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <AiPanel
            items={[
              { icon: "summary", title: "Tóm tắt thị trường", text: ai.summary },
              { icon: "trend", title: "Phân tích xu hướng", text: ai.trend },
              { icon: "risk", title: "Cảnh báo rủi ro", text: ai.risk },
              { icon: "opportunity", title: "Cơ hội đầu tư", text: ai.opportunity },
            ]}
          />
          <Card>
            <SectionTitle href="/co-phieu">Top biến động</SectionTitle>
            <div className="space-y-3">
              <MoverGroup title="Top tăng mạnh" rows={movers.gainers} />
              <MoverGroup title="Top giảm mạnh" rows={movers.losers} />
            </div>
          </Card>
        </div>
      </div>

      {/* Tin tức */}
      <section>
        <SectionTitle href="/tin-tuc">Tin tức hôm nay</SectionTitle>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {news.map((n) => (
            <Link key={n.slug} href={`/tin-tuc/${n.slug}`} className="glass group overflow-hidden rounded-xl transition hover:border-gold/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={n.image} alt={n.title} className="h-36 w-full object-cover" />
              <div className="p-4">
                <div className="mb-2 flex items-center gap-2 text-[11px] text-muted">
                  <span className="text-gold">{n.source}</span> • {n.time}
                </div>
                <h3 className="line-clamp-2 font-semibold group-hover:text-gold">{n.title}</h3>
                <p className="mt-1.5 line-clamp-2 text-xs text-muted">{n.summary}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function WidgetActions({ href }: { href: string }) {
  return (
    <div className="flex flex-wrap gap-1.5 text-[11px] text-muted">
      <Link href={href} className="flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 hover:text-gold"><ArrowRight size={11} /> Xem chi tiết</Link>
      <Link href={href} className="flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 hover:text-gold"><Maximize2 size={11} /> Toàn màn hình</Link>
      <Link href={href} className="flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 hover:text-gold"><History size={11} /> Lịch sử</Link>
      <Link href={href} className="flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 hover:text-gold"><Download size={11} /> Xuất dữ liệu</Link>
    </div>
  );
}

function MoverGroup({ title, rows }: { title: string; rows: Stock[] }) {
  return (
    <div>
      <div className="mb-1.5 text-xs font-semibold text-muted">{title}</div>
      <div className="space-y-1">
        {rows.map((s) => (
          <Link key={s.symbol} href={`/co-phieu/${s.symbol}`} className="flex items-center justify-between rounded-md px-2 py-1 text-sm hover:bg-white/5">
            <span className="font-medium">{s.symbol}</span>
            <PriceChange change={s.change} pct={s.changePct} showIcon={false} />
          </Link>
        ))}
      </div>
    </div>
  );
}
