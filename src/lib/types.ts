export interface Candle {
  t: string;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

export interface Quote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  open: number;
  high: number;
  low: number;
  prevClose: number;
  volume: number;
  unit?: string;
  series: number[];
}

export interface Stock extends Quote {
  exchange: string;
  sector: string;
  marketCap: number;
  pe: number;
  eps: number;
  roe: number;
  beta: number;
  rsi: number;
  macd: number;
  ma20: number;
  ma50: number;
  ma200: number;
}

export interface Commodity extends Quote {
  slug: string;
  region: "vn" | "world";
  category: string;
  icon: string;
  updatedAt: string;
}

export interface NewsItem {
  slug: string;
  title: string;
  summary: string;
  content: string[];
  source: string;
  category: string;
  tags: string[];
  impact: "cao" | "trung bình" | "thấp";
  time: string;
  image: string;
}

export interface MacroIndicator {
  slug: string;
  name: string;
  region: "vn" | "world";
  value: string;
  change: number;
  prev: string;
  forecast: string;
  unit: string;
  description: string;
  series: number[];
}

export interface CalendarEvent {
  id: string;
  time: string;
  date: string;
  country: string;
  flag: string;
  event: string;
  impact: "cao" | "trung bình" | "thấp";
  actual: string;
  forecast: string;
  previous: string;
}

export interface Strategy {
  slug: string;
  period: "ngày" | "tuần" | "tháng";
  title: string;
  trend: string;
  entry: string;
  exit: string;
  stopLoss: string;
  takeProfit: string;
  risk: string;
  confidence: number;
  summary: string;
}
