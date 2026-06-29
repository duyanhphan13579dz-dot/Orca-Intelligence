import { runDataEngine, getEngineStatus, getLastEngineResult } from "@/lib/data-engine";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST() {
  try {
    const result = await runDataEngine();
    return Response.json({ ok: true, result });
  } catch (e) {
    return Response.json({ ok: false, error: e instanceof Error ? e.message : "Error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const status = await getEngineStatus();
    return Response.json({ ok: true, ...status, lastResult: getLastEngineResult() });
  } catch {
    return Response.json({ ok: false, lastResult: null });
  }
}
