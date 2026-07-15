# Plan: Nâng cấp trải nghiệm HOMIX cho "đủ wow"

> Bối cảnh: chủ dự án thấy giao diện **chưa ưng ý** ở 4 mặt: **(1) bố cục & nhịp điệu, (2) hình ảnh & cách trình bày, (3) thiếu tính năng hấp dẫn, (4) tín hiệu tin cậy**. Tài liệu này để **Codex review** và làm lộ trình.

## ✅ Đã làm — Tính năng Combo chuyến đi (xử lý phần lớn #3, một phần #1 & #4)
- Combo = **1 căn lưu trú ngắn ngày + nhóm trải nghiệm (Perk)**, giá gói ưu đãi vs mua lẻ. 3 combo mẫu (Nghỉ dưỡng ven hồ, Foodie K-Town, Gia đình năng động).
- Data biên tập `data/combos.ts` (không cần migration) → hydrate Property+Perk & tính giá ở `lib/combos.ts` → `/api/combos` (+`[id]`) → `services/comboService.ts`.
- UI: section trang chủ `components/home/trip-combos-section.tsx` (thẻ magazine: ảnh chủ đề, tag, **badge tiết kiệm %**, **rating sao**, giá lẻ gạch ngang + giá gói) và trang chi tiết `app/combo/[id]` (hero + "Trong combo có gì" + panel giá sticky + "Đặt combo này").
- Đã verify: giá/tiết kiệm/rating đúng; section + detail render đẹp (vi/en).

**Combo — cập nhật (iteration 2):** ✅ trang danh sách `/combo` (index) + link "Xem tất cả" trên trang chủ; tách `components/combo/combo-card.tsx` dùng chung (DRY). Codex + /code-review: 0 finding. **Còn thiếu:** đặt combo THẬT (CTA hiện trỏ `/property/[id]`) — cần booking gộp stay+perks; badge combo trên card căn hộ liên quan.

## ✅ #6 — Map nhấp nháy + Branded loading/error — ĐÃ LÀM (iteration 4)
- Map: handler `styleimagemissing` chèn ảnh trong suốt → HẾT flicker icon thiếu (log sạch); loading overlay → **BrandLoaderInline** (logo HOMIX); error state có nút **Thử lại** (re-init map qua `retryKey`).
- `components/luxury/brand-loader.tsx`: thêm **BrandLoaderInline** (loader thương hiệu gọn, phủ trong container) — tái dùng được cho map/danh sách/ảnh.
- Review 2 tầng (subagent + Codex) đều bắt HIGH: retry không dọn `markersRef` → mất marker; đã fix (cleanup clear markersRef/poiPopupRef/heroLayerRef) + z-index loader.
- **Còn (bổ sung sau):** tích hợp BrandLoaderInline vào `StateWrapper` để đồng bộ loading/error toàn site.

## 🔴 #2 — Hình ảnh & cách trình bày (ưu tiên cao — ảnh hiện vẫn chưa "chuẩn OCP"/chưa đồng bộ)
1. **Chuẩn hoá bộ ảnh**: hero, featured, lifestyle, combo đang trộn ảnh thật OCP + vài ảnh nội thất "mượn". Cần 1 bộ ảnh nhất quán tông màu (xanh hồ/nắng ấm). Xem [[image-sourcing-decision]]. Việc này giờ **dễ hơn nhiều** nhờ tính năng **Quản lý ảnh** ([[property-image-management]]) — có thể thay ảnh từng căn ngay trên web.
2. **Xử lý ảnh nhất quán**: tỉ lệ cắt cố định (4:3 card, 16:11 combo), overlay gradient thống nhất, `priority` cho ảnh đầu, chất lượng ≥ tránh vỡ nét.
3. **Ảnh có chiều sâu**: thêm hover-zoom (đã có ở combo card), parallax nhẹ ở vài section, ảnh phòng ngủ/bếp THẬT cho card (hiện `apt-bedroom-1`/`apt-kitchen-1` đang là ảnh phòng khách — xem [[image-sourcing-decision]] mục caveat).

## 🟠 #5 — Đầy đủ tính năng cho SALE (portal /agent phần lớn là stub ComingSoon)
Phát hiện iteration 3: `/agent/*` có 12 tab nhưng chỉ `leads` được build; còn lại là stub 9 dòng.
- ✅ **AI Pricing** (`/agent/pricing`) — công cụ định giá thật theo căn tương đương available (median/p25/p75 giá/m² × diện tích) + danh sách comps. Codex bắt 4 finding (chỉ lấy available, area rỗng, i18n `PN`) → đã fix.
- **Còn stub cần build** (ưu tiên sale): `commission` (hoa hồng), `contracts` (HĐ & eKYC), `schedule` (điều phối lịch), `match` (gợi ý căn cho lead), `messages`, `quality`(SLA/CSAT). Mỗi cái 1 iteration.

## 🟠 #1 — Bố cục & nhịp điệu trang
- **Xen kẽ nền & layout** để trang bớt "một mạch": section combo đã dùng `bg-secondary/40` — áp cùng nguyên tắc cho các section khác (sáng/tối xen kẽ, full-bleed vs container).
- **Đa dạng dạng thẻ**: hiện featured toàn card giống nhau. Thêm 1 "hero card" lớn hoặc bố cục bento cho khu nổi bật.
- **Nhịp cuộn**: đảm bảo mỗi section có eyebrow → title → subtitle nhất quán (đã có), thêm section "số liệu/uy tín" ngắn giữa hero và featured (dùng `hero.stat*` đang bỏ trống).

## ✅ #4 — Tín hiệu tin cậy — ĐÃ LÀM (iteration 1)
- **Trust strip** dưới hero: `components/home/trust-strip.tsx` + `/api/stats` (đếm thật: căn/phân khu/chủ nhà/đánh giá) + 3 cam kết (xác minh · minh bạch · 24/7).
- **Section "Khách nói gì"**: `components/home/testimonials-section.tsx` + `/api/reviews` (review rating≥4, kèm avatar/tên/link căn) + `services/homeService.ts`.
- Review pass đã fix: khôi phục thứ tự key locale (bỏ churn 625 dòng → 37), guard NaN cho `?limit`.
- Còn lại (bổ sung sau): logo đối tác/thanh toán ở footer; badge "Đã xác minh" nổi hơn trên card; testimonials hiện đếm theo review featured (không phải tổng) — cân nhắc lấy tổng từ /api/stats.

## Thứ tự đề xuất
1. (#2) Chuẩn hoá + thay ảnh THẬT cho bedroom/kitchen/combo qua tính năng Quản lý ảnh.
2. (#4) Trust strip + section Reviews (tác động niềm tin lớn, chi phí vừa).
3. (#3) Hoàn thiện combo: index `/combo` + đặt combo thật.
4. (#1) Bento featured + section số liệu + xen kẽ nền.

## Bước "review" của loop — HAI TẦNG (theo yêu cầu user)
Mỗi iteration review bằng **2 tác nhân độc lập**, fix union của cả hai:
1. **Subagent review** — spawn 1 subagent (Agent tool, `general-purpose`) đọc `git diff` của iteration, tìm bug correctness/bảo mật/edge case/UX, trả finding file:line + mức độ + cách sửa (KHÔNG sửa).
2. **Codex CLI review** — `codex exec -s read-only -o <outfile> "review git diff HEAD, ... KHÔNG sửa file"` rồi đọc `<outfile>`.

(Trước đây dùng `/code-review` skill thay cho subagent; Codex đã bắt race read-modify-write ở POST /images — fix ở `4b8c7bd`. Từ nay: subagent + Codex.)

## Ghi chú kỹ thuật
- Font serif Fraunces render dấu tiếng Việt ở cỡ lớn hơi lệch (vd "Cuối tuần") — cân nhắc chỉ dùng serif cho tiêu đề ít dấu, hoặc fine-tune. Xem [[brand-and-font]].
- Mọi ảnh ngoài (Supabase) render tốt nhờ `images.unoptimized`.
