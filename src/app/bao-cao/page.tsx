import { getIndices, getTopMovers, getAiInsights } from "@/lib/market-data";
import { PageHeader, Card, SectionTitle, Badge } from "@/components/ui";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PrintButton } from "@/components/PrintButton";
import { Logo } from "@/components/Logo";
import { PriceChange } from "@/components/PriceChange";
import { formatNumber } from "@/lib/format";
import Link from "next/link";

export const metadata = { title: "Báo cáo" };

const PERIODS = [
  { key: "ngay", label: "Báo cáo ngày" },
  { key: "tuan", label: "Báo cáo tuần" },
  { key: "thang", label: "Báo cáo tháng" },
  { key: "quy", label: "Báo cáo quý" },
  { key: "nam", label: "Báo cáo năm" },
];

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<{ ky?: string }>;
}) {
  const sp = await searchParams;
  const ky = sp.ky ?? "ngay";
  const period = PERIODS.find((p) => p.key === ky) ?? PERIODS[0];
  const indices = getIndices().slice(0, 7);
  const movers = getTopMovers();
  const ai = getAiInsights();
  const now = new Date().toLocaleString("vi-VN");

  return (
    <div>
      <Breadcrumbs items={[{ label: "Báo cáo" }]} />
      <PageHeader
        title="Báo cáo phân tích"
        subtitle="Báo cáo tổng hợp theo ngày, tuần, tháng, quý và năm. Xuất PDF với logo, watermark và nhận định AI."
        action={<PrintButton />}
      />
      <div className="no-print mb-6 flex flex-wrap gap-1.5">
        {PERIODS.map((p) => (
          <Link key={p.key} href={`/bao-cao?ky=${p.key}`} className={`rounded-full px-3 py-1.5 text-xs ${ky === p.key ? "gold-gradient text-navy" : "glass text-muted hover:text-white"}`}>{p.label}</Link>
        ))}
      </div>

      <div className="glass rounded-xl p-6 sm:p-8">
        {/* Report header */}
        <div className="mb-6 flex items-center justify-between border-b pb-4">
          <Logo href={null} />
          <div className="text-right text-xs text-muted">
            <div className="font-semibold text-gold">{period.label.toUpperCase()}</div>
            <div>Ngày xuất: {now}</div>
          </div>
        </div>

        <h2 className="text-2xl font-bold">{period.label} thị trường tài chính</h2>
        <p className="mt-2 text-sm text-muted">Tổng hợp diễn biến các chỉ số chính, top biến động và nhận định từ Orca AI.</p>

        <SectionTitle>1. Diễn biến các chỉ số chính</SectionTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted">
                <th className="py-2">Chỉ số</th>
                <th className="py-2 text-right">Giá trị</th>
                <th className="py-2 text-right">Thay đổi</th>
              </tr>
            </thead>
            <tbody>
              {indices.map((i) => (
                <tr key={i.symbol} className="border-b border-white/5">
                  <td className="py-2">{i.name}</td>
                  <td className="py-2 text-right tabular-nums">{formatNumber(i.price)}</td>
                  <td className="py-2 text-right"><PriceChange change={i.change} pct={i.changePct} showIcon={false} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Card>
            <SectionTitle>2. Top tăng mạnh</SectionTitle>
            {movers.gainers.map((s) => (
              <div key={s.symbol} className="flex justify-between border-b border-white/5 py-1.5 text-sm">
                <span>{s.symbol}</span><PriceChange change={s.change} pct={s.changePct} showIcon={false} />
              </div>
            ))}
          </Card>
          <Card>
            <SectionTitle>3. Top giảm mạnh</SectionTitle>
            {movers.losers.map((s) => (
              <div key={s.symbol} className="flex justify-between border-b border-white/5 py-1.5 text-sm">
                <span>{s.symbol}</span><PriceChange change={s.change} pct={s.changePct} showIcon={false} />
              </div>
            ))}
          </Card>
        </div>

        <SectionTitle>4. Nhận định AI</SectionTitle>
        <div className="space-y-2 text-sm leading-relaxed text-muted">
          <p><b className="text-gold">Tổng quan:</b> {ai.summary}</p>
          <p><b className="text-gold">Xu hướng:</b> {ai.trend}</p>
          <p><b className="text-gold">Rủi ro:</b> {ai.risk}</p>
          <p><b className="text-gold">Cơ hội:</b> {ai.opportunity}</p>
        </div>

        <div className="mt-8 border-t pt-4 text-center text-[11px] text-muted">
          <Badge tone="gold">Orca Financial</Badge>
          <p className="mt-2">© {new Date().getFullYear()} Orca Financial — Báo cáo chỉ mang tính tham khảo. Trang 1/1.</p>
        </div>
      </div>
    </div>
  );
}
