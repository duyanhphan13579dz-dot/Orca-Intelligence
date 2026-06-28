import { notFound } from "next/navigation";
import Link from "next/link";
import { getCommodity, getCommodities } from "@/lib/market-data";
import { CandleChart } from "@/components/CandleChart";
import { AiPanel } from "@/components/AiPanel";
import { WatchlistButton } from "@/components/WatchlistButton";
import { PriceChange } from "@/components/PriceChange";
import { Card, SectionTitle, Badge } from "@/components/ui";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { formatNumber } from "@/lib/format";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = getCommodity(slug);
  return { title: c ? c.name : "Hàng hóa" };
}

export default async function CommodityDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = getCommodity(slug);
  if (!c) notFound();
  const peers = getCommodities().filter((x) => x.category === c.category && x.slug !== c.slug).slice(0, 5);

  const stat = (label: string, value: string) => (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
      <div className="text-[11px] text-muted">{label}</div>
      <div className="mt-0.5 font-semibold">{value}</div>
    </div>
  );

  return (
    <div>
      <Breadcrumbs items={[{ label: "Hàng hóa", href: "/hang-hoa" }, { label: c.name }]} />
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{c.icon}</span>
            <h1 className="text-3xl font-bold">{c.name}</h1>
            <Badge tone={c.region === "vn" ? "gold" : "royal"}>{c.region === "vn" ? "Việt Nam" : "Quốc tế"}</Badge>
            <Badge>{c.category}</Badge>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <span className="text-3xl font-bold">{formatNumber(c.price)}</span>
            <span className="text-sm text-muted">{c.unit}</span>
            <PriceChange change={c.change} pct={c.changePct} />
          </div>
        </div>
        <WatchlistButton symbol={c.slug} name={c.name} type="hang-hoa" href={`/hang-hoa/${c.slug}`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <CandleChart seed={c.slug} base={c.price} />
          <Card>
            <SectionTitle>Lịch sử giá phiên</SectionTitle>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {stat("Giá mở cửa", formatNumber(c.open))}
              {stat("Giá cao nhất", formatNumber(c.high))}
              {stat("Giá thấp nhất", formatNumber(c.low))}
              {stat("Giá đóng cửa", formatNumber(c.prevClose))}
              {stat("Chênh lệch", formatNumber(c.change))}
              {stat("Cập nhật", new Date(c.updatedAt).toLocaleString("vi-VN"))}
            </div>
          </Card>
          <Card>
            <SectionTitle>Các yếu tố tác động</SectionTitle>
            <ul className="list-inside list-disc space-y-1.5 text-sm text-muted">
              <li>Cung – cầu trên thị trường {c.region === "vn" ? "nội địa" : "thế giới"}.</li>
              <li>Biến động tỷ giá và chính sách tiền tệ của các ngân hàng trung ương lớn (FED, ECB).</li>
              <li>Yếu tố mùa vụ, tồn kho và chi phí logistics.</li>
              <li>Diễn biến địa chính trị và các yếu tố vĩ mô toàn cầu.</li>
            </ul>
          </Card>
        </div>
        <div className="space-y-6">
          <AiPanel
            items={[
              { icon: "summary", title: "Tổng quan AI", text: `Giá ${c.name} ${c.changePct >= 0 ? "tăng" : "giảm"} ${Math.abs(c.changePct)}% trong phiên gần nhất, phản ánh ${c.changePct >= 0 ? "lực cầu cải thiện" : "áp lực bán gia tăng"}.` },
              { icon: "trend", title: "Dự báo xu hướng", text: `Trong ngắn hạn, giá có thể ${c.changePct >= 0 ? "tiếp tục duy trì đà tăng nếu giữ vững vùng hỗ trợ" : "kiểm định lại vùng hỗ trợ gần nhất"}.` },
              { icon: "risk", title: "Rủi ro", text: "Biến động mạnh có thể xảy ra khi có thông tin vĩ mô bất ngờ hoặc thay đổi chính sách." },
            ]}
          />
          <Card>
            <SectionTitle href="/hang-hoa">Hàng hóa liên quan</SectionTitle>
            <div className="space-y-1.5">
              {peers.map((p) => (
                <Link key={p.slug} href={`/hang-hoa/${p.slug}`} className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-white/5">
                  <span className="flex items-center gap-2"><span>{p.icon}</span> {p.name}</span>
                  <PriceChange change={p.change} pct={p.changePct} showIcon={false} />
                </Link>
              ))}
            </div>
          </Card>
          <Card>
            <SectionTitle href="/tin-tuc">Tin tức liên quan</SectionTitle>
            <ul className="space-y-2 text-sm">
              <li><Link href="/tin-tuc/gia-vang-lap-dinh" className="text-muted hover:text-gold">Giá kim loại quý lập đỉnh mới</Link></li>
              <li><Link href="/tin-tuc/gia-dau-giam" className="text-muted hover:text-gold">Biến động giá năng lượng thế giới</Link></li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
