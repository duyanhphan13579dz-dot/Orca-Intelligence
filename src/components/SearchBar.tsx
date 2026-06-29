"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";

interface Result {
  label: string;
  sub: string;
  href: string;
}

// Static entries for non-stock pages
const STATIC: Result[] = [
  { label: "VN-Index", sub: "Phân tích kỹ thuật", href: "/phan-tich-ky-thuat/VNINDEX" },
  { label: "Vàng SJC", sub: "Hàng hóa", href: "/hang-hoa/vang-sjc-ban" },
  { label: "Dầu thô WTI", sub: "Hàng hóa", href: "/hang-hoa/dau-tho-wti" },
  { label: "Cà phê Robusta", sub: "Hàng hóa", href: "/hang-hoa/ca-phe-robusta" },
  { label: "USD/VND", sub: "Ngoại hối", href: "/ngoai-hoi" },
  { label: "Bitcoin", sub: "Tiền mã hóa", href: "/tien-ma-hoa" },
  { label: "GDP Việt Nam", sub: "Kinh tế vĩ mô", href: "/kinh-te/gdp-vn" },
  { label: "Lãi suất FED", sub: "Kinh tế vĩ mô", href: "/kinh-te/fed-rate" },
];

export function SearchBar() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!q || q.length < 1) {
      setResults([]);
      return;
    }

    // Search static entries immediately
    const staticResults = STATIC.filter(
      (r) => r.label.toLowerCase().includes(q.toLowerCase()) || r.sub.toLowerCase().includes(q.toLowerCase()),
    ).slice(0, 3);

    setResults(staticResults);

    // Search DB with debounce
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/stocks/search?q=${encodeURIComponent(q)}&limit=7`);
        const json = await res.json();
        if (json.ok && Array.isArray(json.data)) {
          const dbResults: Result[] = json.data.map((s: { symbol: string; name: string; exchange: string }) => ({
            label: s.symbol,
            sub: `Cổ phiếu ${s.exchange} • ${s.name}`,
            href: `/co-phieu/${s.symbol}`,
          }));
          setResults([...dbResults, ...staticResults]);
        }
      } catch { /* use static only */ }
      setLoading(false);
    }, 250);

    return () => clearTimeout(timer);
  }, [q]);

  const go = (href: string) => {
    setQ("");
    setOpen(false);
    router.push(href);
  };

  return (
    <div ref={ref} className="relative w-full max-w-md">
      <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
        <Search size={16} className="text-muted" />
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => q && setOpen(true)}
          placeholder="Tìm mã cổ phiếu, hàng hóa, chỉ số..."
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
        />
        {loading && <Loader2 size={14} className="animate-spin text-gold" />}
      </div>
      {open && results.length > 0 && (
        <div className="glass-strong absolute z-50 mt-2 w-full overflow-hidden rounded-lg">
          {results.map((r, i) => (
            <button key={`${r.href}-${i}`} onClick={() => go(r.href)} className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-white/10">
              <span className="font-semibold">{r.label}</span>
              <span className="max-w-[200px] truncate text-xs text-muted">{r.sub}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
