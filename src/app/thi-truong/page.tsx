import { getIndicesLive, getStocksLive } from "@/lib/vndirect";
import { MarketCard } from "@/components/MarketCard";
import { Heatmap } from "@/components/Heatmap";
import { PageHeader, Card, SectionTitle } from "@/components/ui";
import { LiveBadge } from "@/components/LiveBadge";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PriceChange } from "@/components/PriceChange";
import Link from "next/link";

export const metadata = { title: "Thị trường" };
export const revalidate = 900;

const VN = ["VNINDEX", "VN30", "HNX", "UPCOM"];

export default async function ThiTruongPage({
  searchParams,
}: {
  searchParams: Promise<{ "khu-vuc"?: string }>;
}) {
  const sp = await searchParams;
  const region = sp["khu-vuc"];
  const [{ quotes: indices }, { stocks }] = await Promise.all([getIndicesLive(), getStocksLive()]);
  const byPct = [...stocks].sort((a, b) => b.changePct - a.changePct);
  const byVol = [...stocks].sort((a, b) => b.volume - a.volume);
  const byCap = [...stocks].sort((a, b) => b.marketCap - a.marketCap);
  const movers = {
    gainers: byPct.slice(0, 5),
    losers: byPct.slice(-5).reverse(),
    liquidity: byVol.slice(0, 5),
    foreignBuy: byCap.slice(0, 5),
    foreignSell: [...byCap].reverse().slice(0, 5),
  };
  const vn = indices.filter((i) => VN.includes(i.symbol));
  const intl = indices.filter((i) => !VN.includes(i.symbol));

  return (
    <div>
      <Breadcrumbs items={[{ label: "Thị trường" }]} />
      <PageHeader
        title="Tổng quan thị trường"
        subtitle="Diễn biến các chỉ số trong nước và quốc tế, bản đồ nhiệt và top biến động theo thời gian thực."
        action={<LiveBadge live />}
      />

      {region !== "quoc-te" && (
        <section className="mb-8">
          <SectionTitle>Thị trường Việt Nam</SectionTitle>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {vn.map((q) => (
              <MarketCard key={q.symbol} quote={q} href={`/phan-tich-ky-thuat/${q.symbol}`} />
            ))}
          </div>
        </section>
      )}

      {region !== "vn" && (
        <section className="mb-8">
          <SectionTitle>Thị trường Quốc tế</SectionTitle>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {intl.map((q) => (
              <MarketCard key={q.symbol} quote={q} href={`/phan-tich-ky-thuat/${q.symbol}`} />
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <SectionTitle href="/co-phieu">Bản đồ nhiệt theo ngành</SectionTitle>
          <Heatmap stocks={stocks} />
        </Card>
        <Card>
          <SectionTitle href="/co-phieu">Top biến động</SectionTitle>
          {[
            { t: "Top tăng mạnh", r: movers.gainers },
            { t: "Top giảm mạnh", r: movers.losers },
            { t: "Top thanh khoản", r: movers.liquidity },
            { t: "Khối ngoại mua ròng", r: movers.foreignBuy },
            { t: "Khối ngoại bán ròng", r: movers.foreignSell },
          ].map((g) => (
            <div key={g.t} className="mb-3">
              <div className="mb-1 text-xs font-semibold text-muted">{g.t}</div>
              {g.r.slice(0, 3).map((s) => (
                <Link key={s.symbol} href={`/co-phieu/${s.symbol}`} className="flex items-center justify-between rounded-md px-2 py-1 text-sm hover:bg-white/5">
                  <span className="font-medium">{s.symbol}</span>
                  <PriceChange change={s.change} pct={s.changePct} showIcon={false} />
                </Link>
              ))}
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
