import { getRecentNews } from "@/lib/data-engine";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(50, Number(searchParams.get("limit") ?? "20"));
  const category = searchParams.get("category") ?? undefined;
  const maxHours = Number(searchParams.get("maxHours") ?? "24");

  try {
    const news = await getRecentNews(limit, category, maxHours);
    return Response.json(
      { ok: true, data: news, total: news.length, syncedAt: new Date().toISOString() },
      { headers: { "Cache-Control": news.length === 0 ? "no-store" : "public, s-maxage=900, stale-while-revalidate=300" } },
    );
  } catch (e) {
    return Response.json({ ok: false, error: e instanceof Error ? e.message : "Error" }, { status: 500 });
  }
}
