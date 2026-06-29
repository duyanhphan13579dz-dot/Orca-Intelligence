import { db } from "@/db";
import { stocks } from "@/db/schema";
import { sql } from "drizzle-orm";
import { syncListing } from "./stock-sync";

// ====================================================================
// Stock Bootstrap — tự động nạp danh mục cổ phiếu khi Production trống.
// --------------------------------------------------------------------
// Vấn đề gốc: Production deploy mới => bảng `stocks` rỗng => Search trả
// về rỗng cho tới khi có người bấm "Đồng bộ". Module này đảm bảo dữ liệu
// LUÔN được preload tự động (không phụ thuộc thao tác người dùng), với:
//   - Khóa chống chạy trùng (single-flight) bằng promise dùng chung.
//   - Tự bỏ qua nếu đã có dữ liệu (tránh gọi WiData dư thừa).
//   - Không bao giờ throw ra ngoài (an toàn cho mọi caller).
// ====================================================================

let inflight: Promise<void> | null = null;
let lastEnsured = 0;
const ENSURE_TTL_MS = 60_000; // chỉ kiểm tra lại tối đa mỗi 60s

async function countStocks(): Promise<number> {
  try {
    const r = await db.select({ c: sql<number>`count(*)` }).from(stocks);
    return Number(r[0]?.c ?? 0);
  } catch (e) {
    console.error("[bootstrap] Không đếm được bảng stocks:", e instanceof Error ? e.message : e);
    return -1; // -1 = DB chưa sẵn sàng
  }
}

/**
 * Đảm bảo danh mục cổ phiếu đã được nạp. Gọi an toàn ở nhiều nơi
 * (search API, status API, instrumentation). Trả về số mã hiện có.
 */
export async function ensureStocksLoaded(force = false): Promise<number> {
  const now = Date.now();

  // Luôn đếm thực tế để biết DB có rỗng hay không.
  const current = await countStocks();
  if (current > 0) {
    lastEnsured = now;
    return current;
  }
  if (current < 0) {
    // DB chưa sẵn sàng — không chặn, để caller fallback
    return 0;
  }

  // DB RỖNG: luôn ưu tiên bootstrap (bỏ qua TTL), trừ khi vừa thử xong và
  // đang trong tiến trình inflight (single-flight phía dưới sẽ xử lý).
  void force;

  // current === 0 -> chạy initial sync (single-flight)
  if (!inflight) {
    inflight = (async () => {
      const t0 = Date.now();
      console.info("[bootstrap] Phát hiện DB rỗng — chạy Initial Stock Sync...");
      try {
        const res = await syncListing();
        console.info(`[bootstrap] Initial Stock Sync hoàn tất sau ${Date.now() - t0}ms: ${res.total} mã.`);
      } catch (e) {
        console.error("[bootstrap] Initial Stock Sync lỗi:", e instanceof Error ? e.message : e);
      } finally {
        lastEnsured = Date.now();
        inflight = null;
      }
    })();
  }
  await inflight;
  return countStocks();
}

/** Bộ kích hoạt nền (fire-and-forget) — không await, không throw. */
export function triggerBootstrap(): void {
  ensureStocksLoaded().catch((e) =>
    console.error("[bootstrap] triggerBootstrap lỗi:", e instanceof Error ? e.message : e),
  );
}
