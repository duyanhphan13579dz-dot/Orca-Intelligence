import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <Logo size={56} showText={false} href={null} />
      <h1 className="mt-6 text-5xl font-extrabold text-gold">404</h1>
      <p className="mt-2 text-lg">Không tìm thấy trang bạn yêu cầu</p>
      <p className="mt-1 text-sm text-muted">Trang có thể đã bị di chuyển hoặc không tồn tại.</p>
      <Link href="/" className="mt-6 rounded-lg gold-gradient px-5 py-2.5 text-sm font-semibold text-navy">
        Quay về Trang chủ
      </Link>
    </div>
  );
}
