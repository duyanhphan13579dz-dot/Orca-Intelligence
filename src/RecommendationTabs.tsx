"use client";
import { useState } from "react";
import { Target, BarChart3, Crown } from "lucide-react";

interface TabData {
  key: string;
  label: string;
  icon: "target" | "bar" | "crown";
  data: Record<string, string>;
}

const ICONS = { target: Target, bar: BarChart3, crown: Crown };

export function RecommendationTabs({ tabs }: { tabs: TabData[] }) {
  const [active, setActive] = useState(tabs[0]?.key ?? "");
  const current = tabs.find((t) => t.key === active) ?? tabs[0];

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((t) => {
          const Icon = ICONS[t.icon];
          const on = t.key === active;
          return (
            <button
              key={t.key}
              onClick={() => setActive(t.key)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                on ? "gold-gradient text-navy" : "border border-white/10 text-muted hover:text-white"
              }`}
            >
              <Icon size={15} /> {t.label}
            </button>
          );
        })}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {Object.entries(current.data).map(([k, v]) => (
          <div key={k} className="flex items-center justify-between gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-4 py-2.5 text-sm">
            <span className="text-muted">{k}</span>
            <span className="text-right font-semibold">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
