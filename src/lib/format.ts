export function formatNumber(value: number, digits = 2): string {
  return new Intl.NumberFormat("vi-VN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function formatInt(value: number): string {
  return new Intl.NumberFormat("vi-VN").format(Math.round(value));
}

export function formatPercent(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${formatNumber(value, 2)}%`;
}

export function formatChange(value: number, digits = 2): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${formatNumber(value, digits)}`;
}

export function formatCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000_000_000)
    return `${formatNumber(value / 1_000_000_000_000, 2)} nghìn tỷ`;
  if (Math.abs(value) >= 1_000_000_000)
    return `${formatNumber(value / 1_000_000_000, 2)} tỷ`;
  if (Math.abs(value) >= 1_000_000)
    return `${formatNumber(value / 1_000_000, 2)} triệu`;
  if (Math.abs(value) >= 1_000)
    return `${formatNumber(value / 1_000, 1)} nghìn`;
  return formatNumber(value, 0);
}

export function formatUsdCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000_000_000)
    return `${formatNumber(value / 1_000_000_000_000, 2)}T`;
  if (Math.abs(value) >= 1_000_000_000)
    return `${formatNumber(value / 1_000_000_000, 2)}B`;
  if (Math.abs(value) >= 1_000_000)
    return `${formatNumber(value / 1_000_000, 2)}M`;
  if (Math.abs(value) >= 1_000)
    return `${formatNumber(value / 1_000, 1)}K`;
  return formatNumber(value, 0);
}

export function colorOf(value: number): string {
  if (value > 0) return "text-emerald-400";
  if (value < 0) return "text-rose-400";
  return "text-slate-400";
}

export function bgOf(value: number): string {
  if (value > 0) return "bg-emerald-500/15 text-emerald-400";
  if (value < 0) return "bg-rose-500/15 text-rose-400";
  return "bg-slate-500/15 text-slate-400";
}
