import { PageHeader, Card, ImpactBadge } from "@/components/ui";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { getCalendarEvents } from "@/lib/data-engine";

export const metadata = { title: "Lịch kinh tế" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

const STATUS_CLS: Record<string, string> = {
  "Đã công bố": "text-emerald-400",
  "Đang diễn ra": "text-gold",
  "Sắp diễn ra": "text-muted",
};

export default async function CalendarPage() {
  const events = await getCalendarEvents(7);
  const syncedAt = events[0]?.syncedAt ?? new Date().toISOString();

  const byDate = events.reduce<Record<string, typeof events>>((acc, e) => {
    (acc[e.eventDate] ??= []).push(e);
    return acc;
  }, {});

  return (
    <div>
      <Breadcrumbs items={[{ label: "Lịch kinh tế" }]} />
      <PageHeader
        title="Lịch kinh tế"
        subtitle="Sự kiện kinh tế 7 ngày tới: FED, ECB, BOJ, CPI, PMI, IPO, cổ tức. Ngày và giờ là thời điểm công bố thực tế, không phải thời điểm đồng bộ."
      />

      <div className="mb-4 flex items-center gap-3 text-xs text-muted">
        <DataSourceBadge
          sourceName="Lịch kinh tế tổng hợp (S&P Global, BLS, ECB, BOJ, TCTK)"
          publishedAt={null}
          publishedAtRaw="Lịch sự kiện định kỳ — cập nhật mỗi 15 phút"
          syncedAt={syncedAt}
          status="ok"
        />
      </div>

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
                    <th className="py-2">Giờ (GMT+7)</th>
                    <th className="py-2">Quốc gia</th>
                    <th className="py-2">Sự kiện</th>
                    <th className="py-2">Ảnh hưởng</th>
                    <th className="py-2 text-center">Trạng thái</th>
                    <th className="py-2 text-right">Thực tế</th>
                    <th className="py-2 text-right">Dự báo</th>
                    <th className="py-2 text-right">Kỳ trước</th>
                    <th className="py-2 text-right">Nguồn</th>
                  </tr>
                </thead>
                <tbody>
                  {evs.map((e) => (
                    <tr key={e.eventId} className="border-b border-white/5 hover:bg-white/5">
                      <td className="py-2.5 tabular-nums font-mono">{e.eventTime || "—"}</td>
                      <td className="py-2.5"><span className="mr-1">{e.flag}</span>{e.country}</td>
                      <td className="py-2.5 font-medium">{e.event}</td>
                      <td className="py-2.5"><ImpactBadge impact={e.impact} /></td>
                      <td className={`py-2.5 text-center text-xs font-semibold ${STATUS_CLS[e.status] ?? "text-muted"}`}>{e.status}</td>
                      <td className="py-2.5 text-right font-semibold text-gold">{e.actual}</td>
                      <td className="py-2.5 text-right text-muted">{e.forecast}</td>
                      <td className="py-2.5 text-right text-muted">{e.previous}</td>
                      <td className="py-2.5 text-right text-[10px] text-muted">{e.sourceKey}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ))}
        {Object.keys(byDate).length === 0 && (
          <Card><p className="text-muted text-sm text-center py-4">Đang tải lịch kinh tế...</p></Card>
        )}
      </div>
    </div>
  );
}
