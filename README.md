<div align="center">

<img src="public/logo.png" alt="Orca Financial" width="120" />

# 🐋 Orca Financial

### Nền tảng phân tích tài chính chuyên sâu

**Dữ liệu thời gian thực · Phân tích kỹ thuật chuyên nghiệp · Trí tuệ nhân tạo**

Hướng đến nhà đầu tư cá nhân, tổ chức và chuyên gia tài chính tại Việt Nam.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38BDF8?logo=tailwindcss)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Drizzle-336791?logo=postgresql)
![License](https://img.shields.io/badge/License-MIT-F5C542)

</div>

---

## 📖 Giới thiệu

**Orca Financial** là một nền tảng phân tích tài chính toàn diện được xây dựng theo
kiến trúc **đa trang (Multi-Page Application)**, lấy cảm hứng từ các nền tảng hàng đầu
thế giới như Bloomberg Terminal, TradingView, Koyfin, Refinitiv Workspace,
Investing.com và Trading Economics — nhưng có bản sắc riêng, hiện đại, tối giản và
cao cấp với tông màu **Navy – Gold** cùng watermark logo cá voi Orca xuyên suốt.

Toàn bộ giao diện bằng **tiếng Việt chuyên nghiệp**, chỉ giữ nguyên các thuật ngữ
quốc tế không nên dịch (VN-Index, NASDAQ, S&P500, RSI, MACD, P/E, EPS, ROE, GDP,
CPI, FED, ECB, AI…).

---

## ✨ Tính năng chính

- 📊 **Tổng quan (Dashboard)** — Hero, widget thị trường, bản đồ nhiệt theo ngành, top biến động, phân tích AI, tin tức.
- 🏦 **Thị trường** — Chỉ số trong nước (VNINDEX, VN30, HNX, UPCOM) & quốc tế (NASDAQ, Dow Jones, S&P500, Nikkei, Hang Seng, Shanghai, BTC, ETH).
- 📈 **Cổ phiếu** — DataGrid đầy đủ (Giá, %, KL, Vốn hóa, P/E, EPS, ROE, Beta, RSI, MACD, MA20/50/200); trang chi tiết: hồ sơ DN, chỉ số tài chính, BCTC, khuyến nghị, so sánh ngành, phân tích AI.
- 🛢️ **Hàng hóa** — Hàng hóa Việt Nam & thế giới (kim loại, năng lượng, nông sản, phân bón, cà phê, cao su, chăn nuôi, thủy sản) với trang chi tiết riêng.
- 💱 **Ngoại hối** — USD/VND, EUR/USD, USD/JPY, GBP/USD, AUD/USD, USD Index.
- ₿ **Tiền mã hóa** — Bitcoin, Ethereum, BNB, SOL, ADA, DOGE, XRP.
- 🏛️ **Kinh tế vĩ mô** — Việt Nam & quốc tế: GDP, CPI, lãi suất, PMI, FDI, FED, ECB, BOJ, PBOC, Nonfarm…
- 📉 **Phân tích kỹ thuật** — Gauge đánh giá xu hướng, bảng chỉ báo (RSI, MACD, EMA, SMA, Bollinger, Fibonacci), hỗ trợ/kháng cự.
- 🎯 **Chiến lược đầu tư** — Theo ngày / tuần / tháng với điểm mua, điểm bán, cắt lỗ, chốt lời, mức độ rủi ro & độ tin cậy.
- 📰 **Tin tức** — Phân loại, bài viết chi tiết, tin liên quan, bình luận, phân tích AI.
- 📄 **Báo cáo** — Theo ngày/tuần/tháng/quý/năm, **xuất PDF** kèm logo + watermark + nhận định AI.
- 🗓️ **Lịch kinh tế** — FED, ECB, BOJ, GDP, CPI, PMI, IPO, cổ tức với mức độ ảnh hưởng.
- ⭐ **Danh mục theo dõi** — Thêm / ghim / đánh dấu / xóa (lưu trong PostgreSQL).
- ⚙️ **Cài đặt** — Giao diện sáng/tối, thông báo, tài khoản, điều khoản & chính sách.

### ⚡ Dữ liệu thời gian thực (Realtime)

- 📡 **Nguồn dữ liệu:** VNDirect dchart API (free tier) cho cổ phiếu & chỉ số thị trường Việt Nam (VNINDEX, VN30, HNX, UPCOM và toàn bộ mã HOSE/HNX/UPCOM).
- ⏱️ **Tự động làm mới mỗi 15 phút** — kết hợp cache phía máy chủ (`revalidate = 900s`) và bộ đếm ngược trên header tự gọi `router.refresh()`.
- 📈 Biểu đồ nến lấy OHLCV thật theo nhiều khung thời gian (1/5/15 phút, 1 giờ, 1 ngày, 1 tuần, 1 tháng) qua route `/api/history`.
- 🧮 Các chỉ báo (RSI, MACD, MA20/50/200) được tính trực tiếp từ giá đóng cửa thật.
- 🛡️ **Fallback an toàn:** nếu nguồn dữ liệu bị chặn hoặc lỗi, hệ thống tự động chuyển sang dữ liệu mô phỏng tất định — ứng dụng không bao giờ vỡ. Huy hiệu "Dữ liệu thời gian thực" / "Mô phỏng" hiển thị rõ trạng thái từng khu vực.

### Trải nghiệm

- 🎨 Glassmorphism, watermark logo (soft-light), animation mượt (Framer Motion + CSS).
- 🔍 Thanh tìm kiếm điều hướng nhanh tới mã cổ phiếu / hàng hóa / chỉ số.
- 📊 Biểu đồ nến tự dựng bằng SVG (Candlestick, Volume, RSI, MACD, EMA/SMA/VWAP, Bollinger) với 8 khung thời gian & chế độ toàn màn hình.
- 📤 Xuất dữ liệu **CSV / Excel / PDF** từ bảng dữ liệu.
- 🌗 Chế độ sáng/tối, responsive (Desktop / Laptop / Tablet / Mobile).
- 🔗 Breadcrumb, URL riêng cho từng trang, tối ưu SEO.

---

## 🧱 Công nghệ

| Lớp | Công nghệ |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 |
| Ngôn ngữ | TypeScript 5 |
| Giao diện | Tailwind CSS 4, Lucide Icons, Framer Motion |
| Cơ sở dữ liệu | PostgreSQL + Drizzle ORM |
| Trực quan hóa | Biểu đồ SVG tự xây (Candlestick, Sparkline, Gauge, Heatmap) |

---

## 📂 Cấu trúc dự án

```
src/
├── app/                      # App Router — các trang độc lập
│   ├── page.tsx              # Tổng quan (Dashboard)
│   ├── thi-truong/           # Thị trường
│   ├── co-phieu/             # Cổ phiếu + [symbol]
│   ├── hang-hoa/             # Hàng hóa + [slug]
│   ├── ngoai-hoi/            # Ngoại hối
│   ├── tien-ma-hoa/          # Tiền mã hóa
│   ├── kinh-te/              # Kinh tế vĩ mô + [slug]
│   ├── phan-tich-ky-thuat/   # Phân tích kỹ thuật + [symbol]
│   ├── chien-luoc/           # Chiến lược đầu tư + [slug]
│   ├── tin-tuc/              # Tin tức + [slug]
│   ├── bao-cao/              # Báo cáo (xuất PDF)
│   ├── lich-kinh-te/         # Lịch kinh tế
│   ├── danh-muc/             # Danh mục theo dõi
│   ├── cai-dat/              # Cài đặt
│   └── api/                  # Route handlers (health, watchlist)
├── components/               # UI components (AppShell, charts, tables…)
├── db/                       # Drizzle: schema.ts, index.ts
└── lib/                      # market-data, types, format, nav
```

---

## 🚀 Bắt đầu

### Yêu cầu

- Node.js 20+
- PostgreSQL 14+

### Cài đặt

```bash
# 1. Cài dependencies
npm install

# 2. Tạo file .env với chuỗi kết nối CSDL
echo 'DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/app_db"' > .env

# 3. Áp dụng schema vào cơ sở dữ liệu
npx drizzle-kit push

# 4. Chạy môi trường phát triển
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) để xem ứng dụng.

### Lệnh hữu ích

| Lệnh | Mô tả |
|---|---|
| `npm run dev` | Chạy server phát triển |
| `npm run build` | Build production |
| `npm run start` | Chạy server production |
| `npm run lint` | Kiểm tra ESLint |
| `npm run typecheck` | Kiểm tra TypeScript |
| `npx drizzle-kit push` | Đồng bộ schema vào CSDL |

---

## 🗄️ Cơ sở dữ liệu

| Bảng | Mô tả |
|---|---|
| `stocks` | **Master Stock Database** — 1.529+ mã HOSE/HNX/UPCOM, giá realtime, chỉ báo kỹ thuật |
| `watchlist` | Danh mục theo dõi của người dùng (ghim, đánh dấu) |
| `saved_articles` | Bài viết đã lưu |
| `dashboard_layout` | Bố cục dashboard cá nhân |

### API endpoints

| Endpoint | Method | Mô tả |
|---|---|---|
| `/api/health` | GET | Healthcheck |
| `/api/stocks/sync` | POST | Đồng bộ danh sách + giá từ WiGroup/VNDirect |
| `/api/stocks/sync` | GET | Trạng thái sync (tổng mã, đã có giá, thời điểm cập nhật) |
| `/api/stocks/search` | GET | Tìm kiếm fuzzy theo mã/tên/ngành/sàn |
| `/api/stocks/price` | GET | Fetch giá realtime cho 1 mã, tự cập nhật DB |
| `/api/history` | GET | Dữ liệu nến OHLCV theo khung thời gian |
| `/api/watchlist` | ALL | CRUD danh mục theo dõi |

---

## ⚠️ Tuyên bố miễn trừ trách nhiệm

Toàn bộ dữ liệu, biểu đồ và nhận định (kể cả phân tích do **AI** tạo ra) trên
Orca Financial chỉ mang tính **tham khảo**, **không phải khuyến nghị đầu tư**.
Người dùng tự chịu trách nhiệm với mọi quyết định tài chính của mình.

---

## 📜 Giấy phép

Dự án được phát hành theo giấy phép [MIT](LICENSE).

<div align="center">

**© 2026 Orca Financial** — Được xây dựng cho nhà đầu tư Việt Nam 🇻🇳

</div>
