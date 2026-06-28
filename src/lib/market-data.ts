import type {
  Candle,
  Quote,
  Stock,
  Commodity,
  NewsItem,
  MacroIndicator,
  CalendarEvent,
  Strategy,
} from "./types";

// ---------- Seeded deterministic RNG ----------
function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeSeries(
  seed: string,
  base: number,
  points = 60,
  vol = 0.02,
): number[] {
  const rng = mulberry32(hashString(seed));
  const out: number[] = [];
  let price = base;
  for (let i = 0; i < points; i++) {
    const drift = (rng() - 0.48) * vol;
    price = Math.max(base * 0.4, price * (1 + drift));
    out.push(Number(price.toFixed(price > 100 ? 2 : 4)));
  }
  return out;
}

export function makeCandles(
  seed: string,
  base: number,
  points = 90,
  vol = 0.02,
): Candle[] {
  const rng = mulberry32(hashString(seed + "ohlc"));
  const out: Candle[] = [];
  let price = base;
  const now = Date.now();
  for (let i = points - 1; i >= 0; i--) {
    const o = price;
    const drift = (rng() - 0.48) * vol;
    const c = Math.max(base * 0.4, o * (1 + drift));
    const hi = Math.max(o, c) * (1 + rng() * vol * 0.6);
    const lo = Math.min(o, c) * (1 - rng() * vol * 0.6);
    const v = Math.round((rng() * 0.6 + 0.7) * base * 1000);
    const d = new Date(now - i * 86400000);
    out.push({
      t: d.toISOString().slice(0, 10),
      o: round(o),
      h: round(hi),
      l: round(lo),
      c: round(c),
      v,
    });
    price = c;
  }
  return out;
}

function round(n: number): number {
  return Number(n.toFixed(n > 100 ? 2 : 4));
}

function buildQuote(
  symbol: string,
  name: string,
  base: number,
  vol = 0.02,
  unit?: string,
): Quote {
  const series = makeSeries(symbol, base, 48, vol);
  const price = series[series.length - 1];
  const prevClose = series[series.length - 2];
  const change = price - prevClose;
  const changePct = (change / prevClose) * 100;
  const window = series.slice(-20);
  return {
    symbol,
    name,
    price: round(price),
    prevClose: round(prevClose),
    change: round(change),
    changePct: Number(changePct.toFixed(2)),
    open: round(prevClose),
    high: round(Math.max(...window)),
    low: round(Math.min(...window)),
    volume: Math.round((mulberry32(hashString(symbol))() * 0.5 + 0.5) * base * 10000),
    unit,
    series,
  };
}

// ---------- Indices ----------
const INDEX_DEFS: [string, string, number][] = [
  ["VNINDEX", "VN-Index", 1284.56],
  ["VN30", "VN30", 1342.12],
  ["HNX", "HNX-Index", 238.4],
  ["UPCOM", "UPCOM-Index", 94.7],
  ["NASDAQ", "NASDAQ Composite", 18254.6],
  ["DJI", "Dow Jones", 42863.5],
  ["SPX", "S&P500", 5841.2],
  ["NIKKEI", "Nikkei 225", 39845.1],
  ["HSI", "Hang Seng", 19783.4],
  ["SHANGHAI", "Shanghai Composite", 3284.7],
  ["BTC", "Bitcoin", 96850],
  ["ETH", "Ethereum", 3420],
];

export function getIndices(): Quote[] {
  return INDEX_DEFS.map(([s, n, b]) => buildQuote(s, n, b, 0.012));
}

export function getIndex(symbol: string): Quote | undefined {
  const def = INDEX_DEFS.find((d) => d[0].toLowerCase() === symbol.toLowerCase());
  return def ? buildQuote(def[0], def[1], def[2], 0.012) : undefined;
}

// ---------- Stocks ----------
const STOCK_DEFS: [string, string, string, string, number][] = [
  ["VCB", "Ngân hàng Vietcombank", "HOSE", "Ngân hàng", 92.5],
  ["BID", "Ngân hàng BIDV", "HOSE", "Ngân hàng", 47.8],
  ["CTG", "Ngân hàng VietinBank", "HOSE", "Ngân hàng", 38.2],
  ["TCB", "Ngân hàng Techcombank", "HOSE", "Ngân hàng", 24.6],
  ["MBB", "Ngân hàng MB", "HOSE", "Ngân hàng", 23.1],
  ["VPB", "Ngân hàng VPBank", "HOSE", "Ngân hàng", 19.4],
  ["ACB", "Ngân hàng ACB", "HOSE", "Ngân hàng", 25.3],
  ["FPT", "Tập đoàn FPT", "HOSE", "Công nghệ", 138.5],
  ["CMG", "Công nghệ CMC", "HOSE", "Công nghệ", 52.1],
  ["HPG", "Tập đoàn Hòa Phát", "HOSE", "Thép", 27.9],
  ["HSG", "Tập đoàn Hoa Sen", "HOSE", "Thép", 21.4],
  ["NKG", "Thép Nam Kim", "HOSE", "Thép", 22.8],
  ["VNM", "Vinamilk", "HOSE", "Hàng tiêu dùng", 66.4],
  ["MSN", "Tập đoàn Masan", "HOSE", "Hàng tiêu dùng", 74.2],
  ["SAB", "Bia Sài Gòn", "HOSE", "Hàng tiêu dùng", 53.6],
  ["VIC", "Tập đoàn Vingroup", "HOSE", "Bất động sản", 42.7],
  ["VHM", "Vinhomes", "HOSE", "Bất động sản", 41.3],
  ["NVL", "Novaland", "HOSE", "Bất động sản", 10.8],
  ["DXG", "Đất Xanh Group", "HOSE", "Bất động sản", 15.2],
  ["GAS", "PV GAS", "HOSE", "Dầu khí", 68.9],
  ["PLX", "Petrolimex", "HOSE", "Dầu khí", 39.5],
  ["BSR", "Lọc hóa dầu Bình Sơn", "UPCOM", "Dầu khí", 21.7],
  ["POW", "PV Power", "HOSE", "Điện", 12.6],
  ["GVR", "Cao su Việt Nam", "HOSE", "Cao su", 34.1],
  ["MWG", "Thế Giới Di Động", "HOSE", "Bán lẻ", 62.3],
  ["PNJ", "Vàng bạc PNJ", "HOSE", "Bán lẻ", 96.8],
  ["DGC", "Hóa chất Đức Giang", "HOSE", "Hóa chất", 118.4],
  ["DCM", "Đạm Cà Mau", "HOSE", "Phân bón", 36.2],
  ["DPM", "Đạm Phú Mỹ", "HOSE", "Phân bón", 35.7],
  ["SSI", "Chứng khoán SSI", "HOSE", "Chứng khoán", 28.9],
  ["VND", "Chứng khoán VNDirect", "HOSE", "Chứng khoán", 16.3],
  ["VCI", "Chứng khoán Vietcap", "HOSE", "Chứng khoán", 41.2],
];

export function getStocks(): Stock[] {
  return STOCK_DEFS.map(([s, n, ex, sec, b]) => buildStock(s, n, ex, sec, b));
}

function buildStock(
  symbol: string,
  name: string,
  exchange: string,
  sector: string,
  base: number,
): Stock {
  const q = buildQuote(symbol, name, base, 0.02);
  const rng = mulberry32(hashString(symbol + "fund"));
  const series = q.series;
  const ma = (n: number) =>
    round(series.slice(-n).reduce((a, b) => a + b, 0) / Math.min(n, series.length));
  return {
    ...q,
    exchange,
    sector,
    marketCap: Math.round(base * 1e9 * (rng() * 4 + 1)),
    pe: Number((rng() * 18 + 6).toFixed(1)),
    eps: Number((base * (rng() * 0.12 + 0.05) * 1000).toFixed(0)),
    roe: Number((rng() * 22 + 8).toFixed(1)),
    beta: Number((rng() * 0.9 + 0.6).toFixed(2)),
    rsi: Number((rng() * 50 + 30).toFixed(1)),
    macd: Number(((rng() - 0.5) * 2).toFixed(3)),
    ma20: ma(20),
    ma50: ma(15),
    ma200: round(base * (rng() * 0.2 + 0.85)),
  };
}

export function getStock(symbol: string): Stock | undefined {
  const def = STOCK_DEFS.find((d) => d[0].toLowerCase() === symbol.toLowerCase());
  return def ? buildStock(def[0], def[1], def[2], def[3], def[4]) : undefined;
}

// ---------- Commodities ----------
const COM_DEFS: [string, string, string, "vn" | "world", string, number, string][] = [
  // slug, name, icon, region, category, base, unit
  ["vang-sjc-mua", "Vàng SJC (Mua vào)", "🥇", "vn", "Kim loại", 84500, "Nghìn đồng/lượng"],
  ["vang-sjc-ban", "Vàng SJC (Bán ra)", "🥇", "vn", "Kim loại", 86700, "Nghìn đồng/lượng"],
  ["thep-d10", "Thép D10", "🏗️", "vn", "Kim loại", 14.2, "Nghìn đồng/kg"],
  ["xang-ron95", "Xăng RON95", "⛽", "vn", "Năng lượng", 20.4, "Nghìn đồng/lít"],
  ["xang-ron92", "Xăng RON92", "⛽", "vn", "Năng lượng", 19.6, "Nghìn đồng/lít"],
  ["dau-do", "Dầu DO", "🛢️", "vn", "Năng lượng", 18.1, "Nghìn đồng/lít"],
  ["heo-hoi-mien-bac", "Heo hơi miền Bắc", "🐖", "vn", "Chăn nuôi", 64000, "VNĐ/kg"],
  ["tom-the", "Tôm thẻ (tại ao)", "🦐", "vn", "Thủy sản", 118000, "VNĐ/kg"],
  ["ca-tra", "Cá tra (tại ao)", "🐟", "vn", "Thủy sản", 28500, "VNĐ/kg"],
  // World
  ["dau-tho-wti", "Dầu thô WTI", "🛢️", "world", "Năng lượng", 71.85, "USD/thùng"],
  ["khi-thien-nhien", "Khí thiên nhiên", "🔥", "world", "Năng lượng", 3.42, "USD/MMBtu"],
  ["than-coc", "Than cốc", "⚫", "world", "Năng lượng", 245.0, "USD/tấn"],
  ["vang", "Vàng", "🥇", "world", "Kim loại", 2658.4, "USD/oz"],
  ["bac", "Bạc", "🥈", "world", "Kim loại", 31.2, "USD/oz"],
  ["dong", "Đồng", "🟤", "world", "Kim loại", 4.18, "USD/lb"],
  ["nickel", "Nickel", "⚙️", "world", "Kim loại", 16850, "USD/tấn"],
  ["quang-sat", "Quặng sắt", "🪨", "world", "Kim loại", 104.5, "USD/tấn"],
  ["thep-hrc", "Thép HRC", "🏗️", "world", "Kim loại", 542.0, "USD/tấn"],
  ["ngo", "Ngô", "🌽", "world", "Nông sản", 458.2, "cent/giạ"],
  ["dau-nanh", "Đậu nành", "🫘", "world", "Nông sản", 1024.6, "cent/giạ"],
  ["gao", "Gạo", "🌾", "world", "Nông sản", 16.8, "USD/cwt"],
  ["phan-ure", "Phân Ure", "🧪", "world", "Phân bón", 358.0, "USD/tấn"],
  ["ca-phe-arabica", "Cà phê Arabica", "☕", "world", "Cà phê", 318.5, "cent/lb"],
  ["ca-phe-robusta", "Cà phê Robusta", "☕", "world", "Cà phê", 4720, "USD/tấn"],
  ["bong", "Bông", "🧵", "world", "Sợi", 71.4, "cent/lb"],
  ["duong", "Đường", "🍬", "world", "Nông sản", 21.8, "cent/lb"],
  ["sua-nguyen-kem", "Sữa bột nguyên kem nguyên liệu", "🥛", "world", "Sữa", 3850, "USD/tấn"],
  ["sua-tach-beo", "Sữa bột tách béo nguyên liệu", "🥛", "world", "Sữa", 2780, "USD/tấn"],
  ["cao-su-tsr20", "Cao su TSR20 Tokyo", "🛞", "world", "Cao su", 198.5, "JPY/kg"],
  ["cao-su-rss3", "Cao su RSS3 Tokyo", "🛞", "world", "Cao su", 342.0, "JPY/kg"],
  ["heo-hoi-trung-quoc", "Heo hơi Trung Quốc", "🐖", "world", "Chăn nuôi", 16.4, "CNY/kg"],
];

function buildCommodity(def: (typeof COM_DEFS)[number]): Commodity {
  const [slug, name, icon, region, category, base, unit] = def;
  const q = buildQuote(slug.toUpperCase(), name, base, 0.018, unit);
  return {
    ...q,
    slug,
    region,
    category,
    icon,
    updatedAt: new Date().toISOString(),
  };
}

export function getCommodities(): Commodity[] {
  return COM_DEFS.map(buildCommodity);
}

export function getCommodity(slug: string): Commodity | undefined {
  const def = COM_DEFS.find((d) => d[0] === slug);
  return def ? buildCommodity(def) : undefined;
}

// ---------- Forex ----------
const FX_DEFS: [string, string, number][] = [
  ["USD/VND", "Đô la Mỹ / Việt Nam Đồng", 25380],
  ["EUR/USD", "Euro / Đô la Mỹ", 1.0845],
  ["USD/JPY", "Đô la Mỹ / Yên Nhật", 153.42],
  ["GBP/USD", "Bảng Anh / Đô la Mỹ", 1.2684],
  ["AUD/USD", "Đô la Úc / Đô la Mỹ", 0.6512],
  ["DXY", "USD Index", 106.42],
];

export function getForex(): Quote[] {
  return FX_DEFS.map(([s, n, b]) => buildQuote(s, n, b, 0.006));
}
export function getForexOne(symbol: string): Quote | undefined {
  const def = FX_DEFS.find((d) => d[0].toLowerCase() === symbol.toLowerCase());
  return def ? buildQuote(def[0], def[1], def[2], 0.006) : undefined;
}

// ---------- Crypto ----------
const CRYPTO_DEFS: [string, string, number][] = [
  ["BTC", "Bitcoin", 96850],
  ["ETH", "Ethereum", 3420],
  ["BNB", "BNB", 695],
  ["SOL", "Solana", 214],
  ["ADA", "Cardano", 1.05],
  ["DOGE", "Dogecoin", 0.392],
  ["XRP", "XRP", 2.34],
];

export function getCrypto(): Quote[] {
  return CRYPTO_DEFS.map(([s, n, b]) => buildQuote(s, n, b, 0.03));
}
export function getCryptoOne(symbol: string): Quote | undefined {
  const def = CRYPTO_DEFS.find((d) => d[0].toLowerCase() === symbol.toLowerCase());
  return def ? buildQuote(def[0], def[1], def[2], 0.03) : undefined;
}

// ---------- Macro ----------
const MACRO_DEFS: Omit<MacroIndicator, "series">[] = [
  { slug: "gdp-vn", name: "GDP", region: "vn", value: "7,09", change: 0.42, prev: "6,67", forecast: "6,80", unit: "%", description: "Tăng trưởng tổng sản phẩm quốc nội của Việt Nam theo năm." },
  { slug: "cpi-vn", name: "CPI", region: "vn", value: "2,94", change: -0.12, prev: "3,06", forecast: "3,10", unit: "%", description: "Chỉ số giá tiêu dùng phản ánh mức lạm phát của Việt Nam." },
  { slug: "lai-suat-vn", name: "Lãi suất điều hành", region: "vn", value: "4,50", change: 0, prev: "4,50", forecast: "4,50", unit: "%", description: "Lãi suất tái cấp vốn của Ngân hàng Nhà nước Việt Nam." },
  { slug: "pmi-vn", name: "PMI", region: "vn", value: "50,8", change: 0.6, prev: "50,2", forecast: "51,0", unit: "điểm", description: "Chỉ số nhà quản trị mua hàng ngành sản xuất Việt Nam." },
  { slug: "fdi-vn", name: "FDI", region: "vn", value: "25,35", change: 1.2, prev: "24,15", forecast: "26,00", unit: "tỷ USD", description: "Vốn đầu tư trực tiếp nước ngoài giải ngân lũy kế." },
  { slug: "ty-gia-vn", name: "Tỷ giá trung tâm", region: "vn", value: "24.250", change: 0.08, prev: "24.230", forecast: "24.300", unit: "VND/USD", description: "Tỷ giá trung tâm do Ngân hàng Nhà nước công bố." },
  { slug: "xnk-vn", name: "Xuất nhập khẩu", region: "vn", value: "786,3", change: 15.4, prev: "681,0", forecast: "800,0", unit: "tỷ USD", description: "Tổng kim ngạch xuất nhập khẩu hàng hóa của Việt Nam." },
  { slug: "fed-rate", name: "Lãi suất FED", region: "world", value: "4,75", change: -0.25, prev: "5,00", forecast: "4,50", unit: "%", description: "Lãi suất quỹ liên bang của Cục Dự trữ Liên bang Mỹ (FED)." },
  { slug: "ecb-rate", name: "Lãi suất ECB", region: "world", value: "3,40", change: -0.25, prev: "3,65", forecast: "3,15", unit: "%", description: "Lãi suất tái cấp vốn của Ngân hàng Trung ương châu Âu (ECB)." },
  { slug: "boj-rate", name: "Lãi suất BOJ", region: "world", value: "0,25", change: 0, prev: "0,25", forecast: "0,50", unit: "%", description: "Lãi suất chính sách của Ngân hàng Trung ương Nhật Bản (BOJ)." },
  { slug: "pboc-rate", name: "Lãi suất PBOC", region: "world", value: "3,10", change: -0.25, prev: "3,35", forecast: "3,00", unit: "%", description: "Lãi suất cho vay cơ bản của Ngân hàng Nhân dân Trung Quốc (PBOC)." },
  { slug: "gdp-us", name: "GDP Mỹ", region: "world", value: "2,8", change: -0.2, prev: "3,0", forecast: "2,5", unit: "%", description: "Tăng trưởng GDP hàng quý của Hoa Kỳ (đã quy năm)." },
  { slug: "cpi-us", name: "CPI Mỹ", region: "world", value: "2,6", change: 0.1, prev: "2,5", forecast: "2,7", unit: "%", description: "Chỉ số giá tiêu dùng của Hoa Kỳ theo năm." },
  { slug: "nonfarm", name: "Nonfarm Payroll", region: "world", value: "227", change: 191, prev: "36", forecast: "200", unit: "nghìn", description: "Số việc làm phi nông nghiệp mới tạo ra tại Hoa Kỳ." },
];

export function getMacro(): MacroIndicator[] {
  return MACRO_DEFS.map((m) => ({
    ...m,
    series: makeSeries("macro-" + m.slug, 100, 24, 0.04),
  }));
}
export function getMacroOne(slug: string): MacroIndicator | undefined {
  const m = MACRO_DEFS.find((d) => d.slug === slug);
  return m ? { ...m, series: makeSeries("macro-" + m.slug, 100, 24, 0.04) } : undefined;
}

// ---------- News ----------
const NEWS_DEFS: Omit<NewsItem, "content" | "image">[] = [
  { slug: "vn-index-vuot-1280", title: "VN-Index bứt phá vượt mốc 1.280 điểm nhờ dòng tiền ngân hàng", summary: "Thị trường chứng khoán Việt Nam tăng mạnh phiên cuối tuần với thanh khoản cải thiện rõ rệt, nhóm ngân hàng dẫn dắt đà tăng.", source: "CafeF", category: "Trong nước", tags: ["VN-Index", "Ngân hàng"], impact: "cao", time: "08:45 hôm nay" },
  { slug: "fed-ha-lai-suat", title: "FED phát tín hiệu hạ lãi suất, chứng khoán toàn cầu phản ứng tích cực", summary: "Cục Dự trữ Liên bang Mỹ để ngỏ khả năng tiếp tục nới lỏng chính sách tiền tệ trong các kỳ họp tới.", source: "Reuters", category: "Quốc tế", tags: ["FED", "Lãi suất"], impact: "cao", time: "07:20 hôm nay" },
  { slug: "gia-vang-lap-dinh", title: "Giá vàng thế giới lập đỉnh mới, vàng SJC tiến sát 87 triệu đồng/lượng", summary: "Đà tăng của vàng được hỗ trợ bởi nhu cầu trú ẩn an toàn và kỳ vọng FED nới lỏng tiền tệ.", source: "Vietstock", category: "Tin hàng hóa", tags: ["Vàng", "Kim loại quý"], impact: "trung bình", time: "09:10 hôm nay" },
  { slug: "fpt-loi-nhuan-ky-luc", title: "FPT báo lãi kỷ lục, mảng công nghệ nước ngoài tăng trưởng 30%", summary: "Tập đoàn FPT tiếp tục duy trì đà tăng trưởng hai chữ số nhờ chuyển đổi số và trí tuệ nhân tạo.", source: "SSI", category: "Doanh nghiệp", tags: ["FPT", "Công nghệ"], impact: "trung bình", time: "10:05 hôm nay" },
  { slug: "ngan-hang-tang-tin-dung", title: "Tăng trưởng tín dụng toàn ngành ngân hàng đạt 12% so với đầu năm", summary: "Ngân hàng Nhà nước cho biết tín dụng tập trung vào sản xuất kinh doanh và các lĩnh vực ưu tiên.", source: "VCBS", category: "Tin ngân hàng", tags: ["Tín dụng", "Ngân hàng"], impact: "trung bình", time: "11:30 hôm nay" },
  { slug: "bat-dong-san-phuc-hoi", title: "Thị trường bất động sản phía Nam có dấu hiệu phục hồi thanh khoản", summary: "Giao dịch căn hộ và đất nền tại TP.HCM và vùng phụ cận cải thiện trong quý gần nhất.", source: "CafeF", category: "Tin bất động sản", tags: ["Bất động sản"], impact: "thấp", time: "12:00 hôm nay" },
  { slug: "bitcoin-vuot-96000", title: "Bitcoin vượt 96.000 USD, dòng tiền tổ chức tiếp tục đổ vào ETF", summary: "Tâm lý lạc quan trên thị trường tiền mã hóa được củng cố bởi dòng vốn từ các quỹ ETF giao ngay.", source: "Bloomberg", category: "Tin tiền mã hóa", tags: ["Bitcoin", "Crypto"], impact: "cao", time: "06:50 hôm nay" },
  { slug: "gia-dau-giam", title: "Giá dầu WTI giảm do lo ngại nhu cầu từ Trung Quốc suy yếu", summary: "Triển vọng nhu cầu nhiên liệu kém khả quan gây áp lực lên giá dầu thô thế giới.", source: "TradingEconomics", category: "Tin hàng hóa", tags: ["Dầu thô", "Năng lượng"], impact: "trung bình", time: "13:15 hôm nay" },
  { slug: "thep-hoa-phat-tang", title: "Hòa Phát tăng sản lượng thép, hưởng lợi từ đầu tư công", summary: "Nhu cầu thép xây dựng phục hồi nhờ giải ngân đầu tư công được đẩy mạnh cuối năm.", source: "Vietstock", category: "Tin hàng hóa", tags: ["Thép", "HPG"], impact: "trung bình", time: "14:00 hôm nay" },
  { slug: "ai-nganh-tai-chinh", title: "AI định hình lại ngành phân tích tài chính tại Việt Nam", summary: "Các nền tảng ứng dụng trí tuệ nhân tạo giúp nhà đầu tư cá nhân tiếp cận dữ liệu chuyên sâu.", source: "CafeF", category: "AI", tags: ["AI", "Fintech"], impact: "thấp", time: "15:20 hôm nay" },
];

function newsImage(slug: string): string {
  return `https://picsum.photos/seed/${slug}/800/450`;
}

export function getNews(): NewsItem[] {
  return NEWS_DEFS.map((n) => ({
    ...n,
    image: newsImage(n.slug),
    content: [
      `${n.summary} Đây là diễn biến đáng chú ý được giới phân tích theo dõi sát sao trong bối cảnh thị trường có nhiều biến động.`,
      "Theo nhận định của các chuyên gia, xu hướng này có thể tiếp tục trong ngắn hạn nếu các yếu tố vĩ mô tiếp tục ủng hộ. Nhà đầu tư được khuyến nghị theo dõi sát diễn biến dòng tiền và các tín hiệu kỹ thuật quan trọng.",
      "Orca Financial sẽ tiếp tục cập nhật những thông tin mới nhất cùng các phân tích chuyên sâu để hỗ trợ nhà đầu tư ra quyết định kịp thời và chính xác.",
    ],
  }));
}

export function getNewsItem(slug: string): NewsItem | undefined {
  return getNews().find((n) => n.slug === slug);
}

// ---------- Economic Calendar ----------
export function getCalendar(): CalendarEvent[] {
  const base: Omit<CalendarEvent, "id" | "date">[] = [
    { time: "08:30", country: "Mỹ", flag: "🇺🇸", event: "FED công bố lãi suất", impact: "cao", actual: "4,75%", forecast: "4,75%", previous: "5,00%" },
    { time: "09:00", country: "Việt Nam", flag: "🇻🇳", event: "CPI tháng", impact: "cao", actual: "2,94%", forecast: "3,10%", previous: "3,06%" },
    { time: "14:15", country: "Châu Âu", flag: "🇪🇺", event: "ECB họp chính sách tiền tệ", impact: "cao", actual: "3,40%", forecast: "3,40%", previous: "3,65%" },
    { time: "07:50", country: "Nhật Bản", flag: "🇯🇵", event: "BOJ công bố biên bản họp", impact: "trung bình", actual: "0,25%", forecast: "0,25%", previous: "0,25%" },
    { time: "20:30", country: "Mỹ", flag: "🇺🇸", event: "Bảng lương phi nông nghiệp (Nonfarm)", impact: "cao", actual: "227K", forecast: "200K", previous: "36K" },
    { time: "10:00", country: "Trung Quốc", flag: "🇨🇳", event: "PMI sản xuất", impact: "trung bình", actual: "50,1", forecast: "50,3", previous: "50,3" },
    { time: "15:00", country: "Việt Nam", flag: "🇻🇳", event: "IPO Công ty Cổ phần ABC", impact: "thấp", actual: "—", forecast: "—", previous: "—" },
    { time: "16:30", country: "Việt Nam", flag: "🇻🇳", event: "Ngày giao dịch không hưởng quyền cổ tức VNM", impact: "thấp", actual: "—", forecast: "—", previous: "—" },
    { time: "19:30", country: "Mỹ", flag: "🇺🇸", event: "CPI lõi", impact: "cao", actual: "3,3%", forecast: "3,3%", previous: "3,3%" },
    { time: "08:00", country: "Đức", flag: "🇩🇪", event: "GDP quý", impact: "trung bình", actual: "0,2%", forecast: "0,1%", previous: "-0,1%" },
  ];
  const today = new Date();
  return base.map((b, i) => ({
    ...b,
    id: `evt-${i}`,
    date: new Date(today.getTime() + (i % 3) * 86400000).toISOString().slice(0, 10),
  }));
}

// ---------- Strategies ----------
export function getStrategies(): Strategy[] {
  return [
    { slug: "chien-luoc-ngay", period: "ngày", title: "Chiến lược giao dịch trong ngày", trend: "Xu hướng tăng ngắn hạn", entry: "1.272 – 1.278 điểm", exit: "1.295 điểm", stopLoss: "1.260 điểm", takeProfit: "1.300 điểm", risk: "Trung bình", confidence: 74, summary: "Dòng tiền tập trung nhóm ngân hàng và chứng khoán, ưu tiên giải ngân khi VN-Index test vùng hỗ trợ." },
    { slug: "chien-luoc-tuan", period: "tuần", title: "Chiến lược đầu tư theo tuần", trend: "Tích lũy hướng lên", entry: "Vùng 1.250 – 1.270", exit: "1.320 điểm", stopLoss: "1.235 điểm", takeProfit: "1.330 điểm", risk: "Trung bình thấp", confidence: 68, summary: "Triển vọng thị trường tích cực, dòng tiền luân chuyển sang nhóm thép, dầu khí và bán lẻ." },
    { slug: "chien-luoc-thang", period: "tháng", title: "Chiến lược đầu tư theo tháng", trend: "Uptrend trung hạn", entry: "Tích lũy quanh 1.240", exit: "1.380 điểm", stopLoss: "1.200 điểm", takeProfit: "1.400 điểm", risk: "Thấp", confidence: 71, summary: "Định giá thị trường hấp dẫn với P/E thấp hơn trung bình lịch sử, phù hợp tích lũy cổ phiếu cơ bản tốt." },
  ];
}
export function getStrategy(slug: string): Strategy | undefined {
  return getStrategies().find((s) => s.slug === slug);
}

// ---------- Technical analysis ----------
export interface TechSignal {
  symbol: string;
  name: string;
  base: number;
  rating: "Mua mạnh" | "Mua" | "Trung lập" | "Bán" | "Bán mạnh";
  score: number; // -100..100
  rsi: number;
  macd: string;
  support: number;
  resistance: number;
}

export function getTechSignals(): TechSignal[] {
  const defs: [string, string, number][] = [
    ["VNINDEX", "VN-Index", 1284.56],
    ["VN30", "VN30", 1342.12],
    ["NASDAQ", "NASDAQ", 18254.6],
    ["SPX", "S&P500", 5841.2],
    ["BTC", "Bitcoin", 96850],
    ["XAU", "Vàng", 2658.4],
    ["WTI", "Dầu thô WTI", 71.85],
  ];
  return defs.map(([s, n, b]) => {
    const rng = mulberry32(hashString(s + "tech"));
    const score = Math.round((rng() - 0.4) * 160);
    const rating: TechSignal["rating"] =
      score > 50 ? "Mua mạnh" : score > 15 ? "Mua" : score > -15 ? "Trung lập" : score > -50 ? "Bán" : "Bán mạnh";
    return {
      symbol: s,
      name: n,
      base: b,
      rating,
      score,
      rsi: Number((rng() * 50 + 30).toFixed(1)),
      macd: rng() > 0.5 ? "Tín hiệu mua" : "Tín hiệu bán",
      support: round(b * 0.97),
      resistance: round(b * 1.03),
    };
  });
}
export function getTechSignal(symbol: string): TechSignal | undefined {
  return getTechSignals().find((t) => t.symbol.toLowerCase() === symbol.toLowerCase());
}

// ---------- Top movers ----------
export function getTopMovers() {
  const stocks = getStocks();
  const byPct = [...stocks].sort((a, b) => b.changePct - a.changePct);
  const byVol = [...stocks].sort((a, b) => b.volume - a.volume);
  return {
    gainers: byPct.slice(0, 5),
    losers: byPct.slice(-5).reverse(),
    liquidity: byVol.slice(0, 5),
    foreignBuy: [...stocks].sort((a, b) => b.marketCap - a.marketCap).slice(0, 5),
    foreignSell: [...stocks].sort((a, b) => a.marketCap - b.marketCap).slice(0, 5),
  };
}

// ---------- AI insights ----------
export function getAiInsights() {
  return {
    summary:
      "Thị trường chứng khoán Việt Nam duy trì sắc xanh với động lực chính từ nhóm ngân hàng và chứng khoán. Thanh khoản cải thiện cho thấy dòng tiền đang trở lại thị trường.",
    trend:
      "Xu hướng ngắn hạn nghiêng về tích cực khi VN-Index giữ vững trên đường MA20. Tuy nhiên cần thận trọng tại vùng kháng cự 1.300 điểm.",
    risk:
      "Rủi ro đến từ biến động tỷ giá USD/VND và áp lực bán ròng của khối ngoại. Nhà đầu tư nên quản trị tỷ trọng danh mục hợp lý.",
    opportunity:
      "Cơ hội tích lũy xuất hiện ở nhóm cổ phiếu cơ bản tốt thuộc ngành thép, dầu khí và bán lẻ khi định giá còn hấp dẫn.",
    sentiment: 64, // 0-100 fear-greed
  };
}
