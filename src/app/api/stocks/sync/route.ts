import { syncListing, syncPrices, getSyncStatus } from "@/lib/stock-sync";
import { db } from "@/db";
import { stocks } from "@/db/schema";
import { asc, sql, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * POST /api/stocks/sync
 *   ?prices=1        Đồng bộ một trang giá (mặc định bật)
 *   ?batch=120       Số mã đồng bộ giá mỗi lần (mặc định 120)
 *   ?listing=0       Bỏ qua đồng bộ danh sách
 *
 * Chiến lược "toàn bộ danh mục theo chu kỳ": mỗi lần gọi sẽ ưu tiên những mã
 * có dữ liệu giá CŨ NHẤT (priceUpdatedAt nulls first), nhờ vậy sau vài chu kỳ
 * 15 phút toàn bộ ~1.500 mã đều được cập nhật luân phiên (incremental update).
 */
export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const doListing = searchParams.get("listing") !== "0";
    const doPrices = searchParams.get("prices") !== "0";
    const batch = Math.min(200, Math.max(10, Number(searchParams.get("batch") ?? "120")));

    const listing = doListing ? await syncListing() : null;

    let priceCount = 0;
    if (doPrices) {
      // Ưu tiên mã chưa từng có giá hoặc cập nhật lâu nhất
      const stale = await db.select({ symbol: stocks.symbol })
        .from(stocks)
        .where(eq(stocks.status, "active"))
        .orderBy(sql`${stocks.priceUpdatedAt} asc nulls first`, asc(stocks.symbol))
        .limit(batch);
      priceCount = await syncPrices(stale.map((r) => r.symbol));
    }

    const status = await getSyncStatus();
    return Response.json({
      ok: true,
      listing,
      pricesSynced: priceCount,
      status,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    return Response.json({
      ok: false,
      error: e instanceof Error ? e.message : "Unknown error",
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const status = await getSyncStatus();
    return Response.json({ ok: true, ...status });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
