import { getCalendarEvents } from "@/lib/data-engine";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const days = Math.min(30, Number(searchParams.get("days") ?? "7"));
  try {
    const data = await getCalendarEvents(days);
    return Response.json(
      { ok: true, data, total: data.length, syncedAt: new Date().toISOString() },
      { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=300" } },
    );
  } catch (e) {
    return Response.json({ ok: false, error: e instanceof Error ? e.message : "Error" }, { status: 500 });
  }
}
