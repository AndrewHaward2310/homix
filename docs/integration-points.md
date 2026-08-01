# Điểm tích hợp API — "có key thì bật"

Khi bạn lấy được key (xem [api-keys-guide.md](./api-keys-guide.md)), đây là **đúng chỗ cần sửa**
để bật tính năng thật. Cờ bật/tắt tập trung ở [`lib/features.ts`](../lib/features.ts) — mọi nơi
gọi cờ này, thiếu key thì tự fallback, không crash.

| Tính năng | Cờ (`lib/features.ts`) | Key | Điểm cắm code khi có key | Fallback hiện tại |
|---|---|---|---|---|
| **Google Maps thật** | `isGoogleMapsEnabled()` / `googleMapsKey` | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | `components/home/masterplan/masterplan-locator.tsx` (đổi nguồn tile/SDK sang Google khi cờ bật); `components/property/property-location.tsx` | maplibre-gl (đang chạy tốt) |
| **AI blog / tin BĐS** | `isAnthropicEnabled()` + `blogRssFeeds()` | `ANTHROPIC_API_KEY`, `BLOG_RSS_FEEDS` | Tạo `app/api/blog/route.ts` (đọc RSS → tóm tắt bằng Claude) + trang `/blog`; dùng SDK `@anthropic-ai/sdk`, model mặc định `claude-opus-5` hoặc `claude-haiku-4-5` cho tóm tắt số lượng lớn | Bài seed thủ công |
| **Email xác nhận** | `isEmailEnabled()` | `RESEND_API_KEY` | Trong `app/api/bookings/route.ts` (POST) sau khi tạo booking: nếu bật → gửi email Resend | Copy demo "sẽ gửi ở bản chính thức" |
| **SMS xác nhận** | `isSmsEnabled()` | `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN` + `TWILIO_FROM` | Cùng chỗ với email (Twilio REST) | Như trên |
| **Thanh toán thật** | `isPaymentEnabled()` | `VNPAY_TMN_CODE` + `VNPAY_HASH_SECRET` (+ `VNPAY_RETURN_URL`) | `components/property/booking-card.tsx` bước "payment" → gọi route mới `app/api/payments/vnpay/route.ts` tạo URL thanh toán; xử lý callback | Biên nhận demo (không trừ tiền) |

## Nguyên tắc khi cắm
1. **Luôn kiểm cờ trước** (`if (!isEmailEnabled()) return ...fallback`). Không giả định key tồn tại.
2. Key `NEXT_PUBLIC_*` mới đọc được ở client; còn lại **chỉ dùng trong route handler/server component**.
3. Thêm test cho nhánh bật/tắt (mẫu: [`tests/features.test.ts`](../tests/features.test.ts)).
4. Sau khi thêm key trên Vercel → **Redeploy** mới có hiệu lực.
