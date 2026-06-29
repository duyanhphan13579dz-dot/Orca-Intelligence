import { notFound } from "next/navigation";
import { getTechSignal, getIndex } from "@/lib/market-data";
import { CandleChart } from "@/components/CandleChart";
import { Gauge } from "@/components/Gauge";
import { AiPanel } from "@/components/AiPanel";
import { Card, SectionTitle, Badge } from "@/components/ui";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { formatNumber } from "@/lib/format";

export async function generateMetadata({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const t = getTechSignal(symbol);
  return { title: t ? `Phân tích kỹ thuật ${t.name}` : "Phân tích kỹ thuật" };
}

export default async function TechDetail({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;
  const t = getTechSignal(symbol) ?? indexToSignal(symbol);
  if (!t) notFound();

  const indicators = [
    { name: "RSI (14)", value: t.rsi.toString(), signal: t.rsi > 70 ? "Quá mua" : t.rsi < 30 ? "Quá bán" : "Trung lập" },
    { name: "MACD (12,26,9)", value: t.macd, signal: t.macd },
    { name: "EMA (9)", value: formatNumber(t.base * 0.99), signal: "Mua" },
    { name: "SMA (20)", value: formatNumber(t.base * 0.98), signal: "Mua" },
    { name: "Bollinger Bands", value: "Giữa dải", signal: "Trung lập" },
    { name: "Fibonacci 61.8%", value: formatNumber(t.base * 0.95), signal: "Hỗ trợ" },
  ];

  return (
    <div>
      <Breadcrumbs items={[{ label: "Phân tích kỹ thuật", href: "/phan-tich-ky-thuat" }, { label: t.name }]} />
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-3xl font-bold">{t.name}</h1>
        <Badge tone="gold">{t.rating}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <CandleChart seed={t.symbol} base={t.base} symbol={t.symbol} />
          <Card>
            <SectionTitle>Bảng chỉ báo kỹ thuật</SectionTitle>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted">
                    <th className="py-2">Chỉ báo</th>
                    <th className="py-2">Giá trị</th>
                    <th className="py-2 text-right">Tín hiệu</th>
                  </tr>
                </thead>
                <tbody>
                  {indicators.map((i) => (
                    <tr key={i.name} className="border-b border-white/5">
                      <td className="py-2.5">{i.name}</td>
                      <td className="py-2.5 text-muted">{i.value}</td>
                      <td className="py-2.5 text-right font-medium text-gold">{i.signal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
          <Card>
            <SectionTitle>Hỗ trợ &amp; Kháng cự</SectionTitle>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                <div className="text-[11px] text-muted">Vùng hỗ trợ</div>
                <div className="font-bold text-emerald-400">{formatNumber(t.support)}</div>
              </div>
              <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3">
                <div className="text-[11px] text-muted">Vùng kháng cự</div>
                <div className="font-bold text-rose-400">{formatNumber(t.resistance)}</div>
              </div>
            </div>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <SectionTitle>Đánh giá tổng hợp</SectionTitle>
            <Gauge score={t.score} label={t.rating} size={200} />
            <p className="mt-3 text-center text-sm text-muted">Điểm tín hiệu: <b className="text-gold">{t.score}</b> / 100</p>
          </Card>
          <AiPanel
            items={[
              { icon: "summary", title: "Góc nhìn AI", text: `Hệ thống tín hiệu cho thấy ${t.name} đang ở trạng thái "${t.rating}". RSI ${t.rsi} và ${t.macd}.` },
              { icon: "trend", title: "Kịch bản", text: `Nếu vượt kháng cự ${formatNumber(t.resistance)}, xu hướng tăng được củng cố. Ngược lại, mất hỗ trợ ${formatNumber(t.support)} có thể kích hoạt nhịp điều chỉnh.` },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

function indexToSignal(symbol: string) {
  const idx = getIndex(symbol);
  if (!idx) return undefined;
  return {
    symbol: idx.symbol,
    name: idx.name,
    base: idx.price,
    rating: idx.changePct >= 0 ? ("Mua" as const) : ("Trung lập" as const),
    score: Math.round(idx.changePct * 20),
    rsi: 55,
    macd: idx.changePct >= 0 ? "Tín hiệu mua" : "Tín hiệu bán",
    support: Number((idx.price * 0.97).toFixed(2)),
    resistance: Number((idx.price * 1.03).toFixed(2)),
  };
}
