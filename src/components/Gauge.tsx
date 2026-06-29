export function Gauge({
  score,
  label,
  size = 180,
}: {
  score: number; // -100..100
  label: string;
  size?: number;
}) {
  const clamped = Math.max(-100, Math.min(100, score));
  const angle = (clamped / 100) * 90; // -90..90
  const r = size / 2 - 14;
  const cx = size / 2;
  const cy = size / 2;
  const needleRad = ((angle - 90) * Math.PI) / 180;
  const nx = cx + Math.cos(needleRad) * (r - 8);
  const ny = cy + Math.sin(needleRad) * (r - 8);
  const arc = (startDeg: number, endDeg: number) => {
    const s = ((startDeg - 180) * Math.PI) / 180;
    const e = ((endDeg - 180) * Math.PI) / 180;
    const x1 = cx + r * Math.cos(s);
    const y1 = cy + r * Math.sin(s);
    const x2 = cx + r * Math.cos(e);
    const y2 = cy + r * Math.sin(e);
    return `M${x1},${y1} A${r},${r} 0 0 1 ${x2},${y2}`;
  };
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size / 2 + 24} viewBox={`0 0 ${size} ${size / 2 + 24}`}>
        <path d={arc(0, 36)} fill="none" stroke="#e53935" strokeWidth="10" strokeLinecap="round" />
        <path d={arc(36, 72)} fill="none" stroke="#fb923c" strokeWidth="10" />
        <path d={arc(72, 108)} fill="none" stroke="#94a3b8" strokeWidth="10" />
        <path d={arc(108, 144)} fill="none" stroke="#4ade80" strokeWidth="10" />
        <path d={arc(144, 180)} fill="none" stroke="#00c853" strokeWidth="10" strokeLinecap="round" />
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#f5c542" strokeWidth="3" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="6" fill="#f5c542" />
      </svg>
      <span className="text-lg font-bold text-gold">{label}</span>
    </div>
  );
}
