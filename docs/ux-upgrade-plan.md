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
- ✅ (iteration 5) Đồng bộ toàn site: thêm `BrandSpinner` (loader thương hiệu inline) + dùng làm fallback loading của `StateWrapper` → mọi trang host/admin/agent/combo/search có loading mang thương hiệu HOMIX (skeleton riêng vẫn ưu tiên). Review 2 tầng: 0 bug; Codex nhắc bỏ track `tsconfig.tsbuildinfo` → đã gitignore.

## 🔴 #2 — Hình ảnh & cách trình bày (ưu tiên cao — ảnh hiện vẫn chưa "chuẩn OCP"/chưa đồng bộ)
1. **Chuẩn hoá bộ ảnh**: hero, featured, lifestyle, combo đang trộn ảnh thật OCP + vài ảnh nội thất "mượn". Cần 1 bộ ảnh nhất quán tông màu (xanh hồ/nắng ấm). Xem [[image-sourcing-decision]]. Việc này giờ **dễ hơn nhiều** nhờ tính năng **Quản lý ảnh** ([[property-image-management]]) — có thể thay ảnh từng căn ngay trên web.
2. **Xử lý ảnh nhất quán**: tỉ lệ cắt cố định (4:3 card, 16:11 combo), overlay gradient thống nhất, `priority` cho ảnh đầu, chất lượng ≥ tránh vỡ nét.
3. **Ảnh có chiều sâu**: thêm hover-zoom (đã có ở combo card), parallax nhẹ ở vài section, ảnh phòng ngủ/bếp THẬT cho card (hiện `apt-bedroom-1`/`apt-kitchen-1` đang là ảnh phòng khách — xem [[image-sourcing-decision]] mục caveat).

## 🟠 #5 — Đầy đủ tính năng cho SALE (portal /agent phần lớn là stub ComingSoon)
Phát hiện iteration 3: `/agent/*` có 12 tab nhưng chỉ `leads` được build; còn lại là stub 9 dòng.
- ✅ **AI Pricing** (`/agent/pricing`) — công cụ định giá thật theo căn tương đương available (median/p25/p75 giá/m² × diện tích) + danh sách comps. Codex bắt 4 finding (chỉ lấy available, area rỗng, i18n `PN`) → đã fix.
- ✅ **Smart Match** (`/agent/match`, iteration 6) — mỗi lead + căn gợi ý thật (join `matchedPropertyIds`→property, chỉ căn available), badge trạng thái, liên hệ mailto/tel. Review 2 tầng cùng bắt: getProperties default pageSize (→ searchProperties 48), lọc available, mailto/tel, retry, key thừa — đã fix hết.
- **Còn stub cần build** (ưu tiên sale): `commission` (hoa hồng), `contracts` (HĐ & eKYC), `schedule` (điều phối lịch), `messages`, `quality`(SLA/CSAT). Mỗi cái 1 iteration.

## 🔴 #8 — TỰ THIẾT KẾ COMBO (Combo Builder) — user đặt hàng, ưu tiên cao
Khách tự xếp combo (lưu trú + trải nghiệm), giá gói động, chia sẻ được. Bản cho SALE dùng làm công cụ **Báo giá**.

**Quyết định đã chốt với user:**
- Vào bằng **cả 3 cách**, cùng đổ về một builder: (a) wizard hỏi nhanh (đi với ai / mấy đêm / thích gì / ngân sách) → dựng sẵn; (b) mở từ **combo mẫu** có sẵn; (c) **tự chọn từ đầu**.
- v1 gồm **đủ 4 cơ chế**: thanh **tiết kiệm sống** + **giảm giá bậc thang**; **link chia sẻ** (mã hoá URL); **chia tiền theo đầu người**; **gợi ý thông minh**.
- Làm **luôn bản SALE** tại `/agent/collections` (tab "Báo giá", hiện là stub 9 dòng).

**Kiến trúc (tránh migration DB — mạng tới Supabase chập chờn):**
- Tách `priceCombo()` dùng chung từ `lib/combos.ts` → curated & custom cùng một logic giá (tránh lệch).
- Trạng thái combo **mã hoá trong URL**: `/combo/tu-thiet-ke?p=<propertyId>&n=<nights>&g=<guests>&perks=pk_bbq:1,pk_kayak:2` → chia sẻ được ngay, không đụng schema.
- Giảm giá bậc thang (hằng số ở `data/combos.ts` để dễ chỉnh): 1 trải nghiệm −5%, 2 −8%, ≥3 −12%.
- Số lượng perk tự nhân theo ngữ cảnh: vé bãi tắm × số khách, bữa sáng × số đêm.
- Gợi ý thông minh v1: đếm **đồng xuất hiện** perk trong `COMBO_DEFS` (perk hay đi cùng nhau / cùng loại căn).
- v2 (sau): lưu combo vào tài khoản → khi đó mới cần bảng `CustomCombo`.

**Chia iteration:**
- ✅ **A** — Builder lõi ĐÃ LÀM (UI theo mockup **A: bảng 2 cột** user chọn): `/combo/tu-thiet-ke` — chọn căn/đêm/khách, tick trải nghiệm, giá sống + thanh tiết kiệm + chia đầu người + gợi ý bậc kế; state trên URL (chia sẻ được); nút vào từ section Combo & `/combo`. Nền tảng: `ComboDiscountTier` (DB) + `lib/combo-pricing.ts` dùng chung + `/api/combo-discounts`.
  - Review 2 tầng đã fix: **High** CTA "Đặt combo" làm mất combo → nay mang `nights/guests/perks` sang trang đặt; clamp URL (n≤30, g≤12, qty≤20, số nguyên), loại perk id lạ, tự sửa `p` sai; tiers lỗi không đánh sập builder; clipboard fallback; a11y (1 nút toggle, aria-label có nghĩa, disabled ở giới hạn); chỉ hiện giá gạch khi thực sự tiết kiệm.
  - **Còn nợ ở A**: 3 lối vào (wizard / mở từ mẫu) chưa làm — chuyển sang B; trang đặt chưa TIÊU THỤ `nights/guests/perks` (mới chỉ truyền sang) → làm ở B/C.
- ✅ **B (phần 1)** — ADMIN CHỈNH BẬC GIẢM GIÁ đã làm: `/admin/settings` (thay stub) — thêm/xoá/bật-tắt/sửa %, trần giảm, xem trước; `/api/admin/combo-discounts` (GET+PUT, chỉ admin, zod, transaction Serializable). Verify end-to-end: admin đổi 8%→15% ⇒ builder đổi giá ngay. Review 2 tầng đã fix: chặn gửi mảng rỗng (xoá sạch bậc), chặn mốc trùng cả client lẫn server, trần `maxDiscountVnd` (BigInt an toàn), key ổn định khi xoá dòng, không nuốt ký tự khi gõ, không cho xoá bậc cuối.
- **B (còn lại)** — link chia sẻ đã có sẵn nhờ state trên URL; còn: 2 lối vào (wizard hỏi nhanh, mở từ combo mẫu) + gợi ý thông minh.
- ⚠️ **PHÁT HIỆN QUAN TRỌNG (reviewer nêu):** `app/api/bookings/route.ts` tính `totalVnd = priceVnd × nights` — **chưa áp perks lẫn bậc giảm giá**. Nghĩa là bậc admin chỉnh mới ảnh hưởng con số HIỂN THỊ ở builder, chưa ảnh hưởng tiền đặt thật. Phải làm ở **C** (booking tiêu thụ combo) thì tính năng mới có tác dụng thương mại.
- **C1 (ƯU TIÊN CAO NHẤT)** — BOOKING TIÊU THỤ COMBO để tiền đặt thật đúng:
  - `prisma`: thêm `Booking.perks Json?` (snapshot [{perkId, qty, priceVnd}]) + migration (DB local, an toàn).
  - `POST /api/bookings`: nhận `perks?: [{perkId, qty}]`; **tính TIỀN Ở SERVER** — nạp giá perk từ DB (không tin client), nạp bậc giảm giá từ `ComboDiscountTier`, dùng `priceCombo()` → `totalVnd = packagePriceVnd`; lưu snapshot perks. Giữ nguyên chặn double-booking.
  - `components/property/property-detail-client.tsx`: đọc `nights/guests/perks` trên URL (builder truyền sang), hiện bảng kê combo (lưu trú + từng trải nghiệm + giảm giá) và gửi `perks` khi đặt.
  - Verify: đặt thử từ builder → `totalVnd` khớp giá gói builder hiển thị.
- **C2** — Bản SALE ở `/agent/collections` (tab "Báo giá"): tái dùng builder, chọn lead, "gửi báo giá" (copy link), tóm tắt gửi khách.
- **C3** — 2 lối vào còn lại của builder: wizard hỏi nhanh (đi với ai/mấy đêm/thích gì/ngân sách) + mở từ combo mẫu; và gợi ý thông minh (đếm đồng xuất hiện perk trong `COMBO_DEFS`).

**Ràng buộc:** i18n vi/en; KHÔNG cắt chữ "..."; mật độ thông tin gọn (chi tiết để ở trang căn); `motion-safe:`; verify tsc + screenshot vi/en; review 2 tầng mỗi vòng.

## 🔴 #7 — Homepage CHƯA ĐỦ MỚI LẠ / GIỮ CHÂN (user báo lại nhiều lần)
Mục tiêu: 5–10 giây đầu phải "wow" + có yếu tố tương tác giữ người xem cuộn tiếp. Ý tưởng (làm dần, mỗi iteration 1–2 mảng):
- **Hero sống động hơn**: giữ layout gọn nhưng thêm chiều sâu — ví dụ scroll-parallax nhẹ trên ảnh, hoặc số liệu/điểm nhấn động (đếm số) ngay dưới search; cân nhắc "search gợi ý" (autocomplete phân khu) để tương tác ngay.
- ✅ (iteration 7) **Bố cục bento** cho "Căn hộ nổi bật": `FeaturedHeroCard` lớn (magazine) + lưới 2×2 + hàng 3 card → phá kiểu 8 card đều. Review 2 tầng: guard khi ít item, DRY helper giá (`lib/property-format.ts` dùng chung PropertyCard), motion-safe hover. (Bỏ qua button-in-Link vì giống PropertyCard sẵn có.)
- **Nhịp xen kẽ**: nền sáng/tối xen kẽ giữa các section (combo đã có `bg-secondary/40`) + divider mềm; reveal/stagger nhất quán.
- **Yếu tố tương tác giữ chân**: dải "đang xem / vừa đặt" (social proof động), hoặc quiz nhỏ "tìm căn hợp gu" → dẫn vào /search với filter.
- **Micro-interactions**: hover card nâng + đổ bóng (đã có ở combo), nút CTA có phản hồi, cursor/entrance tinh tế.
Lưu ý: đo LCP, tôn trọng prefers-reduced-motion.

## 🟠 #1 — Bố cục & nhịp điệu trang (gộp vào #7)
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
