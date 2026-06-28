import { notFound } from "next/navigation";
import { getStrategy, getStrategies } from "@/lib/market-data";
import { AiPanel } from "@/components/AiPanel";
import { Card, SectionTitle, Badge } from "@/components/ui";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = getStrategy(slug);
  return { title: s ? s.title : "Chiến lược đầu tư" };
}

export default async function StrategyDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = getStrategy(slug);
  if (!s) notFound();

  const cell = (label: string, value: string, tone?: string) => (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-4">
      <div className="text-[11px] text-muted">{label}</div>
      <div className={`mt-1 text-lg font-bold ${tone ?? ""}`}>{value}</div>
    </div>
  );

  return (
    <div>
      <Breadcrumbs items={[{ label: "Chiến lược đầu tư", href: "/chien-luoc" }, { label: s.title }]} />
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-3xl font-bold">{s.title}</h1>
        <Badge tone="gold">Theo {s.period}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <SectionTitle>Khuyến nghị giao dịch</SectionTitle>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {cell("Xu hướng", s.trend, "text-gold")}
              {cell("Điểm mua", s.entry, "text-emerald-400")}
              {cell("Điểm bán", s.exit, "text-rose-400")}
              {cell("Cắt lỗ", s.stopLoss, "text-rose-400")}
              {cell("Chốt lời", s.takeProfit, "text-emerald-400")}
              {cell("Mức độ rủi ro", s.risk)}
            </div>
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-xs"><span className="text-muted">Độ tin cậy</span><span className="font-semibold text-gold">{s.confidence}%</span></div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full gold-gradient" style={{ width: `${s.confidence}%` }} />
              </div>
            </div>
          </Card>
          <Card>
            <SectionTitle>Triển vọng thị trường</SectionTitle>
            <p className="text-sm leading-relaxed text-muted">{s.summary}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                <div className="text-sm font-semibold text-emerald-400">Kịch bản tăng</div>
                <p className="mt-1 text-xs text-muted">Dòng tiền lan tỏa, vượt kháng cự với thanh khoản cao, ưu tiên nhóm dẫn dắt.</p>
              </div>
              <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3">
                <div className="text-sm font-semibold text-rose-400">Kịch bản giảm</div>
                <p className="mt-1 text-xs text-muted">Áp lực bán tại kháng cự, cần hạ tỷ trọng và quản trị rủi ro chặt chẽ.</p>
              </div>
            </div>
          </Card>
        </div>
        <div className="space-y-6">
          <AiPanel
            items={[
              { icon: "summary", title: "Luân chuyển dòng tiền", text: "Dòng tiền đang ưu tiên nhóm ngân hàng, chứng khoán và thép." },
              { icon: "opportunity", title: "Nhóm ngành nổi bật", text: "Thép, dầu khí, bán lẻ và công nghệ được kỳ vọng dẫn dắt." },
              { icon: "trend", title: "Cổ phiếu nổi bật", text: "VCB, FPT, HPG, MWG là các mã đáng chú ý trong chu kỳ này." },
            ]}
          />
        </div>
      </div>

      <div className="mt-8">
        <SectionTitle href="/chien-luoc">Chiến lược khác</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2">
          {getStrategies().filter((x) => x.slug !== s.slug).map((x) => (
            <a key={x.slug} href={`/chien-luoc/${x.slug}`} className="glass rounded-lg p-4 hover:border-gold/40">
              <div className="font-semibold">{x.title}</div>
              <div className="text-xs text-muted">{x.summary}</div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
