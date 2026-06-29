/**
 * OrcaLogo — Unified Brand Component (Single Source of Truth)
 * ============================================================
 * TOÀN BỘ project chỉ import từ component này.
 * Không import trực tiếp /orca-sticker.svg ở nhiều nơi.
 * Thay đổi brand chỉ cần sửa tại file này.
 *
 * Variants:
 *   full      — sticker + tên (header, sidebar, footer)
 *   icon      — chỉ sticker (compact, mobile)
 *   text-only — chỉ text wordmark (in ấn, PDF header)
 *   badge     — sticker + tên inline nhỏ gọn
 */

import Link from "next/link";

/** Đường dẫn tuyệt đối — duy nhất trong toàn project */
export const BRAND_STICKER_SRC = "/orca-sticker.svg";
export const BRAND_ICON_SRC = "/orca-icon-512.png";
export const BRAND_WATERMARK_SRC = "/orca-watermark.svg";
export const BRAND_NAME = "ORCA FINANCIAL";
export const BRAND_TAGLINE = "Phân tích tài chính";

type Variant = "full" | "icon" | "text-only" | "badge";

interface OrcaLogoProps {
  size?: number;
  variant?: Variant;
  href?: string | null;
  className?: string;
  /** Dùng trong ngữ cảnh sáng (PDF, in ấn) */
  light?: boolean;
}

export function OrcaLogo({
  size = 36,
  variant = "full",
  href = "/",
  className = "",
  light = false,
}: OrcaLogoProps) {
  const inner = (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      {variant !== "text-only" && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={BRAND_STICKER_SRC}
          alt="Orca Financial Whale Sticker"
          width={size}
          height={size}
          loading="eager"
          decoding="async"
          fetchPriority="high"
          style={{ width: size, height: size, minWidth: size, display: "block" }}
        />
      )}
      {(variant === "full" || variant === "text-only") && (
        <span className="flex flex-col leading-none">
          <span
            className="font-bold tracking-wide"
            style={{ fontSize: Math.max(11, size * 0.42) }}
          >
            ORCA{" "}
            <span style={{ color: "#F5C542" }}>FINANCIAL</span>
          </span>
          <span
            className="tracking-[0.2em] uppercase opacity-60"
            style={{ fontSize: Math.max(8, size * 0.26) }}
          >
            {BRAND_TAGLINE}
          </span>
        </span>
      )}
      {variant === "badge" && (
        <span className="font-semibold tracking-wide" style={{ fontSize: Math.max(10, size * 0.38), color: light ? "#0B1F45" : "inherit" }}>
          ORCA <span style={{ color: "#F5C542" }}>FINANCIAL</span>
        </span>
      )}
    </span>
  );

  if (href === null) return inner;
  return (
    <Link href={href} className={`shrink-0 ${className}`} aria-label="Orca Financial — Trang chủ">
      {inner}
    </Link>
  );
}

/** Alias ngắn gọn tương thích ngược với import { Logo } */
export { OrcaLogo as Logo };
