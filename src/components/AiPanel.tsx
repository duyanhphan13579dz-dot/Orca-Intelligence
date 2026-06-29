import { Sparkles, TrendingUp, AlertTriangle, Lightbulb, Brain } from "lucide-react";

export function AiPanel({
  items,
}: {
  items: { icon: "summary" | "trend" | "risk" | "opportunity" | "sentiment"; title: string; text: string }[];
}) {
  const icons = {
    summary: Sparkles,
    trend: TrendingUp,
    risk: AlertTriangle,
    opportunity: Lightbulb,
    sentiment: Brain,
  };
  return (
    <div className="glass rounded-xl p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg gold-gradient text-navy">
          <Sparkles size={16} />
        </span>
        <div>
          <h3 className="font-semibold">Phân tích AI</h3>
          <p className="text-[11px] text-muted">Tự động tổng hợp và đánh giá bởi Orca AI</p>
        </div>
      </div>
      <div className="space-y-3">
        {items.map((it, i) => {
          const Icon = icons[it.icon];
          return (
            <div key={i} className="flex gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-3">
              <Icon size={16} className="mt-0.5 shrink-0 text-gold" />
              <div>
                <div className="text-sm font-medium">{it.title}</div>
                <p className="mt-0.5 text-xs leading-relaxed text-muted">{it.text}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
