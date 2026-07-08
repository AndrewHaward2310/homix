# Plan các việc sửa/nâng cấp tiếp theo — HOMIX

Tổng hợp mọi việc còn tồn từ các đợt trước (Slice 1–4, Đợt 1 UI, phản hồi chủ dự án + Codex). Chia theo ưu tiên tác động/chi phí. Chưa code — chờ chốt.

## Nhóm 1 — Polish & bugfix (rẻ, tác động cao, nên làm trước)
1. **Đa dạng POI lân cận** ở trang chi tiết (hiện toàn "BBQ Hải Đăng 8"): dedupe theo tên/loại, ưu tiên mỗi nhóm 1–2 điểm gần nhất (trường/chợ/hồ/bến xe) thay vì trùng lặp.
2. **Toast phản hồi hành động**: favorite / đặt chỗ / duyệt-từ chối / kéo Kanban đang optimistic *âm thầm* — thêm toast "Đã lưu / Đã gửi / Đã duyệt" + hoàn tác nếu lỗi. Dựng `components/ui/toast`.
3. **SEO** cho trang public: `generateMetadata` (title/description/OG ảnh theo locale) cho `/`, `/search`, `/property/[id]` (Codex flag).
4. **Rà 4 trạng thái + permission-denied**: đảm bảo mọi trang mới có loading/empty/error; thêm màn 403 gọn khi vào nhầm quyền.
5. **Dedupe/format giá & phí** nhất quán; kiểm mobile các trang mới (portal drawer, filter /search thành bottom-sheet).
6. ~~Floor plan~~ — **chủ dự án chốt BỎ HẲN** (không có dữ liệu thật, không bịa, không thêm slot).

## Nhóm 2 — Trải nghiệm & giữ chân (Đợt 2 từ PROPOSAL-ui-upgrade)
1. **Dark mode (UI)**: tokens đã có biến CSS — thêm toggle + `data-theme`, lưu localStorage; map giữ style sáng (dark map cần tile riêng → sau).
2. **Shortlist chia sẻ được**: gom yêu thích thành nhóm, tạo **link chia sẻ** (gửi gia đình/môi giới), cho ghi chú + bình chọn. Cần model `Collection` + API + trang `/s/[token]` public.
3. **"Vì sao căn này hợp"**: chip giải thích theo filter/ngân sách trên card + detail (không hộp đen).
4. **Saved search + cảnh báo**: `/account/saved-searches` thật + badge "căn mới/giảm giá" (mock realtime). Cần model `SavedSearch` + API.
5. **Search-as-you-move** trên `/search`: thêm filter theo **bbox** ở API + toggle "Tìm khi di chuyển bản đồ" (debounce + hủy request + giữ viewport). Cần toạ độ cho từng căn (hiện đặt theo toà) → cân nhắc thêm lat/lng cho Property.

## Nhóm 3 — Lấp các tab ComingSoon (biến stub thành thật)
- **Customer**: `/account/messages` (chat in-app mock), `/account/saved-searches` (đã ở Nhóm 2).
- **Host**: `/host/revenue` (bảng + chart recharts + payout status), `/host/messages`, `/host/reviews` (phản hồi), `/host/services` (one-touch + Smart Lock log), `/host/settings`.
- **Agent (Sales)**: `/agent/match` (Smart Match), `/agent/collections` (báo giá), `/agent/contracts` (eKYC stepper mock), `/agent/commission`, `/agent/pricing`.
- **Agent (Care)**: `/agent/ops`, `/agent/tickets`, `/agent/schedule`, `/agent/aftersale`, `/agent/quality` (SLA/CSAT chart).
- **Admin**: `/admin/hosts` (KYC duyệt), `/admin/transactions`, `/admin/perks` (CRUD), `/admin/leads` (phân công), `/admin/reports`, `/admin/settings`, `/admin/audit`.

## Nhóm 4 — Tính năng "backend thật" (lớn hơn, phần lớn mock UI ở giai đoạn này)
- **Thanh toán in-app** (modal glass, không rời trang) + trạng thái đơn `confirmed→paid`; `Payment` có idempotencyKey (server tính tiền, không optimistic "đã trả").
- **Chat realtime** (mock trước, sau ghép WS).
- **eKYC / e-sign**, **AI pricing/mô tả**, **Smart Lock**, **payout host**, **audit log UI**.

## Kỹ thuật cần chuẩn bị (Codex đã lưu ý)
- Thêm `lat/lng` cho `Property` (cho search-as-you-move chính xác) hoặc chấp nhận theo toà.
- Model mới: `Collection`, `SavedSearch`, `Payment`, `Conversation/Message`, `AuditLog` (đa số đã phác ở PLAN-marketplace).
- Giữ ownership check + authz ở server cho mọi action mới; optimistic chỉ cho hành động dễ đảo.
- Không dark-pattern (đã thống nhất).

## Đề xuất thứ tự
- **Bước 1 (khuyến nghị)**: Nhóm 1 (polish/bugfix) — nâng chất "chuyên nghiệp" ngay, rẻ.
- **Bước 2**: Nhóm 2 chọn 2–3 mục (dark mode + shortlist chia sẻ + "vì sao hợp") — tạo khác biệt giữ chân.
- **Bước 3**: Lấp dần Nhóm 3 theo vai trò ưu tiên.
- **Bước 4**: Nhóm 4 khi cần demo sâu.

## ✅ Điều chỉnh sau review Codex (chốt kỹ thuật)
- **SEO không "rẻ" như tưởng**: `app/property/[id]/page.tsx` đang `'use client'` → KHÔNG export `generateMetadata` được. Phải **tách server/client**: `page.tsx` (server) fetch data + metadata → render `PropertyDetailClient`. Tương tự `/search`, `/` (bọc client inner, metadata ở server wrapper). Kèm OG **absolute URL**, structured data/sitemap.
- **Toast + rollback chuẩn ở tầng action**: `useFavorites` hiện rollback theo closure `ids` → **race khi click nhanh** (phải dùng functional update / khoá theo id). "Hoàn tác" chỉ cho hành động ĐẢO ĐƯỢC. **Booking/payment KHÔNG optimistic**. Kanban approve/decline: server authz trước, rollback theo response thật, idempotent.
- **403 đúng nghĩa**: `middleware` hiện **redirect sai-role** chứ chưa có màn **403** → cần đổi flow (trang 403 + giữ redirect chưa-đăng-nhập).
- **Dark mode**: chống **FOUC** bằng theme class sớm trước hydrate; input native đang hardcode `[color-scheme:light]` → phải theme-aware; map giữ sáng nhưng chỉnh marker/popup/attribution cho đọc được.
- **Shortlist = capability URL**: token ngẫu nhiên đủ dài, **lưu hash**, public read-only, **không lộ email/user/ghi chú riêng**, có **revoke/expiry + rate limit**, không id tuần tự; vote/note public cần chống spam hoặc yêu cầu auth.
- **Search-as-you-move lớn hơn mô tả**: `Property` chưa có toạ độ (đang dùng toà + jitter) → cần **migration lat/lng + backfill + bbox query + index** + client **debounce/AbortController/stale-guard/reset paging/toggle** (tránh quá tải API). → tách thành đợt riêng.
- **Fallback**: fetch POI/map lỗi phải có fallback gọn (đã có ở masterplan, thêm cho mini-map detail).
- **Test**: bổ sung e2e authz + rollback cho các action mới.

**5 việc impact cao nhất cho 1 đợt (Codex + Claude đồng thuận):**
1. **Đa dạng/dedupe POI lân cận** (property detail).
2. **Tách server/client + SEO** cho `/property/[id]`, `/search`, `/` (OG/structured data).
3. **Toast chuẩn** cho favorite/booking/Kanban + rollback/error rõ (sửa race `useFavorites`).
4. **Rà loading/empty/error + màn 403 đúng nghĩa**.
5. **Chuẩn hoá format giá/phí + kiểm mobile** các luồng public chính.

(Dark mode, shortlist chia sẻ, search-as-you-move → đợt kế; mỗi cái là 1 đợt riêng vì chạm schema/bảo mật.)
