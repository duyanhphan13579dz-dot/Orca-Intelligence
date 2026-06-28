import Link from "next/link";
import { SearchX, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[55vh] flex-col items-center justify-center text-center">
      <div className="glass max-w-md rounded-2xl p-8">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gold/15 text-gold">
          <SearchX size={28} />
        </div>
        <h1 className="text-xl font-bold">Không tìm thấy mã cổ phiếu</h1>
        <p className="mt-2 text-sm text-muted">
          Mã cổ phiếu bạn tìm không tồn tại trong Master Database hoặc chưa được niêm yết trên
          HOSE, HNX, UPCOM. Vui lòng kiểm tra lại hoặc tìm kiếm mã khác.
        </p>
        <Link
          href="/co-phieu"
          className="mt-6 inline-flex items-center gap-2 rounded-lg gold-gradient px-5 py-2.5 text-sm font-semibold text-navy transition hover:opacity-90"
        >
          <ArrowLeft size={16} /> Quay lại tìm kiếm cổ phiếu
        </Link>
      </div>
    </div>
  );
}
