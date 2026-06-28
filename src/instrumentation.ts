// ====================================================================
// Next.js instrumentation — chạy MỘT LẦN khi server khởi động.
// Tự động nạp danh mục cổ phiếu cho Production mới (fire-and-forget).
// An toàn tuyệt đối: chỉ chạy ở Node runtime, không throw, không chặn boot,
// không chạy trong lúc build (chỉ khi server thực sự start & có DATABASE_URL).
// ====================================================================
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (!process.env.DATABASE_URL) {
    console.warn("[instrumentation] Bỏ qua bootstrap: chưa có DATABASE_URL");
    return;
  }
  try {
    const { triggerBootstrap } = await import("@/lib/stock-bootstrap");
    // Không await — để không làm chậm quá trình khởi động server.
    triggerBootstrap();
    console.info("[instrumentation] Đã kích hoạt auto bootstrap danh mục cổ phiếu.");
  } catch (e) {
    console.error("[instrumentation] Lỗi khi kích hoạt bootstrap:", e instanceof Error ? e.message : e);
  }
}
