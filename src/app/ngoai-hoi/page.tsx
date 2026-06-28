import { MarketCard } from "@/components/MarketCard";
import { QuoteTable } from "@/components/tables/QuoteTable";
import { PageHeader, SectionTitle } from "@/components/ui";
import { LiveBadge } from "@/components/LiveBadge";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { getForexLive } from "@/lib/market-live";

export const metadata = { title: "Ngoại hối" };
export const revalidate = 900;

export default async function NgoaiHoiPage() {
  const { data: fx, live, source, syncedAt } = await getForexLive();
  return (
    <div>
      <Breadcrumbs items={[{ label: "Ngoại hối" }]} />
      <PageHeader
        title="Thị trường ngoại hối"
        subtitle="Tỷ giá các cặp tiền tệ chủ chốt và chéo với VND, cập nhật 15 phút/lần."
        action={<LiveBadge live={live} />}
      />
      <section className="mb-8">
        <SectionTitle>Cặp tiền tệ chính</SectionTitle>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {fx.map((q) => (
            <MarketCard key={q.symbol} quote={q} digits={q.price > 1000 ? 0 : 4} />
          ))}
        </div>
      </section>
      <QuoteTable rows={fx} digits={4} exportName="ngoai-hoi-orca" />
      <p className="mt-3 text-xs text-muted">
        Nguồn: {source} • Ưu tiên: Finnhub → Investing.com → WiData • Đồng bộ lúc {new Date(syncedAt).toLocaleString("vi-VN")} (GMT+7) • Tự động làm mới 15 phút/lần.
      </p>
    </div>
  );
}
