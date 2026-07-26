# 🔑 DOMIX HOME — Toàn bộ API key & biến môi trường (một nơi duy nhất)

> **Nguồn tra cứu duy nhất** cho mọi key/biến môi trường: cái nào **bắt buộc**, cái nào **tuỳ chọn**,
> lấy ở đâu (bấm thẳng link), dán vào đâu. Thiếu key Phần B thì app **tự fallback**, không vỡ.

## 📊 Trạng thái hiện tại (quét ngày 2026-07-26)

| Key | Local `.env` | Production (Vercel) | Ghi chú |
|---|---|---|---|
| `DATABASE_URL` | ✅ đã có | ✅ đang chạy | Supabase pooler |
| `DIRECT_URL` | ✅ đã có | ✅ đang chạy | migrate deploy OK trong phiên này |
| `SUPABASE_URL` | ✅ đã có | ✅ đang chạy | ảnh tải được |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ đã có | ✅ đang chạy | ảnh tải được |
| `JWT_SECRET` | ✅ đã có | ✅ đang chạy | đăng nhập prod hoạt động |
| `NEXT_PUBLIC_SITE_URL` | ⬜ chưa | ❓ nên kiểm tra | thiếu chỉ ảnh hưởng SEO/OG (fallback localhost) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | ⬜ chưa | ⬜ chưa | → cần lấy (Phần B1) |
| `ANTHROPIC_API_KEY` | ⬜ chưa | ⬜ chưa | → cần lấy (Phần B2) |
| `BLOG_RSS_FEEDS` | ⬜ chưa | ⬜ chưa | → cần điền (Phần B2) |
| `RESEND_API_KEY` | ⬜ chưa | ⬜ chưa | → cần lấy (Phần B3) |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_FROM` | ⬜ chưa | ⬜ chưa | → cần lấy (Phần B3) |
| `VNPAY_TMN_CODE` / `VNPAY_HASH_SECRET` / `VNPAY_RETURN_URL` | ⬜ chưa | ⬜ chưa | → cần lấy sau (Phần B4) |

**Tóm gọn:** ✅ **Phần A gần như xong** (DB + Storage + đăng nhập đều chạy prod) — chỉ nên thêm
`NEXT_PUBLIC_SITE_URL` trên Vercel. ⬜ **Toàn bộ Phần B chưa có** — lấy khi muốn bật tính năng.

> Chỗ đặt key production: **[Vercel → Project → Settings → Environment Variables](https://vercel.com/dashboard)**
> (thêm cho Production + Preview → **Redeploy**). Biến `NEXT_PUBLIC_*` lộ ra client → phải giới hạn theo domain; còn lại giữ bí mật.

---

# Phần A — BẮT BUỘC để web chạy (đã nối sẵn)

## A1. Supabase — Database + Lưu trữ ảnh ✅ (đã cấu hình)
Mở dashboard dự án của bạn: **[supabase.com/dashboard](https://supabase.com/dashboard/projects)**

Nếu phải làm lại từ đầu / dự án mới:
1. **[Tạo project mới →](https://supabase.com/dashboard/new)** — region **Southeast Asia (Singapore)**, lưu lại mật khẩu DB.
2. **Connection strings** → **[Settings → Database →](https://supabase.com/dashboard/project/_/settings/database)** lấy chuỗi **Session pooler** (host `aws-0-...pooler.supabase.com`, cổng `5432`). Đặt **cùng chuỗi này** cho cả `DATABASE_URL` và `DIRECT_URL`.
3. **API keys** → **[Settings → API →](https://supabase.com/dashboard/project/_/settings/api)** lấy *Project URL* (`SUPABASE_URL`) và khoá `service_role` (`SUPABASE_SERVICE_ROLE_KEY`, **bí mật**).
4. **Bucket ảnh** → **[Storage →](https://supabase.com/dashboard/project/_/storage/buckets)** tạo bucket **`property-images`** để **Public** (đúng tên này).

```
DATABASE_URL="postgresql://postgres.<ref>:<mật-khẩu>@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
DIRECT_URL="postgresql://postgres.<ref>:<mật-khẩu>@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
SUPABASE_URL="https://<ref>.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOi...(service_role)"
```
> DB mới thì chạy `pnpm exec prisma migrate deploy`. **Đừng** `pnpm db:seed` lên DB thật đang có dữ liệu (xoá review/ảnh thật).

## A2. JWT_SECRET ✅ (đã cấu hình) — tự sinh, không đi xin
```bash
openssl rand -base64 48
```
```
JWT_SECRET="<chuỗi-ngẫu-nhiên-vừa-tạo>"
```
> ⚠️ Production **phải** đặt giá trị thật (không để mặc định `dev-secret-...`).

## A3. NEXT_PUBLIC_SITE_URL ⬜ (nên thêm trên Vercel) — không cần đăng ký
```
NEXT_PUBLIC_SITE_URL="https://homix-seven.vercel.app"   # đổi thành domain thật nếu có
```

---

# Phần B — TUỲ CHỌN (mở thêm tính năng; thiếu thì fallback)

## B1. Google Maps — bản đồ tương tác thật ⬜
**Biến:** `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` · Bấm thẳng:

1. **[Google Cloud Console →](https://console.cloud.google.com/)** tạo/chọn project.
2. Bật API (bấm **Enable** ở từng link):
   - **[Maps JavaScript API →](https://console.cloud.google.com/apis/library/maps-backend.googleapis.com)** (bắt buộc)
   - **[Places API →](https://console.cloud.google.com/apis/library/places-backend.googleapis.com)** (autocomplete địa chỉ — tuỳ chọn)
   - **[Geocoding API →](https://console.cloud.google.com/apis/library/geocoding-backend.googleapis.com)** (địa chỉ ↔ toạ độ — tuỳ chọn)
3. **[Credentials → Create API key →](https://console.cloud.google.com/apis/credentials)** rồi bấm key → **Restrict**: *HTTP referrers* thêm `homix-seven.vercel.app/*`, `localhost:3000/*`; *API restrictions* chọn 3 API trên.
4. **[Billing →](https://console.cloud.google.com/billing)** gắn thẻ (có ~$200 tín dụng miễn phí/tháng).

→ **Thiếu:** giữ bản đồ maplibre hiện tại.

## B2. Blog / tin BĐS bằng AI ⬜
**Biến:** `ANTHROPIC_API_KEY` (+ `BLOG_RSS_FEEDS`)

- **Nguồn tin (miễn phí):** RSS feed báo BĐS (cafeland, cafef mục BĐS…) → `BLOG_RSS_FEEDS` (URL ngăn dấu phẩy).
- **AI tóm tắt:** **[console.anthropic.com → API Keys →](https://console.anthropic.com/settings/keys)** tạo key `sk-ant-...`; nạp credit ở **[Billing →](https://console.anthropic.com/settings/billing)**.
  - Model mặc định `claude-opus-5`; tóm tắt số lượng lớn dùng `claude-haiku-4-5` (rẻ hơn nhiều).

→ **Thiếu:** blog dùng bài seed thủ công. ⚠️ Chỉ tóm tắt + dẫn nguồn, không đăng lại nguyên văn.

## B3. Email & SMS xác nhận đặt chỗ ⬜
**Biến:** `RESEND_API_KEY` · `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN` + `TWILIO_FROM`

- **Email — Resend:** **[resend.com → API Keys →](https://resend.com/api-keys)** tạo key; **[xác minh domain →](https://resend.com/domains)** (hoặc dùng domain test).
- **SMS — Twilio:** **[console.twilio.com →](https://console.twilio.com/)** lấy Account SID + Auth Token; **[mua số gửi →](https://console.twilio.com/us1/develop/phone-numbers/manage/search)** (`TWILIO_FROM`).

→ **Thiếu:** đặt chỗ chỉ **mô phỏng** thông báo, không gửi thật.

## B4. Thanh toán thật (làm sau) ⬜
**Biến (VNPay):** `VNPAY_TMN_CODE` + `VNPAY_HASH_SECRET` + `VNPAY_RETURN_URL`

- **VNPay:** **[vnpay.vn →](https://vnpay.vn/)** đăng ký merchant (chạy **[sandbox →](https://sandbox.vnpayment.vn/)** trước) → `TmnCode` + `HashSecret`.
- **MoMo:** **[business.momo.vn →](https://business.momo.vn/)** → `partnerCode` + `accessKey` + `secretKey`.

→ **Hiện tại:** thanh toán **demo, không trừ tiền thật**.

---

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
