import Link from "next/link";
import { getStrategies } from "@/lib/market-data";
import { PageHeader, Card, Badge } from "@/components/ui";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ArrowRight } from "lucide-react";

export const metadata = { title: "Chiến lược đầu tư" };

export default function StrategyPage() {
  const strategies = getStrategies();
  return (
    <div>
      <Breadcrumbs items={[{ label: "Chiến lược đầu tư" }]} />
      <PageHeader
        title="Chiến lược đầu tư"
        subtitle="Khuyến nghị chiến lược theo ngày, tuần và tháng với điểm mua, điểm bán, cắt lỗ, chốt lời và mức độ tin cậy."
      />
      <div className="grid gap-4 md:grid-cols-3">
        {strategies.map((s) => (
          <Link key={s.slug} href={`/chien-luoc/${s.slug}`} className="glass group rounded-xl p-5 transition hover:border-gold/40">
            <Badge tone="gold">Theo {s.period}</Badge>
            <h3 className="mt-3 text-lg font-semibold group-hover:text-gold">{s.title}</h3>
            <p className="mt-2 text-sm text-muted">{s.summary}</p>
            <div className="mt-4 space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-muted">Xu hướng</span><span className="font-medium">{s.trend}</span></div>
              <div className="flex justify-between"><span className="text-muted">Mức độ rủi ro</span><span className="font-medium">{s.risk}</span></div>
              <div className="flex justify-between"><span className="text-muted">Độ tin cậy</span><span className="font-semibold text-gold">{s.confidence}%</span></div>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-medium text-gold">Xem chi tiết <ArrowRight size={13} /></div>
          </Link>
        ))}
      </div>
    </div>
  );
}
