import { PageHeader } from "@/components/ui";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { StockSearch } from "@/components/StockSearch";

export const metadata = {
  title: "Cổ phiếu — Tìm kiếm & phân tích",
  description: "Tìm kiếm toàn bộ mã cổ phiếu HOSE, HNX, UPCOM với dữ liệu thời gian thực từ VNDirect. Hỗ trợ fuzzy search theo mã, tên, ngành, sàn.",
};

export default function CoPhieuPage() {
  return (
    <div>
      <Breadcrumbs items={[{ label: "Cổ phiếu" }]} />
      <PageHeader
        title="Cổ phiếu Việt Nam"
        subtitle="Master Database đồng bộ toàn bộ mã HOSE, HNX, UPCOM. Giá realtime mỗi 15 phút. Tìm kiếm theo mã, tên, ngành, sàn — hỗ trợ fuzzy search. Nhấn vào mã để xem báo cáo Equity Research chuyên sâu."
      />
      <StockSearch />
    </div>
  );
}
