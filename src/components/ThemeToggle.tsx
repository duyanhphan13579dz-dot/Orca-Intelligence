"use client";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const [dark, setDark] = useState(true);
  useEffect(() => {
    const saved = localStorage.getItem("orca-theme");
    const isDark = saved !== "light";
    setDark(isDark);
    document.documentElement.classList.toggle("light", !isDark);
  }, []);
  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("light", !next);
    localStorage.setItem("orca-theme", next ? "dark" : "light");
  };
  return (
    <button
      onClick={toggle}
      className="rounded-lg border border-white/10 p-2 text-muted transition hover:text-gold"
      title="Chế độ sáng/tối"
      aria-label="Chế độ sáng/tối"
    >
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
