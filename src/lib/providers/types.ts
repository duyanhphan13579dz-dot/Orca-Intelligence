// ====================================================================
// MarketDataProvider — tầng trừu tượng (abstraction layer) cho nguồn dữ liệu
// Cho phép bổ sung / thay thế nguồn (VNStock, WiData, Investing.com...)
// mà không phải sửa toàn bộ ứng dụng. Mỗi nguồn là một adapter.
// ====================================================================

export type ProviderHealth = "ok" | "syncing" | "error";

export interface ProviderStatus {
  /** Tên hiển thị, ví dụ "VNStock Agent (Free Tier)" */
  name: string;
  /** Khóa định danh, ví dụ "vnstock" */
  key: string;
  /** Độ ưu tiên (số nhỏ = ưu tiên cao) */
  priority: number;
  /** Phạm vi dữ liệu nguồn cung cấp */
  scope: string[];
  /** Trạng thái sức khỏe hiện tại */
  health: ProviderHealth;
  /** Thời điểm kiểm tra/đồng bộ gần nhất (ISO) */
  lastCheckedAt: string | null;
  /** Ghi chú (lỗi, độ trễ...) */
  note?: string;
}

export interface MarketDataProvider {
  name: string;
  key: string;
  priority: number;
  scope: string[];
  /** Kiểm tra nguồn có phản hồi không */
  healthCheck(): Promise<{ ok: boolean; note?: string }>;
}
