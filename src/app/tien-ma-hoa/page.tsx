import { MarketCard } from "@/components/MarketCard";
import { QuoteTable } from "@/components/tables/QuoteTable";
import { PageHeader, SectionTitle, Card } from "@/components/ui";
import { LiveBadge } from "@/components/LiveBadge";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { getCryptoLive, getFearGreed } from "@/lib/market-live";
import { formatUsdCompact } from "@/lib/format";

export const metadata = { title: "Tiền mã hóa" };
export const revalidate = 900;

export default async function CryptoPage() {
  const [{ data: crypto, live, source, syncedAt }, fng] = await Promise.all([
    getCryptoLive(),
    getFearGreed(),
  ]);
  const totalMcap = crypto.reduce((a, c) => a + c.marketCap, 0);
  const btc = crypto.find((c) => c.symbol === "BTC");
  const btcDom = btc && totalMcap ? (btc.marketCap / totalMcap) * 100 : 0;

  return (
    <div>
      <Breadcrumbs items={[{ label: "Tiền mã hóa" }]} />
      <PageHeader
        title="Thị trường tiền mã hóa"
        subtitle="Giá các đồng tiền mã hóa hàng đầu theo vốn hóa thị trường, cập nhật 15 phút/lần."
        action={<LiveBadge live={live} />}
      />

      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card><div className="text-[11px] text-muted">Tổng vốn hóa</div><div className="mt-1 text-lg font-bold text-gold">{formatUsdCompact(totalMcap)}</div></Card>
        <Card><div className="text-[11px] text-muted">Bitcoin Dominance</div><div className="mt-1 text-lg font-bold">{btcDom.toFixed(1)}%</div></Card>
        <Card><div className="text-[11px] text-muted">Chỉ số Sợ hãi & Tham lam</div><div className="mt-1 text-lg font-bold text-gold">{fng.value} • {fng.label}</div></Card>
        <Card><div className="text-[11px] text-muted">Nguồn dữ liệu</div><div className="mt-1 text-sm font-semibold">{source}</div></Card>
      </div>

      <section className="mb-8">
        <SectionTitle>Tiền mã hóa hàng đầu</SectionTitle>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {crypto.map((q) => (
            <MarketCard key={q.symbol} quote={q} digits={q.price < 10 ? 4 : 2} />
          ))}
        </div>
      </section>

      <QuoteTable rows={crypto} exportName="tien-ma-hoa-orca" />

      <p className="mt-3 text-xs text-muted">
        Nguồn: {source} • Ưu tiên: CoinGecko → Binance → Finnhub • Đồng bộ lúc {new Date(syncedAt).toLocaleString("vi-VN")} (GMT+7) • Tự động làm mới 15 phút/lần.
      </p>
    </div>
  );
}
