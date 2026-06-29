"use client";
import { useEffect, useRef, useState } from "react";
import { formatNumber } from "@/lib/format";

export function Counter({
  value,
  digits = 2,
  className = "",
  prefix = "",
  suffix = "",
}: {
  value: number;
  digits?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}) {
  const [display, setDisplay] = useState(0);
  const raf = useRef<number | null>(null);
  useEffect(() => {
    const start = performance.now();
    const dur = 900;
    const from = 0;
    const step = (now: number) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(from + (value - from) * eased);
      if (p < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [value]);
  return (
    <span className={className}>
      {prefix}
      {formatNumber(display, digits)}
      {suffix}
    </span>
  );
}
