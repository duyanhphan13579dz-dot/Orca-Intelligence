import { getMacroData } from "@/lib/data-engine";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const region = searchParams.get("region"); // vn | world
  try {
    const all = await getMacroData();
    const data = region ? all.filter((m) => m.region === region) : all;
    return Response.json(
      { ok: true, data, total: data.length, syncedAt: new Date().toISOString() },
      { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=300" } },
    );
  } catch (e) {
    return Response.json({ ok: false, error: e instanceof Error ? e.message : "Error" }, { status: 500 });
  }
}
