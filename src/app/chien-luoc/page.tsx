import Link from "next/link";
import { getStrategiesLive } from "@/lib/data-engine/strategy-engine";
import { PageHeader, Card, Badge } from "@/components/ui";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { LiveBadge } from "@/components/LiveBadge";
import { ArrowRight, TrendingUp, Activity } from "lucide-react";

export const metadata = { title: "Chiến lược đầu tư" };
export const revalidate = 900;

export default async function StrategyPage() {
  const strategies = await getStrategiesLive();
  const isLive = strategies.some((s) => s.isLive);
  const latest = strategies[0];

  return (
    <div>
      <Breadcrumbs items={[{ label: "Chiến lược đầu tư" }]} />
      <PageHeader
        title="Chiến lược đầu tư"
        subtitle="Chiến lược AI tự động từ dữ liệu thị trường mới nhất. Không sử dụng mốc chỉ số cũ. Làm mới mỗi 15 phút."
        action={<LiveBadge live={isLive} />}
      />

      {/* Thị trường cơ sở — từ dữ liệu thật */}
      {latest?.isLive && (
        <Card className="mb-6">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gold">
            <Activity size={16} /> Thị trường cơ sở — VNINDEX thật
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <MarketStat label="Giá hiện tại" value={latest.basePrice.toLocaleString("vi-VN", { minimumFractionDigits: 2 })} highlight />
            <MarketStat label="Thay đổi" value={`${latest.baseChangePct > 0 ? "+" : ""}${latest.baseChangePct.toFixed(2)}%`} />
            <MarketStat label="RSI(14)" value={latest.rsi14.toString()} />
            <MarketStat label="MA20" value={latest.ma20.toLocaleString("vi-VN", { minimumFractionDigits: 2 })} />
            <MarketStat label="MA50" value={latest.ma50.toLocaleString("vi-VN", { minimumFractionDigits: 2 })} />
          </div>
          <div className="mt-3">
            <DataSourceBadge
              sourceName={latest.dataSource}
              publishedAt={latest.dataTime}
              publishedAtRaw={latest.dataTime}
              syncedAt={latest.generatedAt}
              status="ok"
            />
          </div>
        </Card>
      )}

      {!isLive && (
        <div className="mb-4 rounded-lg border border-gold/20 bg-gold/5 px-4 py-3 text-sm text-muted">
          🟡 Chưa đồng bộ được dữ liệu VNINDEX. Chiến lược sẽ được tạo tự động khi kết nối thành công.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {strategies.map((s) => (
          <Link key={s.slug} href={`/chien-luoc/${s.slug}`} className="glass group rounded-xl p-5 transition hover:border-gold/40">
            <Badge tone="gold">Theo {s.period}</Badge>
            <h3 className="mt-3 text-lg font-semibold group-hover:text-gold">{s.title}</h3>
            <p className="mt-2 text-sm text-muted line-clamp-3">{s.summary}</p>
            <div className="mt-4 space-y-1.5 text-sm">
              <StratRow label="Xu hướng" value={s.trend} />
              <StratRow label="Mức độ rủi ro" value={s.risk} />
              <StratRow label="Độ tin cậy" value={`${s.confidence}%`} highlight />
              {s.isLive && <StratRow label="Dữ liệu" value={`${s.baseIndex} ${s.basePrice.toLocaleString("vi-VN", { minimumFractionDigits: 2 })}`} />}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="flex items-center gap-1 text-xs font-medium text-gold">Xem chi tiết <ArrowRight size={13} /></span>
              {s.isLive
                ? <span className="text-[10px] text-emerald-400">🟢 Dữ liệu thật</span>
                : <span className="text-[10px] text-gold">🟡 Đang chờ đồng bộ</span>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function MarketStat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return <div className={`rounded-lg border p-2.5 text-center ${highlight ? "border-gold/30 bg-gold/10" : "border-white/10 bg-white/[0.02]"}`}><div className="text-[10px] text-muted">{label}</div><div className={`mt-0.5 text-sm font-bold ${highlight ? "text-gold" : ""}`}>{value}</div></div>;
}
function StratRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return <div className="flex justify-between"><span className="text-muted">{label}</span><span className={highlight ? "font-bold text-gold" : "font-medium"}>{value}</span></div>;
}
