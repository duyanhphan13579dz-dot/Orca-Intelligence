import Link from "next/link";
import { getMacro } from "@/lib/market-data";
import { Sparkline } from "@/components/Sparkline";
import { PageHeader, Card, SectionTitle } from "@/components/ui";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { colorOf, formatChange } from "@/lib/format";

export const metadata = { title: "Kinh tế vĩ mô" };

export default function KinhTePage() {
  const macro = getMacro();
  const vn = macro.filter((m) => m.region === "vn");
  const world = macro.filter((m) => m.region === "world");

  const grid = (items: typeof macro) => (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((m) => (
        <Link key={m.slug} href={`/kinh-te/${m.slug}`} className="glass group rounded-xl p-4 transition hover:border-gold/40">
          <div className="flex items-start justify-between">
            <div>
              <div className="font-semibold group-hover:text-gold">{m.name}</div>
              <div className="mt-1 text-2xl font-bold">{m.value}<span className="ml-1 text-xs text-muted">{m.unit}</span></div>
            </div>
            <Sparkline data={m.series} positive={m.change >= 0} />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-muted">Kỳ trước: {m.prev}</span>
            <span className={colorOf(m.change)}>{formatChange(m.change)}</span>
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
        subtitle="Các chỉ số kinh tế quan trọng của Việt Nam và thế giới: GDP, CPI, lãi suất, PMI, FDI và chính sách của các ngân hàng trung ương."
      />
      <Card className="mb-6">
        <SectionTitle>Việt Nam</SectionTitle>
        {grid(vn)}
      </Card>
      <Card>
        <SectionTitle>Quốc tế</SectionTitle>
        {grid(world)}
      </Card>
    </div>
  );
}
