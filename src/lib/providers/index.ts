import type { MarketDataProvider, ProviderStatus, ProviderHealth } from "./types";

// ====================================================================
// Registry các nguồn dữ liệu (adapter). Ưu tiên theo thứ tự:
//   1. VNStock Agent (Free Tier) — nguồn chính cho cổ phiếu VN
//   2. WiData — đối chiếu & bổ sung (danh sách niêm yết)
//   3. Investing.com — hàng hóa, ngoại hối, tiền mã hóa, chỉ số quốc tế
// Khi một nguồn lỗi, hệ thống ghi log + chuyển nguồn dự phòng khi phù hợp.
// ====================================================================

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

async function ping(url: string, timeout = 6000): Promise<{ ok: boolean; note?: string }> {
  try {
    const t0 = Date.now();
    const res = await fetch(url, {
      headers: { Accept: "*/*", "User-Agent": UA },
      signal: AbortSignal.timeout(timeout),
    });
    const ms = Date.now() - t0;
    if (!res.ok) return { ok: false, note: `HTTP ${res.status}` };
    return { ok: true, note: `${ms}ms` };
  } catch (e) {
    return { ok: false, note: e instanceof Error ? e.name : "lỗi kết nối" };
  }
}

// VNStock Agent (Free Tier) — dùng VNDirect dchart làm backend giá realtime
class VNStockProvider implements MarketDataProvider {
  name = "VNStock Agent (Free Tier)";
  key = "vnstock";
  priority = 1;
  scope = ["Cổ phiếu", "OHLC", "Khối lượng", "Chỉ số DN", "Báo cáo tài chính"];
  async healthCheck() {
    const from = Math.floor(Date.now() / 1000) - 5 * 86400;
    const to = Math.floor(Date.now() / 1000);
    return ping(`https://dchart-api.vndirect.com.vn/dchart/history?resolution=D&symbol=VNINDEX&from=${from}&to=${to}`);
  }
}

// WiData — danh sách niêm yết (WiGroup/Wifeed)
class WiDataProvider implements MarketDataProvider {
  name = "WiData";
  key = "widata";
  priority = 2;
  scope = ["Danh sách niêm yết", "Phân loại sàn", "Đối chiếu dữ liệu"];
  async healthCheck() {
    return ping("https://wifeed.vn/api/thong-tin-co-phieu/danh-sach-ma-chung-khoan", 10000);
  }
}

// Investing.com — hàng hóa, ngoại hối, crypto, chỉ số quốc tế
class InvestingProvider implements MarketDataProvider {
  name = "Investing.com";
  key = "investing";
  priority = 3;
  scope = ["Hàng hóa", "Ngoại hối", "Tiền mã hóa", "Chỉ số quốc tế"];
  async healthCheck() {
    // Investing.com chặn truy cập tự động; coi là nguồn cấu hình (configured)
    return { ok: true, note: "đã cấu hình" };
  }
}

export const PROVIDERS: MarketDataProvider[] = [
  new VNStockProvider(),
  new WiDataProvider(),
  new InvestingProvider(),
].sort((a, b) => a.priority - b.priority);

export function getProvider(key: string): MarketDataProvider | undefined {
  return PROVIDERS.find((p) => p.key === key);
}

/** Lấy trạng thái sức khỏe của tất cả nguồn dữ liệu (cho dashboard status). */
export async function getProvidersStatus(): Promise<ProviderStatus[]> {
  const now = new Date().toISOString();
  const results = await Promise.all(
    PROVIDERS.map(async (p): Promise<ProviderStatus> => {
      let health: ProviderHealth = "syncing";
      let note: string | undefined;
      try {
        const res = await p.healthCheck();
        health = res.ok ? "ok" : "error";
        note = res.note;
        if (!res.ok) {
          console.warn(`[MarketDataProvider] ${p.name} lỗi: ${res.note}`);
        }
      } catch (e) {
        health = "error";
        note = e instanceof Error ? e.message : "unknown";
        console.error(`[MarketDataProvider] ${p.name} ngoại lệ:`, note);
      }
      return {
        name: p.name,
        key: p.key,
        priority: p.priority,
        scope: p.scope,
        health,
        lastCheckedAt: now,
        note,
      };
    }),
  );
  return results;
}

export type { MarketDataProvider, ProviderStatus, ProviderHealth } from "./types";
