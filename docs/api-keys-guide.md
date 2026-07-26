# 🔑 DOMIX HOME — Toàn bộ API key & biến môi trường (một nơi duy nhất)

> Đây là **nguồn tra cứu duy nhất** cho mọi key/biến môi trường của dự án: cái nào **bắt buộc**
> để chạy, cái nào **tuỳ chọn** để mở thêm tính năng, lấy ở đâu, dán vào đâu.
>
> Thứ tự khuyến nghị: làm xong **Phần A** (bắt buộc) là web chạy đầy đủ. **Phần B** làm dần khi
> muốn bật tính năng nâng cao — thiếu key ở Phần B thì app **tự fallback**, không vỡ.

## 0. Đặt key ở đâu?

| Môi trường | Nơi đặt | Ghi chú |
|---|---|---|
| **Chạy máy bạn (local)** | File `.env` ở gốc dự án (copy từ `.env.example`) | Không commit file `.env` |
| **Chạy thật (production)** | **Vercel → Project → Settings → Environment Variables** | Thêm cho cả *Production* + *Preview*, xong bấm **Redeploy** |

- Biến bắt đầu bằng `NEXT_PUBLIC_` sẽ **lộ ra trình duyệt** → chỉ để dữ liệu công khai và **phải giới hạn theo domain**.
- Các biến còn lại chỉ chạy phía server → **giữ bí mật tuyệt đối** (không đưa lên client, không commit).

---

# Phần A — BẮT BUỘC để web chạy (đã nối sẵn trong code)

## A1. Supabase — Cơ sở dữ liệu + Lưu trữ ảnh
Một dự án Supabase cấp cả **Postgres** (dữ liệu) lẫn **Storage** (ảnh). Lấy 1 lần, dùng cho 4 biến.

**Các bước:**
1. Vào **supabase.com** → *New project*. Chọn region **Southeast Asia (Singapore)** cho gần VN. Đặt mật khẩu DB và **lưu lại** (dùng cho `DATABASE_URL`).
2. **Connection strings** — vào *Project → Settings → Database → Connection string*:
   - `DATABASE_URL`: dùng chuỗi **Session pooler** (host `aws-0-...pooler.supabase.com`, cổng `5432`) — có IPv4, hợp với migrate/serverless.
   - `DIRECT_URL`: đặt **giống `DATABASE_URL`** (cùng chuỗi pooler) là chạy được. (Chuỗi "direct" `db.<ref>.supabase.co` hiện chỉ có IPv6 nên hay không kết nối được từ mạng thường.)
3. **API keys** — vào *Project → Settings → API*:
   - `SUPABASE_URL`: mục *Project URL* (dạng `https://<ref>.supabase.co`).
   - `SUPABASE_SERVICE_ROLE_KEY`: mục *Project API keys → `service_role`* (**bí mật**, toàn quyền — chỉ dùng ở server).
4. **Tạo bucket ảnh** — vào *Storage → New bucket*: tên **`property-images`**, đặt **Public**. (Đúng tên này vì code đọc cố định `property-images`.)

```
DATABASE_URL="postgresql://postgres.<ref>:<mật-khẩu>@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
DIRECT_URL="postgresql://postgres.<ref>:<mật-khẩu>@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
SUPABASE_URL="https://<ref>.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOi...(service_role)"
```
> Sau khi có DB, chạy migrate: `pnpm exec prisma migrate deploy` (và `pnpm db:seed` **chỉ cho DB mới/trống** — KHÔNG seed lên DB thật đang có dữ liệu vì sẽ xoá review/ảnh thật).

## A2. JWT_SECRET — Ký token đăng nhập
Chuỗi ngẫu nhiên dài để ký cookie đăng nhập. **Tự sinh**, không phải đi xin ở đâu.

```bash
# tạo một chuỗi ngẫu nhiên 64 byte:
openssl rand -base64 48
```
Dán kết quả vào:
```
JWT_SECRET="<chuỗi-ngẫu-nhiên-vừa-tạo>"
```
> ⚠️ Code có giá trị mặc định `dev-secret-...` cho tiện chạy local, **nhưng production BẮT BUỘC đặt giá trị thật** — nếu không ai cũng giả được phiên đăng nhập.

## A3. NEXT_PUBLIC_SITE_URL — Địa chỉ web thật
Dùng cho metadata/SEO (thẻ Open Graph, canonical). Không cần đăng ký.
```
NEXT_PUBLIC_SITE_URL="https://homix-seven.vercel.app"   # đổi thành domain thật nếu có
```

---

# Phần B — TUỲ CHỌN (mở thêm tính năng; thiếu thì app tự fallback)

## B1. Google Maps — bản đồ tương tác thật
**Biến:** `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

1. **console.cloud.google.com** → tạo project.
2. *APIs & Services → Library* → bật: **Maps JavaScript API** (bắt buộc), **Places API** (autocomplete địa chỉ — tuỳ chọn), **Geocoding API** (địa chỉ ↔ toạ độ — tuỳ chọn).
3. *Credentials → Create credentials → API key*.
4. Bấm key → **Restrict key**: *Application restrictions* = **HTTP referrers** → thêm `homix-seven.vercel.app/*` và `localhost:3000/*`; *API restrictions* = chỉ 3 API trên.
5. *Billing*: phải gắn thẻ, nhưng có **~$200 tín dụng miễn phí/tháng** — dư cho lượng nhỏ.

→ **Thiếu key:** giữ bản đồ maplibre hiện tại (không lỗi).

## B2. Blog / thu thập tin BĐS bằng AI
**Biến:** `ANTHROPIC_API_KEY` (+ `BLOG_RSS_FEEDS` tuỳ chọn)

- **Nguồn tin (miễn phí, không cần key):** dùng **RSS feed** báo BĐS (cafeland, cafef mục BĐS…). Đặt danh sách URL vào `BLOG_RSS_FEEDS` (ngăn bằng dấu phẩy). Hợp pháp & rẻ hơn scrape HTML thô.
- **AI tóm tắt/viết lại:** cần **Anthropic Claude key**:
  1. **console.anthropic.com** → *Settings → API Keys → Create Key* (dạng `sk-ant-...`).
  2. Nạp credit ở *Billing* (trả theo token, không phí cố định).
  3. **Model:** mặc định `claude-opus-5`; để tóm tắt số lượng lớn thì **`claude-haiku-4-5`** rẻ hơn nhiều ($1/$5 mỗi triệu token) mà vẫn tốt.

→ **Thiếu key:** blog dùng bài seed thủ công (không tự thu thập).
⚠️ Bản quyền: chỉ **tóm tắt + dẫn nguồn**, không đăng lại nguyên văn.

## B3. Email & SMS xác nhận đặt chỗ
**Biến:** `RESEND_API_KEY` (email) · `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN` + `TWILIO_FROM` (SMS)

- **Email — Resend** (có gói free): **resend.com** → *API Keys* → tạo key; xác minh domain gửi (hoặc dùng domain test của Resend). (SendGrid là lựa chọn thay thế.)
- **SMS — Twilio**: **twilio.com/console** → lấy *Account SID* + *Auth Token*, mua 1 số gửi (`TWILIO_FROM`).

→ **Thiếu key:** luồng đặt chỗ hiện **mô phỏng** ("email & SMS sẽ gửi ở bản chính thức"), không gửi thật.

## B4. Thanh toán thật (làm sau khi demo ổn)
**Biến (VNPay):** `VNPAY_TMN_CODE` + `VNPAY_HASH_SECRET` + `VNPAY_RETURN_URL`

- **VNPay:** đăng ký merchant ở **vnpay.vn** → nhận `TmnCode` + `HashSecret` (chạy **sandbox** trước).
- **MoMo:** đăng ký ở **business.momo.vn** → `partnerCode` + `accessKey` + `secretKey`.

→ **Hiện tại:** thanh toán là **demo, không trừ tiền thật**. Chỉ nối cổng thật khi bạn sẵn sàng (cần pháp lý + tài khoản doanh nghiệp).

---

# 📋 Bảng tổng hợp

| Biến | Phần | Bắt buộc? | Lấy ở đâu | Thiếu thì sao |
|---|---|---|---|---|
| `DATABASE_URL` | A1 | ✅ | Supabase → Database → pooler | Web không có dữ liệu |
| `DIRECT_URL` | A1 | ✅ | = DATABASE_URL (pooler) | migrate lỗi |
| `SUPABASE_URL` | A1 | ✅ | Supabase → Settings → API | Không tải được ảnh |
| `SUPABASE_SERVICE_ROLE_KEY` | A1 | ✅ | Supabase → Settings → API (service_role) | Không tải được ảnh |
| `JWT_SECRET` | A2 | ✅ | `openssl rand -base64 48` | Phiên đăng nhập không an toàn |
| `NEXT_PUBLIC_SITE_URL` | A3 | ✅ | Domain của bạn | SEO/OG sai link |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | B1 | ⬜ | Google Cloud Console | Giữ maplibre |
| `ANTHROPIC_API_KEY` | B2 | ⬜ | console.anthropic.com | Blog dùng bài seed |
| `BLOG_RSS_FEEDS` | B2 | ⬜ | URL RSS báo BĐS | — |
| `RESEND_API_KEY` | B3 | ⬜ | resend.com | Email chỉ mô phỏng |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_FROM` | B3 | ⬜ | twilio.com/console | SMS chỉ mô phỏng |
| `VNPAY_TMN_CODE` / `VNPAY_HASH_SECRET` / `VNPAY_RETURN_URL` | B4 | ⬜ | vnpay.vn (hoặc MoMo) | Thanh toán demo |

# 🧩 Mẫu `.env` để điền
```dotenv
# --- Phần A: BẮT BUỘC ---
DATABASE_URL=
DIRECT_URL=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
JWT_SECRET=
NEXT_PUBLIC_SITE_URL=https://homix-seven.vercel.app

# --- Phần B: TUỲ CHỌN (bật khi cần) ---
# NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
# ANTHROPIC_API_KEY=
# BLOG_RSS_FEEDS=
# RESEND_API_KEY=
# TWILIO_ACCOUNT_SID=
# TWILIO_AUTH_TOKEN=
# TWILIO_FROM=
# VNPAY_TMN_CODE=
# VNPAY_HASH_SECRET=
# VNPAY_RETURN_URL=
```
