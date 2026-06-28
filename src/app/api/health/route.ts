import { getDb } from "@/db";
import { sql } from "drizzle-orm";

// Luôn chạy ở runtime, không prerender / không thu thập dữ liệu lúc build.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const VERSION = "1.0.0";

export async function GET() {
  const timestamp = new Date().toISOString();
  // Payload nền cực nhẹ — server đang chạy là đủ điều kiện sống.
  const base = { ok: true, service: "Orca Financial", version: VERSION, timestamp };

  // Chưa cấu hình DATABASE_URL: KHÔNG throw, KHÔNG crash, trả trạng thái degraded.
  if (!process.env.DATABASE_URL) {
    console.warn("[/api/health] DATABASE_URL chưa cấu hình — database unavailable");
    return Response.json({ ...base, status: "degraded", database: "unavailable" });
  }

  // Kiểm tra kết nối DB BÊN TRONG handler (runtime), không ở top-level.
  try {
    const db = getDb();
    await db.execute(sql`select 1`);
    return Response.json({ ...base, status: "ok", database: "connected" });
  } catch (e) {
    console.error("[/api/health] Lỗi kết nối database:", e instanceof Error ? e.message : e);
    return Response.json({ ...base, status: "degraded", database: "unavailable" });
  }
}
