import { db } from "@/db";
import { stocks } from "@/db/schema";
import { sql, or, ilike, and, eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const exchange = searchParams.get("exchange");
  const sector = searchParams.get("sector");
  const limit = Math.min(100, Number(searchParams.get("limit") ?? "50"));
  const offset = Number(searchParams.get("offset") ?? "0");
  const sort = searchParams.get("sort") ?? "symbol";
  const order = searchParams.get("order") === "desc" ? "desc" : "asc";

  try {
    const conditions = [eq(stocks.status, "active")];

    if (q) {
      // Remove Vietnamese diacritics for fuzzy matching
      const normalized = q.toLowerCase();
      conditions.push(
        or(
          ilike(stocks.symbol, `%${normalized}%`),
          ilike(stocks.name, `%${normalized}%`),
          ilike(stocks.sector, `%${normalized}%`),
          ilike(stocks.industry, `%${normalized}%`),
        )!,
      );
    }

    if (exchange) {
      conditions.push(eq(stocks.exchange, exchange.toUpperCase()));
    }

    if (sector) {
      conditions.push(ilike(stocks.sector, `%${sector}%`));
    }

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

    return Response.json({
      ok: true,
      data: results,
      total: Number(countResult[0]?.count ?? 0),
      limit,
      offset,
    }, {
      headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=300" },
    });
  } catch (e) {
    return Response.json({
      ok: false,
      error: e instanceof Error ? e.message : "Search failed",
    }, { status: 500 });
  }
}
