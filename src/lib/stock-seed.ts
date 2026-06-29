import type { StockRecord } from "@/db/schema";

// ====================================================================
// Seed dự phòng — danh sách blue-chip để Search KHÔNG BAO GIỜ rỗng
// trong khi Initial Sync đang chạy hoặc khi nguồn dữ liệu tạm lỗi.
// Đây là dữ liệu niêm yết công khai (mã + tên + sàn), KHÔNG phải giá giả.
// ====================================================================
const SEED: { symbol: string; name: string; exchange: string; sector: string }[] = [
  { symbol: "VCB", name: "Ngân hàng TMCP Ngoại thương Việt Nam", exchange: "HOSE", sector: "Ngân hàng" },
  { symbol: "BID", name: "Ngân hàng TMCP Đầu tư và Phát triển Việt Nam", exchange: "HOSE", sector: "Ngân hàng" },
  { symbol: "CTG", name: "Ngân hàng TMCP Công Thương Việt Nam", exchange: "HOSE", sector: "Ngân hàng" },
  { symbol: "TCB", name: "Ngân hàng TMCP Kỹ Thương Việt Nam", exchange: "HOSE", sector: "Ngân hàng" },
  { symbol: "MBB", name: "Ngân hàng TMCP Quân Đội", exchange: "HOSE", sector: "Ngân hàng" },
  { symbol: "VPB", name: "Ngân hàng TMCP Việt Nam Thịnh Vượng", exchange: "HOSE", sector: "Ngân hàng" },
  { symbol: "ACB", name: "Ngân hàng TMCP Á Châu", exchange: "HOSE", sector: "Ngân hàng" },
  { symbol: "STB", name: "Ngân hàng TMCP Sài Gòn Thương Tín", exchange: "HOSE", sector: "Ngân hàng" },
  { symbol: "HDB", name: "Ngân hàng TMCP Phát triển TP.HCM", exchange: "HOSE", sector: "Ngân hàng" },
  { symbol: "SHB", name: "Ngân hàng TMCP Sài Gòn - Hà Nội", exchange: "HOSE", sector: "Ngân hàng" },
  { symbol: "FPT", name: "Công ty Cổ phần FPT", exchange: "HOSE", sector: "Công nghệ" },
  { symbol: "CMG", name: "Công ty Cổ phần Tập đoàn Công nghệ CMC", exchange: "HOSE", sector: "Công nghệ" },
  { symbol: "HPG", name: "Công ty Cổ phần Tập đoàn Hòa Phát", exchange: "HOSE", sector: "Thép" },
  { symbol: "HSG", name: "Công ty Cổ phần Tập đoàn Hoa Sen", exchange: "HOSE", sector: "Thép" },
  { symbol: "NKG", name: "Công ty Cổ phần Thép Nam Kim", exchange: "HOSE", sector: "Thép" },
  { symbol: "VNM", name: "Công ty Cổ phần Sữa Việt Nam", exchange: "HOSE", sector: "Hàng tiêu dùng" },
  { symbol: "MSN", name: "Công ty Cổ phần Tập đoàn Masan", exchange: "HOSE", sector: "Hàng tiêu dùng" },
  { symbol: "SAB", name: "Tổng Công ty Cổ phần Bia - Rượu - NGK Sài Gòn", exchange: "HOSE", sector: "Hàng tiêu dùng" },
  { symbol: "VIC", name: "Tập đoàn Vingroup - Công ty Cổ phần", exchange: "HOSE", sector: "Bất động sản" },
  { symbol: "VHM", name: "Công ty Cổ phần Vinhomes", exchange: "HOSE", sector: "Bất động sản" },
  { symbol: "VRE", name: "Công ty Cổ phần Vincom Retail", exchange: "HOSE", sector: "Bất động sản" },
  { symbol: "NVL", name: "Công ty Cổ phần Tập đoàn Đầu tư Địa ốc No Va", exchange: "HOSE", sector: "Bất động sản" },
  { symbol: "DXG", name: "Công ty Cổ phần Tập đoàn Đất Xanh", exchange: "HOSE", sector: "Bất động sản" },
  { symbol: "KDH", name: "Công ty Cổ phần Đầu tư và Kinh doanh Nhà Khang Điền", exchange: "HOSE", sector: "Bất động sản" },
  { symbol: "GAS", name: "Tổng Công ty Khí Việt Nam - CTCP", exchange: "HOSE", sector: "Dầu khí" },
  { symbol: "PLX", name: "Tập đoàn Xăng Dầu Việt Nam", exchange: "HOSE", sector: "Dầu khí" },
  { symbol: "BSR", name: "Công ty Cổ phần Lọc hóa dầu Bình Sơn", exchange: "UPCOM", sector: "Dầu khí" },
  { symbol: "POW", name: "Tổng Công ty Điện lực Dầu khí Việt Nam - CTCP", exchange: "HOSE", sector: "Điện" },
  { symbol: "GVR", name: "Tập đoàn Công nghiệp Cao su Việt Nam - CTCP", exchange: "HOSE", sector: "Cao su" },
  { symbol: "MWG", name: "Công ty Cổ phần Đầu tư Thế Giới Di Động", exchange: "HOSE", sector: "Bán lẻ" },
  { symbol: "PNJ", name: "Công ty Cổ phần Vàng bạc Đá quý Phú Nhuận", exchange: "HOSE", sector: "Bán lẻ" },
  { symbol: "DGC", name: "Công ty Cổ phần Tập đoàn Hóa chất Đức Giang", exchange: "HOSE", sector: "Hóa chất" },
  { symbol: "DCM", name: "Công ty Cổ phần Phân bón Dầu khí Cà Mau", exchange: "HOSE", sector: "Phân bón" },
  { symbol: "DPM", name: "Tổng Công ty Phân bón và Hóa chất Dầu khí - CTCP", exchange: "HOSE", sector: "Phân bón" },
  { symbol: "SSI", name: "Công ty Cổ phần Chứng khoán SSI", exchange: "HOSE", sector: "Chứng khoán" },
  { symbol: "VND", name: "Công ty Cổ phần Chứng khoán VNDirect", exchange: "HOSE", sector: "Chứng khoán" },
  { symbol: "VCI", name: "Công ty Cổ phần Chứng khoán Vietcap", exchange: "HOSE", sector: "Chứng khoán" },
  { symbol: "HCM", name: "Công ty Cổ phần Chứng khoán TP.HCM", exchange: "HOSE", sector: "Chứng khoán" },
  { symbol: "VJC", name: "Công ty Cổ phần Hàng không Vietjet", exchange: "HOSE", sector: "Hàng không" },
  { symbol: "ACV", name: "Tổng Công ty Cảng Hàng không Việt Nam - CTCP", exchange: "UPCOM", sector: "Hàng không" },
];

let seedCache: StockRecord[] | null = null;

/** Trả seed dưới dạng StockRecord (các trường giá = 0, đánh dấu nguồn Seed). */
export function getSeedStocks(): StockRecord[] {
  if (seedCache) return seedCache;
  const now = new Date();
  seedCache = SEED.map((s, i) => ({
    id: -(i + 1),
    symbol: s.symbol,
    name: s.name,
    exchange: s.exchange,
    status: "active",
    price: 0, open: 0, high: 0, low: 0, prevClose: 0, change: 0, changePct: 0, volume: 0,
    marketCap: 0, pe: 0, pb: 0, eps: 0, roe: 0, roa: 0, beta: 0, dividendYield: 0,
    high52w: 0, low52w: 0, sharesOutstanding: 0, freeFloat: 0,
    rsi: 50, macd: 0, ma20: 0, ma50: 0, ma200: 0,
    sector: s.sector, industry: "", dataSource: "Seed",
    priceUpdatedAt: null, listingUpdatedAt: null, createdAt: now, updatedAt: now,
  })) as StockRecord[];
  return seedCache;
}

/** Lọc seed theo truy vấn (mã / tên / ngành). */
export function searchSeed(q: string, exchange?: string | null, limit = 50): StockRecord[] {
  const norm = (s: string) => s.toLowerCase();
  let rows = getSeedStocks();
  if (exchange) rows = rows.filter((r) => r.exchange === exchange.toUpperCase());
  if (q) {
    const k = norm(q);
    rows = rows.filter((r) => norm(r.symbol).includes(k) || norm(r.name).includes(k) || norm(r.sector ?? "").includes(k));
  }
  return rows.slice(0, limit);
}
