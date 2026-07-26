# DOMIX HOME — Phase tính năng (loop)

Nguồn: yêu cầu user (danh sách feature) + logo mới DOMIX HOME. Mỗi iteration:
plan → code → review 2 tầng (subagent + Codex) → fix → verify (tsc + build + screenshot) → commit.

Ràng buộc: i18n vi/en; không cắt chữ "..."; thanh toán **demo (không tiền thật)**;
Maps/blog đọc key từ env, thiếu key thì fallback; đăng nhập vẫn là mock demo.

## Trạng thái
- ✅ **1. Rebrand DOMIX HOME** — tên + logo (D+mũi tên+mái nhà) + tone xanh dương, favicon. Build sạch, parity 480, AA.
- ✅ **2a. Bộ lọc nâng cao + sort** — panel modal (giá/diện tích/phòng tắm/tiện ích) + sort "đánh giá cao nhất". Review 2 tầng đã fix (param rác không sập trang, focus-trap, draft ref).
- ☐ **2b. Hướng nhà + khoảng cách tới trung tâm** — cần migration (Property.orientation) + toạ độ tháp.
- ✅ **3. Review có ảnh** — sao + bình luận + ảnh khách tự chụp (≤6/24MB). Gate "khách đã đặt" chống spam; 1 review/căn (upsert unique atomic); sniff magic-byte; dọn orphan; trả property đồng bộ ratingAvg. Migration prod đã deploy (review_images + review_unique). Review 2 tầng đã fix: unique race (HIGH), booking gate (HIGH), orphan/leak/MIME/round (MEDIUM).
- ✅ **4. Khan hiếm / hoạt động gần đây** — badge "N lượt xem" (Property.viewCount, tăng qua POST /view, throttle IP+căn 30' + chặn phình Map) & "N lượt đặt gần đây" (đếm booking approved/completed 30 ngày, có composite index). Dữ liệu THẬT, không bịa "N người đang xem". Review 2 tầng (Codex) đã fix: pending→chỉ approved/completed, index (propertyId,createdAt), evict Map, chỉ khoá cửa sổ khi DB tăng thật.
- ✅ **5. Chatbox / hỗ trợ 24/7** — widget nổi (ẩn ở portal/login): FAQ accordion + form tạo Lead cho sale; rate-limit + honeypot; a11y (focus, aria-label, Escape, click-ngoài). Review 2 tầng đã fix (spam, z-index gallery, silent-loss→503, try/catch).
- ✅ **6. Luồng đặt + thanh toán demo** — checkout nhiều bước: xác nhận (+ chính sách huỷ theo loại) → chọn phương thức (thẻ/ví/CK/tại chỗ) → biên nhận demo (mã DMX, tổng SERVER chốt). Copy trung thực (không claim gửi email thật). Review 2 tầng đã fix: submit-lock (HIGH), a11y modal Escape/focus-trap/scroll-lock (HIGH), tổng từ server, ngày theo locale, reset khi đóng.
- ✅ **7. Yêu thích / lưu tin** — đã có (Slice 1); rà soát OK.
- ⏸ **8. Google Maps thật** — chờ `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (user sẽ lấy); thiếu → giữ maplibre.
- ⏸ **9. Blog/tin BĐS + AI thu thập** — chờ `ANTHROPIC_API_KEY` + RSS; thiếu → seed thủ công.
- ☐ **2b. Hướng nhà + khoảng cách tới trung tâm** — gắn với tích hợp Maps (làm cùng #8 để có geocode/khoảng cách thật thay vì bịa số).

## Rà soát UI/UX bằng skill ui-ux-pro-max (2026-07-26) — xem docs/ui-ux-audit.md
- ✅ Sửa: FAB chat đè CTA "đặt lịch" ở mobile; badge "Đã xác minh" bị cắt; giá tabular-nums.
- ✅ Perf: nạp lười bản đồ masterplan (maplibre) theo IntersectionObserver (tile external lúc tải đầu 11→0).
- ✅ A11y: chữ phụ light-mode #86868b (3.6:1, trượt AA) → #6f6f74 (5.0:1); min-h-dvh cho màn full-viewport.
- ✅ Bug sweep: home/search/detail/login/combo — không lỗi console; 404 duy nhất là tile map external (vô hại).
- ✅ API key: gộp tất cả vào docs/api-keys-guide.md (Phần A bắt buộc + Phần B tuỳ chọn + bảng + mẫu .env).

## Key cần (đã gửi user)
- Google Maps: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (Maps JS + Places + Geocoding, restrict referrer).
- AI blog: `ANTHROPIC_API_KEY` + nguồn RSS.
- Email/SMS xác nhận: Resend/SendGrid + Twilio (demo mô phỏng trước).
- Thanh toán thật (VNPay/MoMo): merchant key — làm sau khi demo ok.
