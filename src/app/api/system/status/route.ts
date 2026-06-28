import { getProvidersStatus } from "@/lib/providers";
import { getSyncStatus } from "@/lib/stock-sync";

export const dynamic = "force-dynamic";

/**
 * GET /api/system/status
 * Trạng thái Realtime Data Engine: nguồn dữ liệu + sync DB.
 */
export async function GET() {
  try {
    const [providers, sync] = await Promise.all([
      getProvidersStatus(),
      getSyncStatus().catch(() => null),
    ]);
    return Response.json({
      ok: true,
      providers,
      sync,
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
