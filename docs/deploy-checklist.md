# Checklist publish HOMIX (Vercel + Supabase)

Hạ tầng: repo GitHub `AndrewHaward2310/homix` → Vercel build; dữ liệu ở Supabase
(Postgres + Storage bucket `property-images`).

> ⚠️ **TUYỆT ĐỐI KHÔNG chạy `pnpm db:seed` trên database production.**
> `prisma/seed.ts` có `review.deleteMany({})` (xoá sạch đánh giá THẬT của người dùng)
> và `property.upsert` ghi đè dữ liệu căn — **bao gồm cả ảnh bạn đã tự thay** qua công
> cụ Quản lý ảnh. Seed chỉ dành cho máy local.

---

## 1. Biến môi trường trên Vercel
Project Settings → Environment Variables (đủ cho cả Production & Preview):

| Biến | Dùng để | Ghi chú |
|---|---|---|
| `DATABASE_URL` | Prisma runtime | Chuỗi **POOLED** Supabase (Supavisor, cổng 6543) |
| `DIRECT_URL` | Prisma migrate | Chuỗi **DIRECT** (cổng 5432) |
| `JWT_SECRET` | Ký cookie đăng nhập | Chuỗi ngẫu nhiên dài, **khác** local |
| `SUPABASE_URL` | Tải/thay ảnh | `https://<ref>.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Tải/thay ảnh | **Khoá bí mật**, chỉ đặt phía server |

Thiếu 2 biến Supabase → tính năng đổi ảnh của admin/chủ nhà sẽ lỗi.

## 2. Áp migration lên DB production
Repo hiện có 6 migration; **2 cái mới nhất chưa từng chạy trên Supabase**:

- `20260719171917_combo_discount_tier` — bảng bậc giảm giá combo (admin chỉnh được)
- `20260719180026_booking_perks` — cột `Booking.perks` (snapshot trải nghiệm đã đặt)

Không có 2 migration này thì trang combo và đặt phòng kèm trải nghiệm sẽ **lỗi 500**.

```bash
# Chạy TỪ MÁY LOCAL, trỏ vào Supabase (KHÔNG phải .env local).
# Lưu ý: mạng ở văn phòng chặn cổng Postgres → cần phát 4G/hotspot.
DATABASE_URL="<pooled-supabase>" DIRECT_URL="<direct-supabase>" \
  pnpm exec prisma migrate deploy
```

`migrate deploy` chỉ áp migration còn thiếu, **không** xoá dữ liệu.

## 3. Nạp bậc giảm giá mặc định (chỉ chạy MỘT lần)
Bảng `ComboDiscountTier` sau migration đang **rỗng** → combo sẽ hiện giá không giảm.
Thêm 3 bậc mặc định bằng SQL (Supabase → SQL Editor). An toàn khi chạy lại:

```sql
INSERT INTO "ComboDiscountTier" ("id","minPerks","percent","maxDiscountVnd","active","updatedAt")
VALUES (gen_random_uuid()::text, 1,  5, NULL, true, now()),
       (gen_random_uuid()::text, 2,  8, NULL, true, now()),
       (gen_random_uuid()::text, 3, 12, NULL, true, now())
ON CONFLICT ("minPerks") DO NOTHING;
```

Sau đó admin chỉnh trực tiếp ở `/admin/settings` (không cần deploy lại).

## 4. Đẩy code
```bash
git push origin feat/ux-upgrade-loop      # → Vercel tạo bản Preview (link riêng để test)
# hoặc gộp vào main → deploy Production
```
Cho người dùng test thì **Preview** an toàn hơn: có link riêng, không đụng bản chính.

## 5. Smoke test sau khi deploy
- [ ] Trang chủ lên đủ: hero (số liệu đếm động), Căn hộ nổi bật, Combo, bản đồ Vị trí, Lifestyle full-bleed, Đánh giá
- [ ] Ảnh hiện đủ (Supabase Storage + `images.unoptimized`)
- [ ] Đăng nhập 4 vai trò (mật khẩu demo `123456`): khách / chủ nhà / sale / admin
- [ ] `/combo/tu-thiet-ke`: chọn căn + trải nghiệm → giá gói giảm đúng bậc
- [ ] Đặt phòng kèm combo → **tổng tiền khớp** giá gói ở builder
- [ ] `/admin/settings`: đổi % một bậc → builder đổi giá ngay
- [ ] `/agent/collections` (Báo giá) và `/agent/schedule` (Lịch hẹn) có dữ liệu
- [ ] Đổi ngôn ngữ VI ↔ EN không vỡ chữ
- [ ] Mobile: dải combo vuốt ngang được, không tràn ngang trang

## 6. Biết trước để khỏi bất ngờ khi test
- Portal sale còn 4 tab là bản nháp "Sắp ra mắt": Hoa hồng, Hợp đồng & eKYC, Tin nhắn, SLA/CSAT.
- Ảnh một số căn vẫn là ảnh mẫu — thay trực tiếp trên web bằng công cụ Quản lý ảnh.
- Đăng nhập là **mock demo** (mật khẩu chung `123456`) → **không dùng dữ liệu thật/nhạy cảm** khi test.
