import { getCommodities } from "@/lib/market-data";
import { CommoditiesTable } from "@/components/tables/CommoditiesTable";
import { MarketCard } from "@/components/MarketCard";
import { PageHeader, SectionTitle } from "@/components/ui";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export const metadata = { title: "Hàng hóa" };

export default function HangHoaPage() {
  const commodities = getCommodities();
  const vn = commodities.filter((c) => c.region === "vn");
  return (
    <div>
      <Breadcrumbs items={[{ label: "Hàng hóa" }]} />
      <PageHeader
        title="Thị trường hàng hóa"
        subtitle="Giá hàng hóa Việt Nam và thế giới theo thời gian thực: kim loại, năng lượng, nông sản, cà phê, cao su, chăn nuôi, thủy sản."
      />
      <section className="mb-8">
        <SectionTitle>Hàng hóa Việt Nam nổi bật</SectionTitle>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {vn.slice(0, 5).map((c) => (
            <MarketCard key={c.slug} quote={c} href={`/hang-hoa/${c.slug}`} />
          ))}
        </div>
      </section>
      <CommoditiesTable rows={commodities} />
    </div>
  );
}
