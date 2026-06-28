// ====================================================================
// Next.js Instrumentation — chạy MỘT LẦN khi server khởi động.
// Kích hoạt:
//   1. Bootstrap danh mục cổ phiếu (nếu DB rỗng)
//   2. Data Engine: đồng bộ tin tức, vĩ mô, lịch kinh tế
// An toàn: fire-and-forget, không throw, không chặn boot.
// ====================================================================

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (!process.env.DATABASE_URL) {
    console.warn("[instrumentation] Bỏ qua: chưa có DATABASE_URL");
    return;
  }
  // Kích hoạt song song, không chặn server start
  setTimeout(async () => {
    try {
      const { triggerBootstrap } = await import("@/lib/stock-bootstrap");
      triggerBootstrap();
      console.info("[instrumentation] ✓ Stock bootstrap kích hoạt");
    } catch (e) {
      console.error("[instrumentation] Stock bootstrap lỗi:", e instanceof Error ? e.message : e);
    }
    try {
      const { triggerDataEngine } = await import("@/lib/data-engine");
      triggerDataEngine();
      console.info("[instrumentation] ✓ Data Engine kích hoạt (news + macro + calendar)");
    } catch (e) {
      console.error("[instrumentation] Data Engine lỗi:", e instanceof Error ? e.message : e);
    }
  }, 2000); // Chờ 2s sau khi server boot xong mới kích hoạt
}
