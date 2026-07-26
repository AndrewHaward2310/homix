# DOMIX HOME — Đánh giá UI/UX (skill ui-ux-pro-max)

Rà soát theo bộ luật của skill **ui-ux-pro-max** (10 nhóm: a11y, touch, performance, style,
layout, typography/color, animation, forms, navigation, charts) + checklist pre-delivery.
Đối chiếu code + ảnh chụp thật (home, search, property detail) ở desktop 1440 & mobile 375.

Recommendation của skill cho sản phẩm này: **pattern Marketplace/Directory**, style *Exaggerated
Minimalism*, palette real-estate (teal/blue). Chạy lại bất cứ lúc nào:
`python3 .claude/skills/ui-ux-pro-max/scripts/search.py "<query>" --design-system -p "DOMIX HOME"`.

## ✅ Đang làm tốt (đạt chuẩn skill)
- **Không dùng emoji làm icon** — toàn bộ dùng Lucide (đúng `no-emoji-icons`).
- **prefers-reduced-motion** được tôn trọng (`app/globals.css` tắt animation theo class, không phá layout).
- **Token màu ngữ nghĩa** — CSS vars (`--primary/--brand/--ring/...`), không rải hex trong component.
- **A11y tương tác** — nút icon có `aria-label`, modal/widget có focus-trap + Escape + click-ngoài, `aria-pressed` ở nút yêu thích.
- **Loading** — skeleton/StateWrapper thay vì spinner trần.
- **Responsive search** — split-view (thẻ + bản đồ) desktop, thẻ dọc mobile; chip lọc + sort rõ ràng.

## ✅ Đã sửa trong lần này
| # | Mức | Vấn đề | Cách sửa |
|---|-----|--------|----------|
| H1 | HIGH | Nút chat nổi (FAB) **đè lên thanh CTA "Đặt lịch" dính đáy** ở mobile trang chi tiết → che mất hành động chính (`primary-action`, tap-conflict). | `support-widget.tsx`: nâng FAB + panel lên trên thanh CTA ở mobile khi ở route `/property/*` (`bottom-24 lg:bottom-5`). |
| M1 | MED | Nhãn **"Đã xác minh" bị cắt** ("Đã xác mi…") trên thẻ hẹp (lưới 3 cột) — vi phạm `truncation-strategy`. | `property-card.tsx`: badge row `right-14 flex-wrap` + `whitespace-nowrap` → nhãn xuống dòng, không đè nút tim. |
| M2 | MED | **Giá không dùng chữ số tabular** → dễ nhảy layout & lệch cột (`number-tabular`). | Thêm `tabular-nums` cho giá ở thẻ + thanh CTA chi tiết. |

## ☐ Khuyến nghị tiếp theo (chưa làm — cần bạn quyết)

### 1. Định vị sản phẩm: single-development vs marketplace (ưu tiên cao)
Navbar hiện là khung **một dự án** ("Tổng quan / Căn hộ / Tiện ích / Vị trí") và trang chủ mở đầu
bằng **bản đồ 3D masterplan full-bleed**, trong khi `/search` lại là **marketplace nhiều tin**.
Skill khuyến nghị pattern Marketplace: *hero = thanh tìm kiếm*, rồi Categories → Featured listings →
Trust → CTA. → **Quyết định hướng đi**: nếu là sàn nhiều tin, đưa search + tin nổi bật lên đầu home,
để bản đồ thành mục "khám phá khu vực" phía dưới; nếu là 1 đại dự án thì giữ map hero nhưng đổi
navbar cho nhất quán.

### 2. Hiệu năng hero (mobile LCP/TTI)
Home mở đầu bằng `maplibre-gl` (JS nặng) **trên màn đầu**. Dù đã `dynamic import`, nó vẫn above-the-fold.
Skill `bundle-splitting` / `lazy-load-below-fold`: cân nhắc ảnh bản đồ tĩnh nhẹ làm placeholder, chỉ
nạp map tương tác khi người dùng chạm/scroll.

### 3. Chi tiết nhỏ
- `min-h-screen` → cân nhắc `min-h-dvh` ở trang mobile-first (login, 403…) để tránh giật do thanh trình duyệt mobile (`viewport-units`).
- Kiểm tra **độ tương phản** `muted-foreground` (giá phụ, thông số) đạt 4.5:1 ở **cả** light & dark (`color-accessible-pairs`) — nên đo bằng công cụ.
- Đảm bảo đoạn mô tả dài có `max-w` (đo dòng 60–75 ký tự — `line-length`).

### Ghi chú về font
Skill gợi ý Cinzel/Josefin cho BĐS sang trọng — **KHÔNG áp dụng**: hai font này không có subset
tiếng Việt (dấu chồng ế/ẫ/ị vỡ). Bộ hiện tại (Montserrat VN / Sora EN cho display, Plus Jakarta Sans body)
là lựa chọn đúng cho song ngữ — giữ nguyên.
