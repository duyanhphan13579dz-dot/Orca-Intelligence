"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SIDEBAR_NAV, HEADER_NAV } from "@/lib/nav";
import { Logo } from "./Logo";
import { SearchBar } from "./SearchBar";
import { ThemeToggle } from "./ThemeToggle";
import { AutoRefresh } from "./AutoRefresh";
import { Bell, Menu, X, UserCircle2, Mail, Phone } from "lucide-react";

const NOTIFS = [
  "VN-Index vượt mốc 1.280 điểm",
  "FED phát tín hiệu hạ lãi suất",
  "Giá vàng SJC tiến sát 87 triệu/lượng",
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const isActive = (href: string) => {
    const base = href.split("?")[0];
    if (base === "/") return pathname === "/";
    return pathname === base || pathname.startsWith(base + "/");
  };

  return (
    <div className="relative z-10 flex min-h-screen flex-col">
      {/* Header */}
      <header className="glass-strong sticky top-0 z-40 flex h-16 items-center gap-3 border-b px-3 sm:px-5">
        <button
          className="rounded-lg p-2 hover:bg-white/10 lg:hidden"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu size={20} />
        </button>
        <Logo />
        <div className="ml-2 hidden flex-1 md:block">
          <SearchBar />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <AutoRefresh />
          <div className="relative">
            <button
              onClick={() => setNotifOpen((v) => !v)}
              className="relative rounded-lg border border-white/10 p-2 text-muted transition hover:text-gold"
            >
              <Bell size={18} />
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[9px] font-bold text-navy">
                {NOTIFS.length}
              </span>
            </button>
            {notifOpen && (
              <div className="glass-strong absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-lg">
                <div className="border-b px-3 py-2 text-sm font-semibold">Thông báo</div>
                {NOTIFS.map((n, i) => (
                  <div key={i} className="border-b px-3 py-2.5 text-xs text-muted hover:bg-white/5">
                    {n}
                  </div>
                ))}
              </div>
            )}
          </div>
          <ThemeToggle />
          <button className="flex items-center gap-2 rounded-lg border border-white/10 px-2.5 py-1.5 text-sm hover:bg-white/10">
            <UserCircle2 size={20} className="text-gold" />
            <span className="hidden text-xs sm:block">Nhà đầu tư</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar desktop */}
        <aside className="glass sticky top-16 hidden h-[calc(100vh-4rem)] w-60 shrink-0 overflow-y-auto border-r p-3 lg:block">
          <SidebarNav isActive={isActive} />
        </aside>

        {/* Sidebar mobile */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
            <aside className="glass-strong absolute left-0 top-0 h-full w-72 overflow-y-auto p-3">
              <div className="mb-4 flex items-center justify-between">
                <Logo size={32} />
                <button onClick={() => setSidebarOpen(false)} className="p-1.5">
                  <X size={20} />
                </button>
              </div>
              <div className="mb-3 md:hidden">
                <SearchBar />
              </div>
              <div onClick={() => setSidebarOpen(false)}>
                <SidebarNav isActive={isActive} />
              </div>
            </aside>
          </div>
        )}

        {/* Main */}
        <main className="min-w-0 flex-1">
          {/* Header nav strip */}
          <nav className="scrollbar-none hidden gap-1 overflow-x-auto border-b px-5 py-2 md:flex">
            {HEADER_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition ${
                  isActive(item.href) ? "bg-gold/15 text-gold" : "text-muted hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="p-4 sm:p-6">{children}</div>
          <Footer />
        </main>
      </div>
    </div>
  );
}

function SidebarNav({ isActive }: { isActive: (href: string) => boolean }) {
  return (
    <nav className="flex flex-col gap-0.5">
      {SIDEBAR_NAV.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
              active
                ? "gold-gradient font-semibold text-navy"
                : "text-muted hover:bg-white/5 hover:text-white"
            }`}
          >
            <Icon size={17} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function Footer() {
  return (
    <footer className="glass mt-6 border-t px-6 py-8">
      <div className="flex flex-col gap-6 md:flex-row md:justify-between">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-3 text-xs text-muted">
            Orca Financial — Nền tảng phân tích tài chính chuyên sâu dành cho nhà đầu tư cá nhân,
            tổ chức và chuyên gia tài chính tại Việt Nam.
          </p>
        </div>
        <div className="flex flex-col gap-2 text-xs text-muted">
          <span className="font-semibold text-gold">Liên hệ</span>
          <span className="flex items-center gap-2"><Mail size={13} /> support@orcafinancial.vn</span>
          <span className="flex items-center gap-2"><Phone size={13} /> Hotline: 1900 6868</span>
        </div>
        <div className="flex flex-col gap-2 text-xs text-muted">
          <span className="font-semibold text-gold">Pháp lý</span>
          <Link href="/cai-dat" className="hover:text-white">Điều khoản sử dụng</Link>
          <Link href="/cai-dat" className="hover:text-white">Chính sách bảo mật</Link>
          <span>Facebook • X • LinkedIn • YouTube</span>
        </div>
      </div>
      <div className="mt-6 border-t pt-4 text-center text-[11px] text-muted">
        © {new Date().getFullYear()} Orca Financial. Dữ liệu chỉ mang tính tham khảo, không phải khuyến nghị đầu tư.
      </div>
    </footer>
  );
}
