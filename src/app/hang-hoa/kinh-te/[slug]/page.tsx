import { notFound } from "next/navigation";
import { getMacroOne, getMacro } from "@/lib/market-data";
import { AiPanel } from "@/components/AiPanel";
import { Card, SectionTitle, Badge } from "@/components/ui";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Sparkline } from "@/components/Sparkline";
import { colorOf, formatChange } from "@/lib/format";
import Link from "next/link";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const m = getMacroOne(slug);
  return { title: m ? m.name : "Kinh tế vĩ mô" };
}

export default async function MacroDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const m = getMacroOne(slug);
  if (!m) notFound();
  const related = getMacro().filter((x) => x.region === m.region && x.slug !== m.slug).slice(0, 5);

  return (
    <div>
      <Breadcrumbs items={[{ label: "Kinh tế vĩ mô", href: "/kinh-te" }, { label: m.name }]} />
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-3xl font-bold">{m.name}</h1>
        <Badge tone={m.region === "vn" ? "gold" : "royal"}>{m.region === "vn" ? "Việt Nam" : "Quốc tế"}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-xs text-muted">Giá trị hiện tại</div>
                <div className="text-4xl font-bold">{m.value}<span className="ml-1 text-base text-muted">{m.unit}</span></div>
                <div className={`mt-1 text-sm ${colorOf(m.change)}`}>{formatChange(m.change)} so với kỳ trước</div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border border-white/5 p-3"><div className="text-[11px] text-muted">Kỳ trước</div><div className="font-semibold">{m.prev}</div></div>
                <div className="rounded-lg border border-white/5 p-3"><div className="text-[11px] text-muted">Dự báo</div><div className="font-semibold">{m.forecast}</div></div>
              </div>
            </div>
            <div className="mt-4">
              <Sparkline data={m.series} width={760} height={120} positive={m.change >= 0} />
            </div>
          </Card>
          <Card>
            <SectionTitle>Định nghĩa</SectionTitle>
            <p className="text-sm leading-relaxed text-muted">{m.description}</p>
          </Card>
          <Card>
            <SectionTitle>Tác động đến thị trường</SectionTitle>
            <p className="text-sm leading-relaxed text-muted">
              Diễn biến của chỉ số {m.name} có ảnh hưởng trực tiếp đến kỳ vọng chính sách tiền tệ, dòng vốn
              và định giá tài sản. Khi chỉ số {m.change >= 0 ? "tăng" : "giảm"}, thị trường thường phản ứng
              thông qua biến động lãi suất, tỷ giá và khẩu vị rủi ro của nhà đầu tư.
            </p>
          </Card>
        </div>
        <div className="space-y-6">
          <AiPanel
            items={[
              { icon: "summary", title: "Nhận định AI", text: `${m.name} hiện ở mức ${m.value}${m.unit}, ${m.change >= 0 ? "cao hơn" : "thấp hơn"} kỳ trước (${m.prev}).` },
              { icon: "trend", title: "Triển vọng", text: `Dự báo cho kỳ tới là ${m.forecast}${m.unit}, cho thấy xu hướng ${m.change >= 0 ? "tích cực" : "thận trọng"}.` },
            ]}
          />
          <Card>
            <SectionTitle href="/kinh-te">Chỉ số liên quan</SectionTitle>
            <div className="space-y-1.5">
              {related.map((r) => (
                <Link key={r.slug} href={`/kinh-te/${r.slug}`} className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-white/5">
                  <span>{r.name}</span>
                  <span className="font-semibold">{r.value}{r.unit}</span>
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
