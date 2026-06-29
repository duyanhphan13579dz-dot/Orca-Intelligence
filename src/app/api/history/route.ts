import { getCandlesLive, RESOLUTION_MAP } from "@/lib/vndirect";

export const revalidate = 900; // cache 15 phút

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol") ?? "VNINDEX";
  const tf = searchParams.get("tf") ?? "1 ngày";
  const base = Number(searchParams.get("base") ?? "100");
  const resolution = RESOLUTION_MAP[tf] ?? "D";

  const { candles, live } = await getCandlesLive(symbol, resolution, base);
  return Response.json(
    { ok: true, live, candles },
    {
      headers: {
        "Cache-Control": "public, s-maxage=900, stale-while-revalidate=300",
      },
    },
  );
}
