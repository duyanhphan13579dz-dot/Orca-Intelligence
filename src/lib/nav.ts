import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Newspaper,
  Flag,
  Globe2,
  LineChart,
  Boxes,
  Banknote,
  Bitcoin,
  Landmark,
  Activity,
  Target,
  CalendarDays,
  FileText,
  Star,
  Settings,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const SIDEBAR_NAV: NavItem[] = [
  { label: "Tổng quan", href: "/", icon: LayoutDashboard },
  { label: "Tin tức hôm nay", href: "/tin-tuc", icon: Newspaper },
  { label: "Thị trường Việt Nam", href: "/thi-truong?khu-vuc=vn", icon: Flag },
  { label: "Thị trường Quốc tế", href: "/thi-truong?khu-vuc=quoc-te", icon: Globe2 },
  { label: "Cổ phiếu", href: "/co-phieu", icon: LineChart },
  { label: "Hàng hóa", href: "/hang-hoa", icon: Boxes },
  { label: "Ngoại hối", href: "/ngoai-hoi", icon: Banknote },
  { label: "Tiền mã hóa", href: "/tien-ma-hoa", icon: Bitcoin },
  { label: "Kinh tế vĩ mô", href: "/kinh-te", icon: Landmark },
  { label: "Phân tích kỹ thuật", href: "/phan-tich-ky-thuat", icon: Activity },
  { label: "Chiến lược đầu tư", href: "/chien-luoc", icon: Target },
  { label: "Lịch kinh tế", href: "/lich-kinh-te", icon: CalendarDays },
  { label: "Báo cáo", href: "/bao-cao", icon: FileText },
  { label: "Danh mục theo dõi", href: "/danh-muc", icon: Star },
  { label: "Cài đặt", href: "/cai-dat", icon: Settings },
];

export const HEADER_NAV: { label: string; href: string }[] = [
  { label: "Tổng quan", href: "/" },
  { label: "Thị trường", href: "/thi-truong" },
  { label: "Cổ phiếu", href: "/co-phieu" },
  { label: "Hàng hóa", href: "/hang-hoa" },
  { label: "Ngoại hối", href: "/ngoai-hoi" },
  { label: "Tiền mã hóa", href: "/tien-ma-hoa" },
  { label: "Kinh tế vĩ mô", href: "/kinh-te" },
  { label: "Phân tích kỹ thuật", href: "/phan-tich-ky-thuat" },
  { label: "Chiến lược", href: "/chien-luoc" },
  { label: "Tin tức", href: "/tin-tuc" },
  { label: "Báo cáo", href: "/bao-cao" },
  { label: "Lịch kinh tế", href: "/lich-kinh-te" },
];
