import {
  pgTable,
  serial,
  text,
  boolean,
  timestamp,
  integer,
  doublePrecision,
  bigint,
} from "drizzle-orm/pg-core";

// ==================== Master Stock Database ====================
export const stocks = pgTable("stocks", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull().unique(),
  name: text("name").notNull(),
  exchange: text("exchange").notNull(), // HOSE, HNX, UPCOM
  status: text("status").notNull().default("active"), // active, delisted, suspended
  // Real-time price data
  price: doublePrecision("price").default(0),
  open: doublePrecision("open_price").default(0),
  high: doublePrecision("high_price").default(0),
  low: doublePrecision("low_price").default(0),
  prevClose: doublePrecision("prev_close").default(0),
  change: doublePrecision("change_val").default(0),
  changePct: doublePrecision("change_pct").default(0),
  volume: bigint("volume", { mode: "number" }).default(0),
  // Fundamentals
  marketCap: bigint("market_cap", { mode: "number" }).default(0),
  pe: doublePrecision("pe").default(0),
  pb: doublePrecision("pb").default(0),
  eps: doublePrecision("eps").default(0),
  roe: doublePrecision("roe").default(0),
  roa: doublePrecision("roa").default(0),
  beta: doublePrecision("beta").default(0),
  dividendYield: doublePrecision("dividend_yield").default(0),
  high52w: doublePrecision("high_52w").default(0),
  low52w: doublePrecision("low_52w").default(0),
  sharesOutstanding: bigint("shares_outstanding", { mode: "number" }).default(0),
  freeFloat: doublePrecision("free_float").default(0),
  // Technical
  rsi: doublePrecision("rsi").default(50),
  macd: doublePrecision("macd").default(0),
  ma20: doublePrecision("ma20").default(0),
  ma50: doublePrecision("ma50").default(0),
  ma200: doublePrecision("ma200").default(0),
  // Metadata
  sector: text("sector").default(""),
  industry: text("industry").default(""),
  dataSource: text("data_source").default("VNDirect"),
  priceUpdatedAt: timestamp("price_updated_at"),
  listingUpdatedAt: timestamp("listing_updated_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Danh mục theo dõi của người dùng
export const watchlist = pgTable("watchlist", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  href: text("href").notNull(),
  pinned: boolean("pinned").notNull().default(false),
  marked: boolean("marked").notNull().default(false),
  note: text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Bài viết đã lưu
export const savedArticles = pgTable("saved_articles", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull(),
  title: text("title").notNull(),
  source: text("source").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Bố cục dashboard cá nhân
export const dashboardLayout = pgTable("dashboard_layout", {
  id: serial("id").primaryKey(),
  userKey: text("user_key").notNull().default("default"),
  widgetKey: text("widget_key").notNull(),
  position: integer("position").notNull().default(0),
  pinned: boolean("pinned").notNull().default(false),
  hidden: boolean("hidden").notNull().default(false),
});

// ==================== Tin tức thời gian thực ====================
// published_at: thời điểm nguồn gốc phát hành (KHÔNG chỉnh sửa)
// synced_at:    thời điểm Orca Financial thu thập và đồng bộ
export const newsItems = pgTable("news_items", {
  id: serial("id").primaryKey(),
  guid: text("guid").notNull().unique(),        // ID duy nhất từ nguồn (link/guid)
  title: text("title").notNull(),
  summary: text("summary").default(""),
  aiSummary: text("ai_summary").default(""),
  imageUrl: text("image_url").default(""),      // Ảnh thật từ nguồn (enclosure/media)
  link: text("link").notNull(),
  sourceKey: text("source_key").notNull(),      // vnexpress | cnbc | investing | ...
  sourceName: text("source_name").notNull(),     // Tên hiển thị: VnExpress, CNBC...
  category: text("category").default(""),
  tags: text("tags").default(""),               // JSON array dạng text
  impact: text("impact").default("thấp"),       // cao | trung bình | thấp
  publishedAt: timestamp("published_at"),       // Giờ phát hành từ nguồn (UTC)
  publishedAtRaw: text("published_at_raw").default(""), // Chuỗi gốc từ RSS
  timezone: text("timezone").default("+07:00"),
  syncedAt: timestamp("synced_at").notNull().defaultNow(),
  isValid: boolean("is_valid").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ==================== Chỉ số kinh tế vĩ mô ====================
export const macroIndicators = pgTable("macro_indicators", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  region: text("region").notNull(),             // vn | world
  value: text("value").notNull(),               // Giá trị hiện tại (string để giữ format)
  valueNumeric: doublePrecision("value_numeric").default(0),
  prev: text("prev").default(""),
  forecast: text("forecast").default(""),
  unit: text("unit").default(""),
  change: doublePrecision("change").default(0),
  description: text("description").default(""),
  sourceKey: text("source_key").default("worldbank"),
  sourceName: text("source_name").default("World Bank"),
  sourceUrl: text("source_url").default(""),
  publishedAt: timestamp("published_at"),        // Khi chỉ số được công bố chính thức
  publishedAtRaw: text("published_at_raw").default(""),
  reportPeriod: text("report_period").default(""),  // Ví dụ: "2025", "Q1/2026"
  syncedAt: timestamp("synced_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ==================== Lịch kinh tế ====================
export const calendarEvents = pgTable("calendar_events", {
  id: serial("id").primaryKey(),
  eventId: text("event_id").notNull().unique(),
  eventDate: text("event_date").notNull(),       // YYYY-MM-DD
  eventTime: text("event_time").default(""),     // HH:MM giờ local
  timezone: text("timezone").default("+00:00"),
  country: text("country").notNull(),
  flag: text("flag").default(""),
  event: text("event").notNull(),
  impact: text("impact").default("thấp"),
  actual: text("actual").default("—"),
  forecast: text("forecast").default("—"),
  previous: text("previous").default("—"),
  status: text("status").default("Sắp diễn ra"), // Sắp diễn ra | Đang diễn ra | Đã công bố
  sourceKey: text("source_key").default("static"),
  syncedAt: timestamp("synced_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type StockRecord = typeof stocks.$inferSelect;
export type Watchlist = typeof watchlist.$inferSelect;
export type SavedArticle = typeof savedArticles.$inferSelect;
export type DashboardLayout = typeof dashboardLayout.$inferSelect;
export type NewsItem = typeof newsItems.$inferSelect;
export type MacroIndicatorRow = typeof macroIndicators.$inferSelect;
export type CalendarEventRow = typeof calendarEvents.$inferSelect;
