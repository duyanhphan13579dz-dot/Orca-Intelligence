import { db } from "@/db";
import { watchlist } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await db.select().from(watchlist).orderBy(desc(watchlist.pinned), desc(watchlist.createdAt));
    return Response.json({ ok: true, data: rows });
  } catch {
    return Response.json({ ok: false, data: [] }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { symbol, name, type, href } = body ?? {};
    if (!symbol || !name || !type || !href) {
      return Response.json({ ok: false, error: "Thiếu dữ liệu" }, { status: 400 });
    }
    const existing = await db.select().from(watchlist).where(eq(watchlist.symbol, symbol));
    if (existing.length > 0) {
      return Response.json({ ok: true, data: existing[0], existed: true });
    }
    const [row] = await db.insert(watchlist).values({ symbol, name, type, href }).returning();
    return Response.json({ ok: true, data: row });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, pinned, marked } = await req.json();
    const patch: Record<string, unknown> = {};
    if (typeof pinned === "boolean") patch.pinned = pinned;
    if (typeof marked === "boolean") patch.marked = marked;
    const [row] = await db.update(watchlist).set(patch).where(eq(watchlist.id, id)).returning();
    return Response.json({ ok: true, data: row });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    await db.delete(watchlist).where(eq(watchlist.id, id));
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
