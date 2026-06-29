import { notFound } from "next/navigation";
import { getStrategiesLive } from "@/lib/data-engine/strategy-engine";
import { AiPanel } from "@/components/AiPanel";
import { Card, SectionTitle, Badge } from "@/components/ui";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { LiveBadge } from "@/components/LiveBadge";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: `Chiến lược ${slug.replace("chien-luoc-", "")}` };
}

export default async function StrategyDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const all = await getStrategiesLive();
  const s = all.find((x) => x.slug === slug);
  if (!s) notFound();
  const others = all.filter((x) => x.slug !== slug);

  const cell = (label: string, value: string, tone?: string) => (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
      <div className="text-[11px] text-muted">{label}</div>
      <div className={`mt-1 text-lg font-bold ${tone ?? ""}`}>{value}</div>
    </div>
  );

  return (
    <div>
      <Breadcrumbs items={[{ label: "Chiến lược đầu tư", href: "/chien-luoc" }, { label: s.title }]} />
      <div className="mb-4 flex items-center gap-3">
        <h1 className="text-3xl font-bold">{s.title}</h1>
        <Badge tone="gold">Theo {s.period}</Badge>
        <LiveBadge live={s.isLive} />
      </div>

      {/* Data quality header */}
      <Card className="mb-6">
        <div className="mb-2 text-sm font-semibold text-gold">Kiểm soát chất lượng dữ liệu</div>
        <div className="grid gap-3 md:grid-cols-2">
          <DataSourceBadge
            sourceName={s.dataSource}
            publishedAt={s.dataTime}
            publishedAtRaw={`Dữ liệu mới nhất: VNINDEX ${s.basePrice.toLocaleString("vi-VN", { minimumFractionDigits: 2 })} (${s.baseChangePct > 0 ? "+" : ""}${s.baseChangePct.toFixed(2)}%)`}
            syncedAt={s.generatedAt}
            status={s.isLive ? "ok" : "syncing"}
          />
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-xs text-muted">
            <div className="font-semibold text-gold mb-1">Nguồn dữ liệu chiến lược</div>
            VNDirect dchart API (giá thật) • Dữ liệu: {new Date(s.dataTime).toLocaleString("vi-VN")} (GMT+7) •
            AI phân tích: {new Date(s.generatedAt).toLocaleString("vi-VN")} (GMT+7)
          </div>
        </div>
      </Card>

      {/* Market context — từ dữ liệu thật */}
      {s.isLive && (
        <Card className="mb-6">
          <SectionTitle>Dữ liệu thị trường cơ sở (VNINDEX thật)</SectionTitle>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {cell("VNINDEX hiện tại", s.basePrice.toLocaleString("vi-VN", { minimumFractionDigits: 2 }), "text-gold")}
            {cell("Thay đổi phiên", `${s.baseChangePct > 0 ? "+" : ""}${s.baseChangePct.toFixed(2)}%`, s.baseChangePct >= 0 ? "text-emerald-400" : "text-rose-400")}
            {cell("RSI(14)", s.rsi14.toString(), s.rsi14 > 70 ? "text-rose-400" : s.rsi14 < 30 ? "text-emerald-400" : "")}
            {cell("MA20", s.ma20.toLocaleString("vi-VN", { minimumFractionDigits: 2 }))}
            {cell("MA50", s.ma50.toLocaleString("vi-VN", { minimumFractionDigits: 2 }))}
            {cell("Đỉnh 30 ngày", s.high30d.toLocaleString("vi-VN", { minimumFractionDigits: 2 }))}
            {cell("Đáy 30 ngày", s.low30d.toLocaleString("vi-VN", { minimumFractionDigits: 2 }))}
            {cell("Xu hướng", s.trend)}
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <SectionTitle>Khuyến nghị giao dịch</SectionTitle>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {cell("Điểm mua", s.entry, "text-emerald-400")}
              {cell("Điểm bán / chốt lời", s.exit, "text-rose-400")}
              {cell("Cắt lỗ (Stop Loss)", s.stopLoss, "text-rose-400")}
              {cell("Chốt lời (Take Profit)", s.takeProfit, "text-emerald-400")}
              {cell("Mức độ rủi ro", s.risk)}
              {cell("Xu hướng", s.trend, "text-gold")}
            </div>
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-xs"><span className="text-muted">Độ tin cậy</span><span className="font-semibold text-gold">{s.confidence}%</span></div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full gold-gradient" style={{ width: `${s.confidence}%` }} />
              </div>
            </div>
          </Card>
          <Card>
            <SectionTitle>Nhận định AI</SectionTitle>
            <p className="text-sm leading-relaxed text-muted">{s.summary}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                <div className="text-sm font-semibold text-emerald-400">Kịch bản tích cực</div>
                <p className="mt-1 text-xs text-muted">VNINDEX vượt {s.exit} với thanh khoản cải thiện, dòng tiền lan tỏa sang nhóm cổ phiếu cơ bản.</p>
              </div>
              <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3">
                <div className="text-sm font-semibold text-rose-400">Kịch bản tiêu cực</div>
                <p className="mt-1 text-xs text-muted">Mất vùng {s.stopLoss}, áp lực bán gia tăng, cần hạ tỷ trọng và bảo toàn vốn.</p>
              </div>
            </div>
          </Card>
        </div>
        <div className="space-y-6">
          <AiPanel
            items={[
              { icon: "summary", title: "Luân chuyển dòng tiền", text: "Theo dữ liệu giao dịch mới nhất, dòng tiền đang tập trung vào nhóm ngân hàng, chứng khoán và thép." },
              { icon: "opportunity", title: "Nhóm ngành nổi bật", text: "Thép, dầu khí, bán lẻ và công nghệ được kỳ vọng dẫn dắt trong chu kỳ này." },
              { icon: "trend", title: "Cổ phiếu tham chiếu", text: "VCB, FPT, HPG, MWG là các mã đáng theo dõi dựa trên xu hướng kỹ thuật hiện tại." },
            ]}
          />
          <Card>
            <SectionTitle href="/chien-luoc">Chiến lược khác</SectionTitle>
            <div className="space-y-2">
              {others.map((x) => (
                <a key={x.slug} href={`/chien-luoc/${x.slug}`} className="block rounded-lg border border-white/5 bg-white/[0.02] p-3 hover:border-gold/30">
                  <div className="font-semibold">{x.title}</div>
                  <div className="mt-0.5 text-xs text-muted line-clamp-1">{x.summary}</div>
                  {x.isLive && <div className="mt-1 text-[10px] text-emerald-400">🟢 VNINDEX {x.basePrice.toLocaleString("vi-VN", { minimumFractionDigits: 2 })}</div>}
                </a>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
