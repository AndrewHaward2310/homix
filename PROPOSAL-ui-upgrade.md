# Đề xuất nâng cấp UI HOMIX — chuyên nghiệp · hiện đại · giữ chân người dùng

Bản nháp của Claude để Codex phản biện/bổ sung. Mục tiêu: nâng chất cảm nhận (perceived quality) + tăng gắn kết/giữ chân, KHÔNG đập đi làm lại — tận dụng nền đã có (Plus Jakarta Sans, brand ocean, PortalShell, map thật, property/search).

## A. Kỷ luật hệ thống thị giác (nền tảng của "chuyên nghiệp")
1. **Thang elevation & bo góc nhất quán**: hiện đang trộn `rounded-xl/2xl/3xl` + nhiều shadow. Chuẩn hoá 3 mức elevation (card / floating / modal) + 2 radius (control 12px, surface 20px). Áp token, bỏ shadow ad-hoc.
2. **Tiết chế glass + brand**: glass chỉ cho overlay trên ảnh/map; nền nội dung dùng trung tính. Brand `#0B5C63` chỉ cho CTA/nhấn — tránh "xanh khắp nơi".
3. **Nhịp khoảng cách (spacing scale)**: thống nhất section padding, gap lưới, giữa tiêu đề–nội dung. Tạo cảm giác "một hệ thống".
4. **Dark mode thật**: tokens đã có biến CSS — bật `data-theme=dark`, thêm toggle. Nhiều user duyệt BĐS buổi tối.

## B. "Khoảnh khắc chữ ký" (signature moments tạo wow + nhớ thương hiệu)
1. **Property gallery**: chuyển sang lightbox vuốt mượt (embla) + zoom, thumbnails, phím tắt; ảnh có **blur-up LQIP**. Đây là màn quyết định cảm nhận.
2. **Map ↔ list**: đồng bộ hover 2 chiều tinh tế hơn (marker "nảy" nhẹ, card sáng lên), cluster giá, "search khi di chuyển bản đồ" (search-as-you-move).
3. **Booking card**: chuyển giá/tổng bằng **animated number**, calendar có transition; nút CTA có trạng thái loading gọn.
4. **Hero**: giữ Ken Burns nhẹ; thêm 1 dòng value-prop ngắn + social proof ("4.9★ · 1.200+ lượt đặt").

## C. Cơ chế GIỮ CHÂN (engagement/retention) — phần tạo khác biệt
1. **Recently viewed** (căn vừa xem) — lưu localStorage, hiện ở trang chủ + /search.
2. **Wishlist "Bộ sưu tập"**: cho phép gom yêu thích thành nhóm (Nghỉ dưỡng, Đầu tư…) — tăng quay lại.
3. **Saved search + cảnh báo**: badge "căn mới / giảm giá" (mock realtime) → lý do quay lại.
4. **Social proof & urgency tinh tế**: "3 người đang xem", "đặt 2 lần tuần này", "còn 2 ngày trống" — chỉ khi thật, tránh giả tạo.
5. **Progress hồ sơ / eKYC**: thanh tiến độ hoàn thiện hồ sơ (gamified nhẹ) mở khoá ưu đãi.
6. **So sánh căn**: khay so sánh nổi ở đáy, so 2–3 căn cạnh nhau.
7. **Onboarding lần đầu**: 3 bước chọn nhu cầu (thuê/mua/lưu trú, ngân sách, khu) → cá nhân hoá trang chủ.

## D. Nội dung & hình ảnh (quyết định "cao cấp")
1. **Ảnh đồng bộ tỉ lệ + LQIP + placeholder cao cấp** khi thiếu ảnh (không để ô xám trơ).
2. **Empty/skeleton có gu**: skeleton khớp layout thật; empty state có minh hoạ + CTA rõ.
3. **Copywriting**: rút gọn, giọng tự tin; nhãn tiếng Việt thống nhất.

## E. Ngôn ngữ chuyển động (motion) — hiện đại mà không rối
1. **Reveal khi cuộn** (đã có) áp nhất quán mọi section; stagger cho lưới card.
2. **Chuyển trang mượt** (View Transitions API cho detail↔list), giữ vị trí ảnh (shared element).
3. **Micro-interaction**: heart ♥ nảy, toast xác nhận, ripple nút, tab underline chạy.
4. Luôn tôn trọng `prefers-reduced-motion`.

## F. Tin cậy & chuyển đổi (trust → conversion)
1. Nổi bật **verified**, rating, số review, "phản hồi trong 1 giờ".
2. **Giá minh bạch**: tách phí/cọc rõ ngay từ card; "không phí ẩn".
3. **Thanh CTA dính** ở detail (đã có) + tín hiệu tin cậy cạnh CTA.

## G. Hiệu năng & tiếp cận (giữ nhanh, ai cũng dùng được)
1. LCP: hero ảnh priority + preload; lazy map/chart/kanban.
2. A11y: focus ring rõ, tương phản ≥4.5:1, keyboard cho modal/kanban.
3. SEO: metadata + OG theo locale cho `/`, `/search`, `/property/[id]`.

## Ưu tiên đề xuất (theo tác động/chi phí)
- **Đợt 1 (impact cao, rẻ)**: chuẩn hoá elevation/spacing tokens, dark mode, LQIP + gallery embla, animated numbers, recently viewed, verified/rating prominence.
- **Đợt 2**: saved-search alerts, wishlist collections, so sánh căn, search-as-you-move, page transitions.
- **Đợt 3**: onboarding cá nhân hoá, social proof realtime, profile progress.

## ✅ TỔNG HỢP SAU THẢO LUẬN VỚI CODEX (bản chốt để trình chủ dự án)

**Codex đính chính hiện trạng (tránh làm lại thứ đã có):**
- Gallery ĐÃ có lightbox + phím; còn thiếu **swipe/zoom/thumbnail/focus-trap/preload**.
- Booking ĐÃ có loading; map↔list ĐÃ đồng bộ hover. → tập trung nâng cấp, không dựng lại.
- **Đừng áp Reveal cho MỌI section** (chậm cảm nhận, đơn điệu) — chỉ dùng có chọn lọc.
- **Giữ attribution MapLibre/nguồn bản đồ** (hiện đang tắt `attributionControl` — cần bật lại cho đúng điều khoản).
- Dark mode cho MAP cần **style tile riêng**, không đổi bằng CSS.

**Đồng thuận mạnh (nên làm) — "1 đợt, 5 việc impact cao nhất":**
1. **Chuẩn hoá UI toàn funnel**: token elevation/radius/spacing; bỏ `rounded-3xl` + shadow ad-hoc; đủ state focus/error/loading/empty **khớp layout thật**.
2. **Nâng gallery quyết định mua**: swipe + thumbnail + zoom + **LQIP blur-up** + focus-trap + preload ảnh kế; nút "Tour ảo" chỉ mở khi có tour thật.
3. **Recently viewed + Saved (local-first)**: không bắt đăng nhập; đăng nhập rồi thì đồng bộ.
4. **Trust & minh bạch giá cạnh CTA**: tổng phí/cọc/chính sách huỷ, verified, số review, "phản hồi trong 1 giờ".
5. **Tối ưu search↔map**: cluster giá + trạng thái selected rõ + **giữ scroll/filter khi quay lại** + search-as-you-move (debounce + công tắc + giữ viewport).

**Ý tưởng khác biệt (đợt sau, tạo lợi thế giữ chân):**
- **Shortlist chia sẻ được**: gửi link 3–5 căn cho gia đình/môi giới, có ghi chú + bình chọn.
- **"Vì sao căn này hợp"**: giải thích theo filter/ngân sách (không hộp đen).
- **Lịch sử giá + ngày cập nhật tin** (tăng niềm tin).
- **Checklist vị trí thực dụng**: thời gian tới trường/bệnh viện/nơi làm bằng route trên map.
- **Dark mode** (UI, không map) + **collections/compare/onboarding**: làm sau khi đo nhu cầu.

**⛔ Dark-pattern PHẢI tránh:** urgency/"đang xem"/giảm giá giả; giá headline giấu phí; preselect add-on/opt-in marketing; countdown tự reset; bắt đăng nhập mới được xem/lưu/so sánh; thông báo mặc định quá dày.

**Nên đo (để biết upgrade có hiệu quả):** funnel search→detail, độ sâu gallery, tỉ lệ save, booking-start, return rate.

---

## Câu hỏi cho Codex (đã trả lời ở trên)
1. Đâu là 5 thay đổi impact cao nhất cho "chuyên nghiệp + giữ chân" nếu chỉ làm 1 đợt?
2. Rủi ro kỹ thuật/UX của: View Transitions, search-as-you-move, animated numbers, dark mode trên map.
3. Cơ chế giữ chân nào dễ phản tác dụng (dark pattern) cần tránh?
4. Bổ sung ý tưởng khác biệt mà bản nháp bỏ sót?
