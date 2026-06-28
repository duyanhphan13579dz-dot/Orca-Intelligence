import Link from "next/link";
import { getTechSignals } from "@/lib/market-data";
import { Gauge } from "@/components/Gauge";
import { PageHeader, Card } from "@/components/ui";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export const metadata = { title: "Phân tích kỹ thuật" };

export default function TechPage() {
  const signals = getTechSignals();
  return (
    <div>
      <Breadcrumbs items={[{ label: "Phân tích kỹ thuật" }]} />
      <PageHeader
        title="Phân tích kỹ thuật"
        subtitle="Đánh giá xu hướng (tăng / giảm / trung lập) cho các chỉ số và tài sản chủ chốt dựa trên hệ thống tín hiệu tổng hợp."
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {signals.map((s) => (
          <Link key={s.symbol} href={`/phan-tich-ky-thuat/${s.symbol}`} className="glass group rounded-xl p-4 transition hover:border-gold/40">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-semibold group-hover:text-gold">{s.name}</span>
              <span className="text-xs text-muted">{s.symbol}</span>
            </div>
            <Gauge score={s.score} label={s.rating} size={170} />
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted">
              <span>RSI: <b className="text-white/90">{s.rsi}</b></span>
              <span>MACD: <b className="text-white/90">{s.macd}</b></span>
              <span>Hỗ trợ: {s.support}</span>
              <span>Kháng cự: {s.resistance}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
