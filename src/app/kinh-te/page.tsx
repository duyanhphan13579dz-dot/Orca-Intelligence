import { PageHeader, Card, SectionTitle } from "@/components/ui";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { Sparkline } from "@/components/Sparkline";
import { getMacroData } from "@/lib/data-engine";
import { makeSeries } from "@/lib/market-data";
import { colorOf, formatChange } from "@/lib/format";
import Link from "next/link";

export const metadata = { title: "Kinh tế vĩ mô" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function KinhTePage() {
  const macro = await getMacroData();
  const vn = macro.filter((m) => m.region === "vn");
  const world = macro.filter((m) => m.region === "world");

  const grid = (items: typeof macro) => (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((m) => (
        <Link key={m.slug} href={`/kinh-te/${m.slug}`} className="glass group rounded-xl p-4 transition hover:border-gold/40">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-semibold group-hover:text-gold">{m.name}</div>
              <div className="mt-1 text-2xl font-bold">
                {m.value}
                <span className="ml-1 text-xs text-muted">{m.unit}</span>
              </div>
            </div>
            <Sparkline data={makeSeries(m.slug, m.valueNumeric || 1, 24, 0.04)} positive={m.change >= 0} />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-muted">Kỳ trước: {m.prev || "—"}</span>
            <span className={colorOf(m.change)}>{m.change ? formatChange(m.change) : "—"}</span>
          </div>
          <div className="mt-2">
            <DataSourceBadge
              sourceName={m.sourceName}
              publishedAt={m.publishedAt}
              publishedAtRaw={m.publishedAtRaw}
              syncedAt={m.syncedAt}
              compact
              status="ok"
            />
          </div>
        </Link>
      ))}
    </div>
  );

  return (
    <div>
      <Breadcrumbs items={[{ label: "Kinh tế vĩ mô" }]} />
      <PageHeader
        title="Kinh tế vĩ mô"
        subtitle={`${macro.length} chỉ số. Dữ liệu từ World Bank (GDP, CPI, FDI) và nguồn chính thức các ngân hàng trung ương. Mỗi chỉ số hiển thị kỳ công bố và nguồn dữ liệu thực tế.`}
      />
      <Card className="mb-6">
        <SectionTitle>Việt Nam</SectionTitle>
        {vn.length > 0 ? grid(vn) : <p className="text-muted text-sm">Đang đồng bộ dữ liệu...</p>}
      </Card>
      <Card>
        <SectionTitle>Quốc tế</SectionTitle>
        {world.length > 0 ? grid(world) : <p className="text-muted text-sm">Đang đồng bộ dữ liệu...</p>}
      </Card>
    </div>
  );
}
