import { runDataEngine } from "@/lib/data-engine";
import { getNewsSyncStatus } from "@/lib/data-engine";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/data-engine/sync
 * Chạy toàn bộ Data Engine (tin tức + vĩ mô + lịch kinh tế).
 * An toàn để gọi từ cron job / webhook / nút "Đồng bộ ngay" trên Admin.
 */
export async function POST() {
  try {
    const result = await runDataEngine();
    return Response.json({ ok: true, result });
  } catch (e) {
    return Response.json({ ok: false, error: e instanceof Error ? e.message : "Error" }, { status: 500 });
  }
}

export async function GET() {
  const status = await getNewsSyncStatus().catch(() => null);
  return Response.json({ ok: true, status });
}
