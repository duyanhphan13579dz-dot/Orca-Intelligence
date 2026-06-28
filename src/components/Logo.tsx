import Image from "next/image";
import Link from "next/link";

export function Logo({
  size = 36,
  showText = true,
  href = "/",
}: {
  size?: number;
  showText?: boolean;
  href?: string | null;
}) {
  const inner = (
    <span className="flex items-center gap-2.5">
      <Image
        src="/logo.png"
        alt="Orca Financial"
        width={size}
        height={size}
        className="rounded-lg ring-1 ring-white/10"
        priority
        unoptimized
      />
      {showText && (
        <span className="flex flex-col leading-none">
          <span className="text-[15px] font-bold tracking-wide">
            ORCA <span className="text-gold">FINANCIAL</span>
          </span>
          <span className="text-[10px] text-muted tracking-[0.2em] uppercase">
            Phân tích tài chính
          </span>
        </span>
      )}
    </span>
  );
  if (href === null) return inner;
  return (
    <Link href={href} className="shrink-0">
      {inner}
    </Link>
  );
}
