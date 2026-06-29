import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-muted">
      <Link href="/" className="flex items-center gap-1 hover:text-gold">
        <Home size={13} /> Trang chủ
      </Link>
      {items.map((c) => (
        <span key={c.label} className="flex items-center gap-1.5">
          <ChevronRight size={13} />
          {c.href ? (
            <Link href={c.href} className="hover:text-gold">
              {c.label}
            </Link>
          ) : (
            <span className="text-white/90">{c.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
