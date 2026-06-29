import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3 animate-fade-up">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`glass rounded-xl p-4 ${className}`}>{children}</div>;
}

export function SectionTitle({
  children,
  href,
  linkLabel = "Xem chi tiết",
}: {
  children: React.ReactNode;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-lg font-semibold">{children}</h2>
      {href && (
        <Link
          href={href}
          className="flex items-center gap-1 text-xs font-medium text-gold hover:underline"
        >
          {linkLabel} <ArrowRight size={13} />
        </Link>
      )}
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "gold" | "success" | "danger" | "royal";
}) {
  const tones: Record<string, string> = {
    neutral: "bg-white/10 text-white/80",
    gold: "bg-gold/15 text-gold",
    success: "bg-emerald-500/15 text-emerald-400",
    danger: "bg-rose-500/15 text-rose-400",
    royal: "bg-blue-500/15 text-blue-300",
  };
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

export function ImpactBadge({ impact }: { impact: string }) {
  const map: Record<string, "danger" | "gold" | "neutral"> = {
    cao: "danger",
    "trung bình": "gold",
    thấp: "neutral",
  };
  return <Badge tone={map[impact] ?? "neutral"}>Ảnh hưởng {impact}</Badge>;
}
