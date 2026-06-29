import { getProvidersStatus } from "@/lib/providers";
import { getSyncStatus } from "@/lib/stock-sync";
import { ensureStocksLoaded } from "@/lib/stock-bootstrap";
import { db } from "@/db";
import { stocks } from "@/db/schema";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/system/status
 * Trạng thái Realtime Data Engine: nguồn dữ liệu + sync DB + phân bố sàn.
 * Đồng thời đảm bảo dữ liệu đã được nạp (auto bootstrap nếu rỗng).
 */
export async function GET() {
  try {
    // Kích hoạt bootstrap (an toàn) trước khi báo cáo trạng thái
    await ensureStocksLoaded().catch(() => 0);

    const [providers, sync, byExchange] = await Promise.all([
      getProvidersStatus(),
      getSyncStatus().catch(() => null),
      db.select({
        exchange: stocks.exchange,
        c: sql<number>`count(*)`,
      }).from(stocks).where(sql`${stocks.status} = 'active'`).groupBy(stocks.exchange).catch(() => []),
    ]);

    const exchanges: Record<string, number> = {};
    for (const row of byExchange as { exchange: string; c: number }[]) {
      exchanges[row.exchange] = Number(row.c);
    }

    return Response.json({
      ok: true,
      providers,
      sync,
      exchanges,
      refreshSeconds: 900,
      serverTime: new Date().toISOString(),
    });
  } catch (e) {
    return Response.json(
      { ok: false, error: e instanceof Error ? e.message : "Error" },
      { status: 500 },
    );
  }
}
