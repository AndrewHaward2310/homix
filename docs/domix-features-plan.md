# DOMIX HOME — Phase tính năng (loop)

Nguồn: yêu cầu user (danh sách feature) + logo mới DOMIX HOME. Mỗi iteration:
plan → code → review 2 tầng (subagent + Codex) → fix → verify (tsc + build + screenshot) → commit.

Ràng buộc: i18n vi/en; không cắt chữ "..."; thanh toán **demo (không tiền thật)**;
Maps/blog đọc key từ env, thiếu key thì fallback; đăng nhập vẫn là mock demo.

## Trạng thái
- ✅ **1. Rebrand DOMIX HOME** — tên + logo (D+mũi tên+mái nhà) + tone xanh dương, favicon. Build sạch, parity 480, AA.
- ⏳ **2. Bộ lọc nâng cao + sắp xếp** — beds, diện tích, hướng nhà, tiện ích (hồ bơi/gym/đỗ xe…), khoảng cách tới trung tâm; sort thêm "đánh giá cao nhất".
- ☐ **3. Review có ảnh** — sao + bình luận + ảnh khách tự chụp (migration: Review.images).
- ☐ **4. Khan hiếm / hoạt động gần đây** — lượt xem, "N người vừa xem/đặt" (dữ liệu thật).
- ☐ **5. Chatbox / hỗ trợ 24/7** — widget nổi: FAQ bot luật + form liên hệ (AI sau khi có key).
- ☐ **6. Luồng đặt + thanh toán demo** — chọn→xác nhận→thanh toán→email/hoá đơn; phương thức (thẻ/ví/CK/trả góp/tại chỗ); chính sách huỷ theo loại; hoá đơn điện tử.
- ☐ **7. Yêu thích / lưu tin** — đã có (Slice 1); rà soát & polish.
- ☐ **8. Google Maps thật** — `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`; thiếu → giữ maplibre.
- ☐ **9. Blog/tin BĐS + AI thu thập** — RSS + LLM (`ANTHROPIC_API_KEY`); thiếu → seed thủ công.

## Key cần (đã gửi user)
- Google Maps: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (Maps JS + Places + Geocoding, restrict referrer).
- AI blog: `ANTHROPIC_API_KEY` + nguồn RSS.
- Email/SMS xác nhận: Resend/SendGrid + Twilio (demo mô phỏng trước).
- Thanh toán thật (VNPay/MoMo): merchant key — làm sau khi demo ok.
