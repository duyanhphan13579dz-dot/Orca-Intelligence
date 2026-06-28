import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Activity,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Crown,
  Database,
  FileText,
  Landmark,
  Shield,
  Target,
  Wallet,
} from "lucide-react";
import { getEquityResearch, type ResearchMetric } from "@/lib/equity-research";
import { getStocks } from "@/lib/market-data";
import { CandleChart } from "@/components/CandleChart";
import { AiPanel } from "@/components/AiPanel";
import { WatchlistButton } from "@/components/WatchlistButton";
import { PriceChange } from "@/components/PriceChange";
import { PrintButton } from "@/components/PrintButton";
import { LiveBadge } from "@/components/LiveBadge";
import { Gauge } from "@/components/Gauge";
import { Sparkline } from "@/components/Sparkline";
import { Card, SectionTitle, Badge } from "@/components/ui";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { RealtimeStatusBar } from "@/components/RealtimeStatusBar";
import { RecommendationTabs } from "@/components/RecommendationTabs";
import { PatternScanner } from "@/components/PatternScanner";
import { formatNumber, formatUsdCompact } from "@/lib/format";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export const revalidate = 900;

export async function generateMetadata({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  return {
    title: `${symbol.toUpperCase()} — Báo cáo phân tích cổ phiếu chuyên sâu`,
    description: `Equity Research tự động cho cổ phiếu ${symbol.toUpperCase()} bởi Orca Financial.`,
  };
}

export default async function StockResearchPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const r = await getEquityResearch(symbol);
  if (!r) notFound();
  const stock = r.stock;
  const peers = getStocks().filter((s) => s.sector === stock.sector && s.symbol !== stock.symbol).slice(0, 4);

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Cổ phiếu", href: "/co-phieu" }, { label: stock.symbol }]} />

      {/* ============ HERO ============ */}
      <section className="glass relative overflow-hidden rounded-2xl p-5 sm:p-7">
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />
        <div className="absolute -bottom-24 left-1/2 h-72 w-72 rounded-full bg-royal/20 blur-3xl" />
        <div className="relative grid gap-6 xl:grid-cols-[1.45fr_1fr]">
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <LiveBadge live />
              <Badge tone="gold">Equity Research AI</Badge>
              <Badge tone="royal">{r.period}</Badge>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-gold/30 bg-gold/10 text-2xl font-extrabold text-gold">
                {stock.symbol.slice(0, 2)}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-4xl font-extrabold tracking-tight">{stock.symbol}</h1>
                  <Badge tone="royal">{stock.exchange}</Badge>
                  <Badge>{stock.sector}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted">{stock.name}</p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-end gap-4">
              <div>
                <div className="text-[11px] text-muted">Giá hiện tại</div>
                <div className="flex items-center gap-3">
                  <span className="text-4xl font-extrabold">{formatNumber(stock.price)}</span>
                  <PriceChange change={stock.change} pct={stock.changePct} />
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <div className="rounded-xl border border-gold/30 bg-gold/10 px-4 py-3">
                <div className="text-[11px] text-muted">Khuyến nghị tổng hợp</div>
                <div className="text-xl font-extrabold text-gold">{r.ai.recommendation}</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <div className="text-[11px] text-muted">Xếp hạng AI</div>
                <div className="text-xl font-extrabold">{r.ai.rating} <span className="text-gold">{"★".repeat(r.ai.stars)}</span><span className="text-white/20">{"☆".repeat(5 - r.ai.stars)}</span></div>
              </div>
              <WatchlistButton symbol={stock.symbol} name={stock.name} type="co-phieu" href={`/co-phieu/${stock.symbol}`} />
              <PrintButton label="📄 Xuất báo cáo PDF" />
            </div>
          </div>

          {/* Hero right: AI Score gauge */}
          <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <div className="mb-1 text-sm font-semibold text-gold">Điểm AI tổng hợp</div>
            <Gauge score={r.ai.score * 2 - 100} label={`${r.ai.score}/100 • ${r.ai.rating}`} size={200} />
            <div className="mt-1 text-2xl">{"★".repeat(r.ai.stars)}<span className="text-white/20">{"☆".repeat(5 - r.ai.stars)}</span></div>
          </div>
        </div>
      </section>

      {/* ============ REALTIME STATUS (Data Engine) ============ */}
      <RealtimeStatusBar />

      {/* Nguồn & kỳ báo cáo */}
      <Card>
        <SectionTitle>Kiểm soát chất lượng dữ liệu</SectionTitle>
        <div className="grid gap-3 md:grid-cols-4">
          <SourceCard icon={<Database size={18} />} label="Nguồn chính" value={r.dataQuality.primary} />
          <SourceCard icon={<FileText size={18} />} label="Kỳ báo cáo" value={r.period} />
          <SourceCard icon={<Activity size={18} />} label="Đồng bộ" value={r.syncTime} />
          <SourceCard icon={<Shield size={18} />} label="Chu kỳ refresh" value={r.dataQuality.refresh} />
        </div>
        <p className="mt-3 rounded-lg border border-gold/15 bg-gold/5 p-3 text-xs leading-relaxed text-muted">
          {r.dataQuality.statementStatus} Nguồn ưu tiên: VNStock Agent (Free Tier) → WiData → Investing.com. Nguồn chính thức (HOSE/HNX/UPCoM/IR/UBCKNN) luôn được ưu tiên khi connector có dữ liệu.
        </p>
      </Card>

      {/* ============ KPI DASHBOARD ============ */}
      <section>
        <SectionTitle>Dashboard tổng quan</SectionTitle>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          {r.kpis.map((m) => <KpiCard key={m.label} metric={m} />)}
        </div>
      </section>

      {/* ============ CHART (trung tâm) ============ */}
      <section>
        <SectionTitle>Biểu đồ giá & kỹ thuật</SectionTitle>
        <CandleChart seed={stock.symbol} base={stock.price} symbol={stock.symbol} height={440} />
      </section>

      {/* ============ FINANCIAL HEALTH ============ */}
      <section>
        <SectionTitle>Đánh giá năng lực tài chính</SectionTitle>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {r.health.map((h) => <HealthCard key={h.title} item={h} />)}
        </div>
      </section>

      {/* ============ VALUATION ============ */}
      <section className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
        <Card>
          <SectionTitle>Định giá cổ phiếu</SectionTitle>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <HeroStat label="Giá hiện tại" value={formatNumber(r.valuation.currentPrice)} />
            <HeroStat label="Giá hợp lý" value={formatNumber(r.valuation.fairPrice)} highlight />
            <HeroStat label="Giá mục tiêu" value={formatNumber(r.valuation.targetPrice)} highlight />
            <HeroStat label="Biên an toàn" value={`${formatNumber(r.valuation.marginOfSafety)}%`} />
            <HeroStat label="Upside" value={`${formatNumber(r.valuation.upside)}%`} highlight />
          </div>
          <ValuationBar zone={r.valuation.zone} />
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left text-xs text-muted"><th className="py-2">Phương pháp</th><th className="py-2 text-right">Giá hợp lý</th><th className="py-2 text-right">Trọng số</th><th className="py-2">Ghi chú</th></tr></thead>
              <tbody>
                {r.valuation.methods.map((m) => (
                  <tr key={m.method} className="border-b border-white/5">
                    <td className="py-2 font-medium text-gold">{m.method}</td>
                    <td className="py-2 text-right tabular-nums">{formatNumber(m.fairValue)}</td>
                    <td className="py-2 text-right">{m.weight}%</td>
                    <td className="py-2 text-muted">{m.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card>
          <SectionTitle>So sánh định giá</SectionTitle>
          <div className="space-y-3">
            {r.valuation.peers.map((p) => (
              <div key={p.label} className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                <div className="mb-1 flex justify-between text-sm"><span>{p.label}</span><span className="text-gold">{p.value}</span></div>
                <div className="text-xs text-muted">Trung bình ngành: {p.industry}</div>
              </div>
            ))}
          </div>
          <AiPanel items={[{ icon: "summary", title: "Định giá AI", text: `Cổ phiếu đang ở vùng ${r.valuation.zone}. Giá hợp lý ${formatNumber(r.valuation.fairPrice)}, giá mục tiêu ${formatNumber(r.valuation.targetPrice)}, upside ${formatNumber(r.valuation.upside)}%.` }]} />
        </Card>
      </section>

      {/* ============ FINANCIAL STATEMENT ============ */}
      <section>
        <Card>
          <SectionTitle>Báo cáo tài chính</SectionTitle>
          <div className="mb-4 flex flex-wrap gap-2">
            <Badge tone="gold">Theo năm: tối thiểu 10 năm khi nguồn chính thức khả dụng</Badge>
            <Badge tone="royal">Theo quý: tối thiểu 20 quý khi nguồn chính thức khả dụng</Badge>
            <Badge>{r.period}</Badge>
          </div>
          <div className="grid gap-6 xl:grid-cols-3">
            <FinancialTable title="Kết quả kinh doanh" headers={r.financials.years} rows={r.financials.income} />
            <FinancialTable title="Bảng cân đối kế toán" headers={r.financials.years} rows={r.financials.balance} />
            <FinancialTable title="Lưu chuyển tiền tệ" headers={r.financials.quarters} rows={r.financials.cashflow} />
          </div>
          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            <GrowthChart title="Biểu đồ tăng trưởng 10 năm" data={r.financials.income[0].values} labels={r.financials.years} />
            <GrowthChart title="Biểu đồ 20 quý (tóm tắt kỳ gần nhất)" data={r.financials.cashflow[2].values} labels={r.financials.quarters} />
          </div>
        </Card>
      </section>

      {/* ============ TECHNICAL ANALYSIS ============ */}
      <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <SectionTitle>Phân tích kỹ thuật</SectionTitle>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-4">
            {r.technical.map((m) => <MiniMetric key={m.label} metric={m} />)}
          </div>
          <div className="mt-4">
            <AiPanel
              items={[
                { icon: "trend", title: "Xu hướng", text: `${stock.symbol} đang ${stock.price > stock.ma50 ? "giao dịch trên MA50, xu hướng ngắn hạn tích cực" : "kiểm định vùng MA50, cần theo dõi thêm"}. RSI ở mức ${formatNumber(stock.rsi)}.` },
                { icon: "opportunity", title: "Điểm mua / bán", text: `Vùng mua tham chiếu ${formatNumber(stock.price * 0.97)}–${formatNumber(stock.price * 0.99)}. Vùng chốt lời ${formatNumber(stock.price * 1.09)}, cắt lỗ ${formatNumber(stock.price * 0.93)}.` },
                { icon: "risk", title: "Hỗ trợ / kháng cự", text: `Hỗ trợ gần: ${formatNumber(stock.price * 0.94)}. Kháng cự gần: ${formatNumber(stock.price * 1.06)}.` },
              ]}
            />
          </div>
        </Card>
        <Card>
          <SectionTitle>Radar năng lực</SectionTitle>
          <RadarChart scores={r.scoring} />
          <div className="mt-4 space-y-2">
            {r.scoring.map((s) => <ScoreBar key={s.label} label={s.label} score={s.score} note={s.note} />)}
          </div>
        </Card>
      </section>

      {/* ============ PATTERN SCANNER ============ */}
      <section>
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <SectionTitle>Quét mẫu hình kỹ thuật tự động</SectionTitle>
            <LiveBadge live />
          </div>
          <p className="mb-4 text-xs text-muted">
            Hệ thống tự động nhận diện mẫu hình đảo chiều, tiếp diễn và mẫu nến từ dữ liệu giá thật. Cập nhật sau mỗi chu kỳ 15 phút.
          </p>
          <PatternScanner patterns={r.patterns} />
        </Card>
      </section>

      {/* ============ FUNDAMENTAL ANALYSIS ============ */}
      <section>
        <Card>
          <SectionTitle>Phân tích cơ bản</SectionTitle>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-5">
            {r.fundamentals.map((m) => <MiniMetric key={m.label} metric={m} />)}
          </div>
          <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><BookOpen size={16} className="text-gold" /> AI giải thích chỉ số</div>
            <p className="text-sm leading-relaxed text-muted">
              ROE, ROA và ROIC đo lường hiệu quả sinh lời; Debt/Equity, Current Ratio và Quick Ratio phản ánh sức khỏe bảng cân đối; FCF/FCFE/FCFF cho biết chất lượng dòng tiền; Altman Z, Piotroski F và Beneish M giúp đánh giá rủi ro tài chính, chất lượng lợi nhuận và khả năng thao túng báo cáo. Orca AI kết hợp các nhóm chỉ số này để tạo điểm tổng và khuyến nghị.
            </p>
          </div>
        </Card>
      </section>

      {/* ============ BUSINESS (Giới thiệu doanh nghiệp) ============ */}
      <section className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
        <Card>
          <SectionTitle>Giới thiệu doanh nghiệp</SectionTitle>
          <div className="space-y-4 text-sm leading-relaxed text-muted">
            <InfoBlock title="Hồ sơ doanh nghiệp" text={r.business.profile} />
            <InfoBlock title="Lịch sử hình thành" text={r.business.history} />
            <InfoBlock title="Mô hình kinh doanh" text={r.business.model} />
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <ListBox title="Chuỗi giá trị" items={r.business.valueChain} />
            <ListBox title="Lợi thế cạnh tranh" items={r.business.advantages} />
            <ListBox title="Ban lãnh đạo" items={r.business.management} />
            <ListBox title="Cổ đông lớn & công ty con" items={[...r.business.shareholders, ...r.business.subsidiaries.slice(0, 2)]} />
          </div>
        </Card>
        <Card>
          <SectionTitle>SWOT & rủi ro ngành</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(r.business.swot).map(([k, items]) => <SwotBox key={k} type={k} items={items} />)}
          </div>
        </Card>
      </section>

      {/* ============ NEWS (Timeline) ============ */}
      <section>
        <Card>
          <SectionTitle href="/tin-tuc">Tin tức liên quan</SectionTitle>
          <div className="relative space-y-4 pl-5 before:absolute before:left-1.5 before:top-1 before:h-full before:w-px before:bg-white/10">
            {r.news.map((n) => (
              <Link key={n.slug} href={`/tin-tuc/${n.slug}`} className="group relative block">
                <span className="absolute -left-[18px] top-1.5 h-3 w-3 rounded-full border-2 border-gold bg-navy" />
                <div className="flex gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-3 transition hover:border-gold/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={n.image} alt={n.title} className="h-16 w-24 shrink-0 rounded-md object-cover" />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold group-hover:text-gold">{n.title}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                      <span className="text-gold">{n.source}</span> • {n.time}
                      <Badge tone={n.impact === "cao" ? "danger" : n.impact === "trung bình" ? "gold" : "neutral"}>Ảnh hưởng {n.impact}</Badge>
                    </div>
                    <p className="mt-1 line-clamp-1 text-xs text-muted">AI tóm tắt: {n.summary}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      </section>

      {/* ============ AI INSIGHT ============ */}
      <section className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <Card>
          <SectionTitle>Phân tích AI &amp; Kết luận đầu tư</SectionTitle>
          <AiPanel
            items={[
              { icon: "summary", title: "Tóm tắt báo cáo", text: r.ai.summary },
              { icon: "opportunity", title: "Điểm mạnh", text: r.ai.strengths.join(" ") },
              { icon: "risk", title: "Điểm yếu & rủi ro", text: [...r.ai.weaknesses, ...r.ai.risks].join(" ") },
              { icon: "trend", title: "Kết luận đầu tư", text: r.ai.conclusion },
            ]}
          />
        </Card>
        <Card>
          <SectionTitle>Chấm điểm AI chi tiết</SectionTitle>
          <Gauge score={r.ai.score * 2 - 100} label={`${r.ai.score}/100 • ${r.ai.rating}`} size={180} />
          <div className="mt-4 space-y-2">
            {r.scoring.map((s) => <ScoreBar key={s.label} label={s.label} score={s.score} note={s.note} />)}
          </div>
        </Card>
      </section>

      {/* ============ RECOMMENDATION (Tabs) ============ */}
      <section>
        <Card>
          <SectionTitle>Khuyến nghị đầu tư</SectionTitle>
          <RecommendationTabs
            tabs={[
              { key: "week", label: "Theo tuần", icon: "target", data: r.recommendations.week },
              { key: "month", label: "Theo tháng", icon: "bar", data: r.recommendations.month },
              { key: "long", label: "Theo 6–12 tháng", icon: "crown", data: r.recommendations.longTerm },
            ]}
          />
        </Card>
      </section>

      {/* ============ PEERS ============ */}
      <section>
        <Card>
          <SectionTitle href="/co-phieu">So sánh cùng ngành</SectionTitle>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {peers.map((p) => (
              <Link key={p.symbol} href={`/co-phieu/${p.symbol}`} className="rounded-xl border border-white/10 bg-white/[0.03] p-4 hover:border-gold/40">
                <div className="font-bold text-gold">{p.symbol}</div>
                <div className="mt-1 truncate text-xs text-muted">{p.name}</div>
                <div className="mt-3 flex items-center justify-between"><span className="text-lg font-semibold">{formatNumber(p.price)}</span><PriceChange change={p.change} pct={p.changePct} showIcon={false} /></div>
              </Link>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}

function HeroStat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return <div className={`rounded-xl border p-3 ${highlight ? "border-gold/30 bg-gold/10" : "border-white/10 bg-white/[0.03]"}`}><div className="text-[11px] text-muted">{label}</div><div className={`mt-1 text-lg font-bold ${highlight ? "text-gold" : ""}`}>{value}</div></div>;
}
function SourceCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3"><div className="mb-2 flex items-center gap-2 text-gold">{icon}<span className="text-xs font-semibold">{label}</span></div><div className="text-xs leading-relaxed text-muted">{value}</div></div>;
}
function KpiCard({ metric }: { metric: ResearchMetric }) {
  return <div className="glass rounded-xl p-4 transition hover:border-gold/30"><div className="text-[11px] text-muted">{metric.label}</div><div className="mt-1 text-xl font-extrabold text-gold">{metric.value}</div><div className="mt-1 line-clamp-2 text-[11px] text-muted">{metric.note}</div></div>;
}
function MiniMetric({ metric }: { metric: ResearchMetric }) {
  return <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3"><div className="text-xs text-muted">{metric.label}</div><div className="mt-1 font-bold">{metric.value}</div><div className="mt-1 line-clamp-2 text-[11px] text-muted">{metric.note}</div></div>;
}
function HealthCard({ item }: { item: { title: string; value: string; prev: string; trend: "up" | "down" | "flat"; industry: string; score: number; status: string; explanation: string; icon: string } }) {
  const Icon = item.icon === "Shield" ? Shield : item.icon === "Landmark" ? Landmark : item.icon === "Wallet" ? Wallet : Activity;
  const TrendIcon = item.trend === "up" ? TrendingUp : item.trend === "down" ? TrendingDown : Minus;
  const trendCls = item.trend === "up" ? "text-emerald-400" : item.trend === "down" ? "text-rose-400" : "text-slate-400";
  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><Icon size={18} className="text-gold" /><span className="text-sm font-semibold">{item.title}</span></div>
        <Badge tone={item.score > 70 ? "success" : item.score > 45 ? "gold" : "danger"}>{item.status}</Badge>
      </div>
      <div className="mt-3"><Gauge score={item.score * 2 - 100} label={item.value} size={170} /></div>
      <div className="mt-3 grid grid-cols-3 gap-1 text-center text-[10px]">
        <div className="rounded-md border border-white/5 bg-white/[0.02] p-1.5"><div className="text-muted">Kỳ trước</div><div className="font-semibold">{item.prev}</div></div>
        <div className="rounded-md border border-white/5 bg-white/[0.02] p-1.5"><div className="text-muted">Xu hướng</div><div className={`flex items-center justify-center gap-0.5 font-semibold ${trendCls}`}><TrendIcon size={11} /></div></div>
        <div className="rounded-md border border-white/5 bg-white/[0.02] p-1.5"><div className="text-muted">TB ngành</div><div className="font-semibold">{item.industry}</div></div>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted">{item.explanation}</p>
    </div>
  );
}
function ScoreBar({ label, score, note }: { label: string; score: number; note: string }) {
  return <div><div className="mb-1 flex justify-between text-xs"><span>{label}</span><span className="text-gold">{score}/100</span></div><div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full gold-gradient" style={{ width: `${score}%` }} /></div><div className="mt-0.5 text-[10px] text-muted">{note}</div></div>;
}
function RadarChart({ scores }: { scores: { label: string; score: number }[] }) {
  const size = 300, cx = 150, cy = 150, r = 105;
  const pts = scores.map((s, i) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / scores.length; const rr = r * (s.score / 100); return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]; });
  const grid = [0.25, 0.5, 0.75, 1].map((g) => scores.map((_, i) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / scores.length; return `${cx + Math.cos(a) * r * g},${cy + Math.sin(a) * r * g}`; }).join(" "));
  return <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto max-w-full"><defs><linearGradient id="radar" x1="0" x2="1"><stop stopColor="#F5C542" stopOpacity="0.35" /><stop offset="1" stopColor="#1E4F9A" stopOpacity="0.35" /></linearGradient></defs>{grid.map((p, i) => <polygon key={i} points={p} fill="none" stroke="rgba(255,255,255,.08)" />)}{scores.map((_, i) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / scores.length; return <line key={i} x1={cx} y1={cy} x2={cx + Math.cos(a) * r} y2={cy + Math.sin(a) * r} stroke="rgba(255,255,255,.06)" />; })}<polygon points={pts.map((p) => p.join(",")).join(" ")} fill="url(#radar)" stroke="#F5C542" strokeWidth="2" />{scores.map((s, i) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / scores.length; return <text key={s.label} x={cx + Math.cos(a) * (r + 22)} y={cy + Math.sin(a) * (r + 22)} fill="#9fb2d4" fontSize="10" textAnchor="middle">{s.label}</text>; })}</svg>;
}
function ValuationBar({ zone }: { zone: string }) {
  const zones = ["Rất rẻ", "Rẻ", "Hợp lý", "Đắt", "Rất đắt"];
  const idx = zones.indexOf(zone);
  return <div className="mt-5"><div className="mb-2 flex justify-between text-xs text-muted">{zones.map((z) => <span key={z} className={z === zone ? "font-bold text-gold" : ""}>{z}</span>)}</div><div className="relative h-3 overflow-hidden rounded-full bg-gradient-to-r from-emerald-500 via-gold to-rose-500"><div className="absolute top-1/2 h-5 w-1 -translate-y-1/2 rounded bg-white" style={{ left: `${idx * 25 + 12}%` }} /></div></div>;
}
function InfoBlock({ title, text }: { title: string; text: string }) { return <div><h3 className="font-semibold text-white/90">{title}</h3><p className="mt-1">{text}</p></div>; }
function ListBox({ title, items }: { title: string; items: string[] }) { return <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3"><div className="mb-2 text-sm font-semibold text-gold">{title}</div><ul className="space-y-1 text-xs text-muted">{items.map((i) => <li key={i} className="flex gap-2"><CheckCircle2 size={12} className="mt-0.5 text-emerald-400" />{i}</li>)}</ul></div>; }
function SwotBox({ type, items }: { type: string; items: string[] }) { const label: Record<string, string> = { S: "Điểm mạnh", W: "Điểm yếu", O: "Cơ hội", T: "Thách thức" }; return <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3"><div className="mb-2 font-bold text-gold">{type} — {label[type]}</div><ul className="space-y-1 text-xs text-muted">{items.map((i) => <li key={i}>• {i}</li>)}</ul></div>; }
function FinancialTable({ title, headers, rows }: { title: string; headers: string[]; rows: { item: string; values: number[]; unit: string }[] }) { return <div><div className="mb-2 text-sm font-semibold text-gold">{title}</div><div className="overflow-x-auto rounded-lg border border-white/10"><table className="w-full text-xs"><thead><tr className="border-b text-muted"><th className="p-2 text-left">Chỉ tiêu</th>{headers.map((h) => <th key={h} className="p-2 text-right">{h}</th>)}</tr></thead><tbody>{rows.map((r) => <tr key={r.item} className="border-b border-white/5"><td className="p-2 text-muted">{r.item}</td>{r.values.map((v, i) => <td key={i} className="p-2 text-right tabular-nums">{r.unit.includes("cp") ? formatNumber(v, 0) : formatUsdCompact(v)}</td>)}</tr>)}</tbody></table></div></div>; }
function GrowthChart({ title, data, labels }: { title: string; data: number[]; labels: string[] }) { return <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4"><div className="mb-2 text-sm font-semibold text-gold">{title}</div><Sparkline data={data} width={680} height={110} positive={data[data.length - 1] >= data[0]} /><div className="mt-2 flex justify-between text-[10px] text-muted">{labels.map((l) => <span key={l}>{l}</span>)}</div></div>; }
