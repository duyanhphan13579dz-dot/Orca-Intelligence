"use client";
import { FileDown } from "lucide-react";

export function PrintButton({ label = "Xuất PDF" }: { label?: string }) {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-2 rounded-lg gold-gradient px-4 py-2 text-sm font-semibold text-navy transition hover:opacity-90"
    >
      <FileDown size={16} /> {label}
    </button>
  );
}
