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

## ✅ Đã kiểm chứng lại (đính chính)

### 1. Định vị marketplace — KHÔNG cần đổi (đã đúng)
Đính chính: kết luận ban đầu "home mở đầu bằng bản đồ" là **sai do công cụ chụp** — `_shot.mjs`
mặc định cuộn tới bản đồ (`scrollTo='map'`). Kiểm tra lại DOM: hero `#tong-quan` nằm ở top=0 với
pitch + **thanh tìm kiếm (tabs Thuê/Lưu trú/Mua bán + Tìm kiếm)** + số liệu + ảnh căn nổi bật + trust
strip — **đúng y pattern Marketplace** skill khuyến nghị. Bản đồ là section #5 (dưới màn đầu). Không đổi.

### 2. Hiệu năng bản đồ — ĐÃ SỬA
`MasterplanLocator` trước đây import tĩnh `maplibre-gl` → nằm trong bundle đầu và khởi tạo WebGL ngay
lúc tải dù ở dưới màn đầu (11 request tile external mỗi lần tải). Đã đổi sang **dynamic import + gate
IntersectionObserver** (`building-locator-section.tsx`): chỉ nạp chunk + dựng map khi cuộn tới gần
(rootMargin 400px), placeholder cùng chiều cao (không CLS). Kiểm chứng: tile external lúc tải đầu **11 → 0**,
map vẫn render đúng khi cuộn tới.

### 3. Chi tiết nhỏ (chưa làm)
- `min-h-screen` → cân nhắc `min-h-dvh` ở trang mobile-first (login, 403…) để tránh giật do thanh trình duyệt mobile (`viewport-units`).
- Kiểm tra **độ tương phản** `muted-foreground` (giá phụ, thông số) đạt 4.5:1 ở **cả** light & dark (`color-accessible-pairs`) — nên đo bằng công cụ.
- Đảm bảo đoạn mô tả dài có `max-w` (đo dòng 60–75 ký tự — `line-length`).

### Ghi chú về font
Skill gợi ý Cinzel/Josefin cho BĐS sang trọng — **KHÔNG áp dụng**: hai font này không có subset
tiếng Việt (dấu chồng ế/ẫ/ị vỡ). Bộ hiện tại (Montserrat VN / Sora EN cho display, Plus Jakarta Sans body)
là lựa chọn đúng cho song ngữ — giữ nguyên.
