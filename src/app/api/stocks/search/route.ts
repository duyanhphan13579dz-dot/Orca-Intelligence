import { db } from "@/db";
import { stocks } from "@/db/schema";
import { sql, or, ilike, and, eq, desc } from "drizzle-orm";
import { ensureStocksLoaded } from "@/lib/stock-bootstrap";
import { searchSeed } from "@/lib/stock-seed";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Trạng thái extension unaccent (tìm kiếm không dấu). Kiểm tra 1 lần.
let unaccentReady = false;
let unaccentChecked = false;
async function ensureUnaccent() {
  if (unaccentChecked) return;
  unaccentChecked = true;
  try {
    await db.execute(sql`CREATE EXTENSION IF NOT EXISTS unaccent`);
    unaccentReady = true;
  } catch (e) {
    unaccentReady = false;
    console.warn("[/api/stocks/search] unaccent không khả dụng, dùng ilike thường:", e instanceof Error ? e.message : e);
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const exchange = searchParams.get("exchange");
  const sector = searchParams.get("sector");
  const limit = Math.min(100, Number(searchParams.get("limit") ?? "50"));
  const offset = Number(searchParams.get("offset") ?? "0");
  const sort = searchParams.get("sort") ?? "symbol";
  const order = searchParams.get("order") === "desc" ? "desc" : "asc";

  // Đảm bảo danh mục đã được preload (tự chạy Initial Sync nếu Production rỗng).
  // An toàn: không throw, có khóa single-flight, bỏ qua nếu đã có dữ liệu.
  let loaded = 0;
  try {
    loaded = await ensureStocksLoaded();
  } catch (e) {
    console.error("[/api/stocks/search] ensureStocksLoaded lỗi:", e instanceof Error ? e.message : e);
  }

  // Bật unaccent (tìm kiếm không dấu) — chạy 1 lần, an toàn nếu không có quyền.
  await ensureUnaccent();

  try {
    const conditions = [eq(stocks.status, "active")];

    if (q) {
      const normalized = q.toLowerCase();
      const like = `%${normalized}%`;
      // Tìm kiếm KHÔNG PHÂN BIỆT DẤU: dùng unaccent nếu khả dụng,
      // ngược lại fallback ilike thường (vẫn không phân biệt hoa/thường).
      const diacritic = unaccentReady
        ? or(
            sql`unaccent(${stocks.symbol}) ilike unaccent(${like})`,
            sql`unaccent(${stocks.name}) ilike unaccent(${like})`,
            sql`unaccent(coalesce(${stocks.sector}, '')) ilike unaccent(${like})`,
            sql`unaccent(coalesce(${stocks.industry}, '')) ilike unaccent(${like})`,
          )!
        : or(
            ilike(stocks.symbol, like),
            ilike(stocks.name, like),
            ilike(stocks.sector, like),
            ilike(stocks.industry, like),
          )!;
      conditions.push(diacritic);
    }
    if (exchange) conditions.push(eq(stocks.exchange, exchange.toUpperCase()));
    if (sector) conditions.push(ilike(stocks.sector, `%${sector}%`));

    const sortCol = sort === "price" ? stocks.price
      : sort === "changePct" ? stocks.changePct
      : sort === "volume" ? stocks.volume
      : sort === "marketCap" ? stocks.marketCap
      : sort === "pe" ? stocks.pe
      : sort === "name" ? stocks.name
      : stocks.symbol;
    const orderFn = order === "desc" ? desc(sortCol) : sortCol;

    const results = await db.select()
      .from(stocks)
      .where(and(...conditions))
      .orderBy(orderFn)
      .limit(limit)
      .offset(offset);

    const countResult = await db.select({ count: sql<number>`count(*)` })
      .from(stocks)
      .where(and(...conditions));
    const total = Number(countResult[0]?.count ?? 0);

    // FALLBACK: nếu DB chưa kịp nạp (đang bootstrap) nhưng người dùng đã
    // tìm kiếm -> trả seed blue-chip để Search KHÔNG rỗng. Không cache rỗng.
    if (results.length === 0 && loaded === 0) {
      const seed = searchSeed(q, exchange, limit);
      return Response.json(
        { ok: true, data: seed, total: seed.length, limit, offset, source: "seed", bootstrapping: true },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    return Response.json(
      { ok: true, data: results, total, limit, offset, source: "db" },
      {
        headers: {
          // Không cache khi rỗng để tránh "đóng băng" trạng thái rỗng.
          "Cache-Control": total === 0 ? "no-store" : "public, s-maxage=900, stale-while-revalidate=300",
        },
      },
    );
  } catch (e) {
    console.error("[/api/stocks/search] Lỗi truy vấn:", e instanceof Error ? e.message : e);
    // DB lỗi -> vẫn phục vụ seed để Search hoạt động
    const seed = searchSeed(q, exchange, limit);
    return Response.json(
      { ok: true, data: seed, total: seed.length, limit, offset, source: "seed", degraded: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
}
