"use client";
import { useState } from "react";
import { Star, Check, Loader2 } from "lucide-react";

export function WatchlistButton({
  symbol,
  name,
  type,
  href,
}: {
  symbol: string;
  name: string;
  type: string;
  href: string;
}) {
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");

  const add = async () => {
    if (state !== "idle") return;
    setState("loading");
    try {
      await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol, name, type, href }),
      });
      setState("done");
    } catch {
      setState("idle");
    }
  };

  return (
    <button
      onClick={add}
      className="flex items-center gap-2 rounded-lg border border-gold/40 bg-gold/10 px-3 py-2 text-sm font-medium text-gold transition hover:bg-gold/20 disabled:opacity-70"
      disabled={state !== "idle"}
    >
      {state === "loading" ? (
        <Loader2 size={15} className="animate-spin" />
      ) : state === "done" ? (
        <Check size={15} />
      ) : (
        <Star size={15} />
      )}
      {state === "done" ? "Đã thêm vào danh mục" : "Thêm vào danh mục theo dõi"}
    </button>
  );
}
