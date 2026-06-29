import { PageHeader, Card, SectionTitle } from "@/components/ui";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ThemeToggle } from "@/components/ThemeToggle";

export const metadata = { title: "Cài đặt" };

export default function SettingsPage() {
  const toggle = (label: string, desc: string, on = true) => (
    <div className="flex items-center justify-between border-b border-white/5 py-3">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted">{desc}</div>
      </div>
      <div className={`flex h-6 w-11 items-center rounded-full px-0.5 ${on ? "gold-gradient justify-end" : "bg-white/15 justify-start"}`}>
        <div className="h-5 w-5 rounded-full bg-white" />
      </div>
    </div>
  );

  return (
    <div>
      <Breadcrumbs items={[{ label: "Cài đặt" }]} />
      <PageHeader title="Cài đặt" subtitle="Tùy chỉnh giao diện, thông báo và quyền riêng tư cho tài khoản của bạn." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <SectionTitle>Giao diện</SectionTitle>
          <div className="flex items-center justify-between border-b border-white/5 py-3">
            <div>
              <div className="text-sm font-medium">Chế độ sáng / tối</div>
              <div className="text-xs text-muted">Chuyển đổi giữa giao diện tối và sáng</div>
            </div>
            <ThemeToggle />
          </div>
          {toggle("Hiệu ứng chuyển động", "Bật/tắt animation toàn hệ thống")}
          {toggle("Watermark logo", "Hiển thị logo Orca làm hình nền mờ", true)}
          {toggle("Dữ liệu thời gian thực", "Tự động cập nhật dữ liệu trực tuyến", true)}
        </Card>

        <Card>
          <SectionTitle>Thông báo</SectionTitle>
          {toggle("Cảnh báo biến động giá", "Nhận thông báo khi giá vượt ngưỡng")}
          {toggle("Tin tức nổi bật", "Thông báo tin tức tác động cao", true)}
          {toggle("Báo cáo hằng ngày", "Gửi báo cáo tổng hợp mỗi sáng", false)}
          {toggle("Lịch kinh tế", "Nhắc trước các sự kiện quan trọng", true)}
        </Card>

        <Card>
          <SectionTitle>Thông tin tài khoản</SectionTitle>
          <div className="space-y-3 text-sm">
            <div><div className="text-xs text-muted">Tên hiển thị</div><input defaultValue="Nhà đầu tư" className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 outline-none" /></div>
            <div><div className="text-xs text-muted">Email</div><input defaultValue="investor@orcafinancial.vn" className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 outline-none" /></div>
            <button className="rounded-lg gold-gradient px-4 py-2 text-sm font-semibold text-navy">Lưu thay đổi</button>
          </div>
        </Card>

        <Card>
          <SectionTitle>Điều khoản &amp; Chính sách</SectionTitle>
          <div className="space-y-3 text-sm text-muted">
            <p><b className="text-white/90">Điều khoản sử dụng:</b> Dữ liệu trên Orca Financial chỉ mang tính tham khảo và không cấu thành khuyến nghị đầu tư. Người dùng tự chịu trách nhiệm với các quyết định của mình.</p>
            <p><b className="text-white/90">Chính sách bảo mật:</b> Chúng tôi cam kết bảo vệ dữ liệu cá nhân của người dùng và không chia sẻ cho bên thứ ba khi chưa được đồng ý.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
