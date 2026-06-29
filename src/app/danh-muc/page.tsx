"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader, Card, Badge } from "@/components/ui";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Pin, Star, Trash2, Loader2, ExternalLink } from "lucide-react";

interface Item {
  id: number;
  symbol: string;
  name: string;
  type: string;
  href: string;
  pinned: boolean;
  marked: boolean;
}

export default function WatchlistPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const res = await fetch("/api/watchlist");
    const json = await res.json();
    setItems(json.data ?? []);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const patch = async (id: number, body: Record<string, boolean>) => {
    await fetch("/api/watchlist", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...body }) });
    load();
  };
  const remove = async (id: number) => {
    await fetch("/api/watchlist", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    load();
  };

  return (
    <div>
      <Breadcrumbs items={[{ label: "Danh mục theo dõi" }]} />
      <PageHeader
        title="Danh mục theo dõi"
        subtitle="Theo dõi các cổ phiếu, hàng hóa, chỉ số và tài sản quan trọng. Ghim, đánh dấu hoặc xóa khỏi danh mục."
      />
      {loading ? (
        <div className="flex items-center gap-2 text-muted"><Loader2 className="animate-spin" size={16} /> Đang tải danh mục...</div>
      ) : items.length === 0 ? (
        <Card>
          <p className="text-muted">Danh mục của bạn đang trống. Hãy thêm tài sản từ trang chi tiết cổ phiếu, hàng hóa hoặc chỉ số.</p>
          <div className="mt-3 flex gap-2">
            <Link href="/co-phieu" className="rounded-lg gold-gradient px-4 py-2 text-sm font-semibold text-navy">Khám phá cổ phiếu</Link>
            <Link href="/hang-hoa" className="rounded-lg border border-white/15 px-4 py-2 text-sm">Khám phá hàng hóa</Link>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((it) => (
            <Card key={it.id} className="flex items-center gap-3">
              {it.pinned && <Pin size={15} className="text-gold" />}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold">{it.symbol}</span>
                  <Badge tone="royal">{it.type}</Badge>
                  {it.marked && <Star size={13} className="text-gold" fill="currentColor" />}
                </div>
                <div className="truncate text-xs text-muted">{it.name}</div>
              </div>
              <Link href={it.href} className="rounded-md border border-white/10 p-2 text-muted hover:text-gold"><ExternalLink size={15} /></Link>
              <button onClick={() => patch(it.id, { pinned: !it.pinned })} className={`rounded-md border border-white/10 p-2 ${it.pinned ? "text-gold" : "text-muted hover:text-gold"}`}><Pin size={15} /></button>
              <button onClick={() => patch(it.id, { marked: !it.marked })} className={`rounded-md border border-white/10 p-2 ${it.marked ? "text-gold" : "text-muted hover:text-gold"}`}><Star size={15} /></button>
              <button onClick={() => remove(it.id)} className="rounded-md border border-white/10 p-2 text-muted hover:text-rose-400"><Trash2 size={15} /></button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
