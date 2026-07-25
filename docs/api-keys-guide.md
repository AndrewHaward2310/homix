# Hướng dẫn lấy API key (DOMIX HOME)

Tất cả key đặt ở **Vercel → Project Settings → Environment Variables** (Production + Preview).
Sau khi thêm/sửa key phải **Redeploy** để có hiệu lực. Key `NEXT_PUBLIC_*` lộ ra client
(bắt buộc giới hạn theo domain); các key khác chỉ dùng phía server, giữ bí mật.

---

## 1. Google Maps — bản đồ tương tác thật
**Biến:** `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

1. Vào **console.cloud.google.com** → tạo project (hoặc chọn project sẵn có).
2. **APIs & Services → Library** → bật 3 API:
   - *Maps JavaScript API* (hiển thị bản đồ) — bắt buộc.
   - *Places API* (gợi ý địa chỉ khi gõ) — nếu muốn autocomplete.
   - *Geocoding API* (địa chỉ ↔ toạ độ) — nếu muốn tra toạ độ.
3. **APIs & Services → Credentials → Create credentials → API key**.
4. Bấm vào key vừa tạo → **Restrict key**:
   - *Application restrictions*: **HTTP referrers** → thêm `homix-seven.vercel.app/*`, `localhost:3000/*`.
   - *API restrictions*: chỉ chọn 3 API ở bước 2.
5. **Billing:** phải gắn thẻ (Google → Billing), nhưng có **$200 tín dụng miễn phí/tháng** — thừa cho lượng truy cập nhỏ.

→ Thiếu key: app tự giữ bản đồ maplibre hiện tại (không lỗi).

---

## 2. Blog / thu thập tin BĐS bằng AI
**Biến:** `ANTHROPIC_API_KEY` (+ `BLOG_RSS_FEEDS` tuỳ chọn)

Hai phần:
- **Nguồn tin (miễn phí):** dùng **RSS feed** của báo BĐS (cafeland, batdongsan, cafef mục BĐS…). Không cần key. Đặt danh sách feed vào `BLOG_RSS_FEEDS` (các URL ngăn bởi dấu phẩy). Đây là cách rẻ & hợp pháp nhất; tránh scrape thô HTML.
- **AI tóm tắt/viết lại:** cần **Anthropic Claude API key**.
  1. Vào **console.anthropic.com** → **Settings → API Keys → Create Key**.
  2. Nạp credit ở **Billing** (trả theo lượng token dùng, không phí cố định).
  3. Copy key (dạng `sk-ant-...`), đặt vào `ANTHROPIC_API_KEY`.
  - **Chọn model:** mặc định tốt nhất `claude-opus-5`. Cho tóm tắt tin số lượng lớn,
    **`claude-haiku-4-5`** rẻ hơn nhiều ($1 / $5 mỗi triệu token) mà vẫn tốt cho tóm tắt.
    Bạn quyết theo ngân sách.

→ Thiếu key: blog dùng bài seed thủ công (không tự thu thập).
⚠️ Bản quyền: chỉ **tóm tắt + trích dẫn nguồn**, không đăng lại nguyên văn.

---

## 3. Email & SMS xác nhận đặt chỗ
**Biến:** `RESEND_API_KEY` (email) · `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN` + `TWILIO_FROM` (SMS)

- **Email — Resend** (đơn giản, có gói free): **resend.com** → API Keys → tạo key. Cần xác minh domain gửi (hoặc dùng domain test của Resend). (SendGrid là lựa chọn thay thế.)
- **SMS — Twilio**: **twilio.com/console** → lấy Account SID + Auth Token, mua 1 số gửi (`TWILIO_FROM`).

→ Thiếu key: bản demo hiện tại chỉ **mô phỏng** ("email & SMS sẽ được gửi ở bản chính thức"),
không gửi thật. Có key thì nối để gửi thật.

---

## 4. Thanh toán thật (làm sau khi demo ok)
**Biến (ví dụ VNPay):** `VNPAY_TMN_CODE` + `VNPAY_HASH_SECRET` + `VNPAY_RETURN_URL`

- **VNPay:** đăng ký merchant ở **vnpay.vn** → nhận `TmnCode` + `HashSecret` (môi trường sandbox trước).
- **MoMo:** đăng ký ở **business.momo.vn** → `partnerCode` + `accessKey` + `secretKey`.

→ Hiện tại: thanh toán là **demo, không trừ tiền thật**. Chỉ nối cổng thật khi bạn sẵn sàng
(cần pháp lý + tài khoản doanh nghiệp).

---

## Tóm tắt biến môi trường
| Biến | Bắt buộc? | Dùng cho |
|---|---|---|
| `DATABASE_URL`, `DIRECT_URL` | ✅ đã có | Postgres (Supabase) |
| `JWT_SECRET` | ✅ đã có | Đăng nhập |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | ✅ đã có | Tải/thay ảnh |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | tuỳ chọn | Google Maps thật |
| `ANTHROPIC_API_KEY`, `BLOG_RSS_FEEDS` | tuỳ chọn | Blog AI |
| `RESEND_API_KEY`, `TWILIO_*` | tuỳ chọn | Email/SMS thật |
| `VNPAY_*` / MoMo | sau này | Thanh toán thật |
