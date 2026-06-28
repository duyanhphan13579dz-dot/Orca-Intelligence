import { getCalendar } from "@/lib/market-data";
import { PageHeader, Card, ImpactBadge } from "@/components/ui";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export const metadata = { title: "Lịch kinh tế" };

export default function CalendarPage() {
  const events = getCalendar();
  const byDate = events.reduce<Record<string, typeof events>>((acc, e) => {
    (acc[e.date] ??= []).push(e);
    return acc;
  }, {});

  return (
    <div>
      <Breadcrumbs items={[{ label: "Lịch kinh tế" }]} />
      <PageHeader
        title="Lịch kinh tế"
        subtitle="Các sự kiện kinh tế quan trọng: FED, ECB, BOJ, GDP, CPI, PMI, IPO và lịch trả cổ tức."
      />
      <div className="space-y-6">
        {Object.entries(byDate).map(([date, evs]) => (
          <Card key={date}>
            <div className="mb-3 text-sm font-semibold text-gold">
              {new Date(date).toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted">
                    <th className="py-2">Giờ</th>
                    <th className="py-2">Quốc gia</th>
                    <th className="py-2">Sự kiện</th>
                    <th className="py-2">Ảnh hưởng</th>
                    <th className="py-2 text-right">Thực tế</th>
                    <th className="py-2 text-right">Dự báo</th>
                    <th className="py-2 text-right">Kỳ trước</th>
                  </tr>
                </thead>
                <tbody>
                  {evs.map((e) => (
                    <tr key={e.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-2.5 tabular-nums">{e.time}</td>
                      <td className="py-2.5"><span className="mr-1">{e.flag}</span>{e.country}</td>
                      <td className="py-2.5 font-medium">{e.event}</td>
                      <td className="py-2.5"><ImpactBadge impact={e.impact} /></td>
                      <td className="py-2.5 text-right font-semibold text-gold">{e.actual}</td>
                      <td className="py-2.5 text-right text-muted">{e.forecast}</td>
                      <td className="py-2.5 text-right text-muted">{e.previous}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
