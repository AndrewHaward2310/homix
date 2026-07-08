# Plan chi tiết: HOMIX Marketplace (Public + Customer + Host + Operations + Admin)

Mục tiêu: một web BĐS **chuyên nghiệp, đẹp, thu hút**, mobile-first, backend-ready. Xây theo pha, mỗi pha ship được. Kế thừa Foundation + i18n + `types` + `services/*` sẵn có.

---

## 0. Hiện trạng & khoảng trống (phải vá trước)
- **Role**: mới có `customer | host | agent`. Prompt cần thêm **`admin`** và **`agentFunction: 'sales' | 'care' | 'both'`** cho agent.
- **Services**: mới có `property/perk/booking/lead/user`. Thiếu: `search, favorite, review, message, savedSearch, payment, host, admin`.
- **Data/types**: `Property` thiếu `verified`, `ratingAvg`, `amenityDistances`; thiếu type `Review, Favorite, SavedSearch, Conversation/Message, Payment, AvailabilityRange, AuditLog`.
- **Thư viện thiếu**: charts, kéo-thả, calendar/date-range, carousel/lightbox, focus-trap.
- **Routes** hiện có: `/, /host, /agent, /login, /styleguide`. `middleware.ts` mới bảo vệ `/, /host, /agent`.

---

## 1. Định hướng sáng tạo (để "đẹp & thu hút", không chỉ đủ tính năng)
- **Ngôn ngữ thị giác**: kế thừa "Apple Luxury Minimal" + brand HOMIX (ocean `#0B5C63`, Plus Jakarta Sans). Nhiều khoảng trắng, ảnh lớn tràn viền, glass tiết chế, bo mềm, bóng khuếch tán.
- **Chuyển động có gu**: `Reveal` khi cuộn, stagger, Ken Burns cho hero ảnh, micro-interaction cho nút (approve/decline, favorite ♥ bounce, thêm bundle), số đếm động cho KPI. Luôn tôn trọng `prefers-reduced-motion`.
- **Điểm nhấn khác biệt** (tạo "wow"): marker giá đồng bộ hover list↔map; lightbox gallery vuốt mượt; booking card glass sticky; thanh toán in-app không rời trang; Kanban kéo-thả; bản đồ tiện ích thật (đã có).
- **Nhất quán hệ thống**: mọi màn dùng chung bộ primitives (KPI card, DataTable, StateWrapper, Modal, Chart, EmptyState) → cảm giác "một sản phẩm".

---

## 2. Phase 0 — Foundation mở rộng (bắt buộc làm đầu tiên)
**Data model (types/index.ts + Prisma + seed):**
- `Role` += `admin`; `User` += `agentFunction?`, `kycStatus?`, `verified?`, `savedPaymentMethods?`.
- `Property` += `verified: boolean`, `ratingAvg?`, `reviewCount?`.
- Type mới: `Review, Favorite, SavedSearch, Conversation, Message, Payment, AvailabilityRange (propertyId, from, to, status), AuditLog, PerkPartner`.
- Prisma models tương ứng + `lib/mappers.ts` + seed mock (đủ để demo 4 trạng thái).

**Auth/route:**
- `ROLE_HOME` += `admin: '/admin'`; `middleware.ts` `ROUTE_ROLES` + matcher thêm `/account, /search, /property, /admin` (public: `/search`, `/property/[id]`).
- `ProtectedRoute` dùng lại; thêm helper `canAccessTab(tabId, agentFunction)` cho Operations.
- Thêm tài khoản demo `admin@homix.vn` + set `agentFunction` cho agent demo.

**Services mới (mock trước, API sau — chỉ sửa ruột):**
`searchService.search(filters,page)→{items,total,page}`, `favoriteService`, `reviewService`, `messageService`, `savedSearchService`, `paymentService`, `hostService`, `adminService`. Tất cả trả Promise, hỗ trợ optimistic + nhánh rollback.

**Thư viện cài thêm:** `recharts` (chart), `@dnd-kit/core`+`@dnd-kit/sortable` (Kanban), `react-day-picker` (calendar/date-range), `embla-carousel-react` (gallery/lightbox), cân nhắc `@radix-ui`/`@base-ui` cho Modal có focus-trap (đã có @base-ui). **Lazy-load** các lib nặng.

**Shared primitives (dựng 1 lần, tái dùng):**
- `PortalShell` (sidebar glass + header + mobile drawer + bottom-nav) — dùng cho host/agent/admin.
- `StateWrapper` (loading skeleton / empty / error / success) bọc mọi khối có dữ liệu.
- `KpiCard`, `TrendBadge`, `DataTable` (search/filter/paging), `ChartCard` (recharts wrapper), `Modal` (focus-trap, Esc, a11y), `Lightbox`, `AvailabilityCalendar`, `DateRangePicker`, `Kanban`, `EmptyState`, `PriceMarker`.
- `lib/pricing.ts` (tính đêm/cọc/trả góp), `lib/filters.ts` (parse/serialize URL query ↔ filter), `lib/access.ts` (canAccessTab).

---

## 3. Phase 1 — Public discovery (ưu tiên cao: mặt tiền marketplace)
### 3.1 `/property/[id]` — Chi tiết căn (customer)
Khối: (1) Gallery tràn viền + lightbox vuốt + "Xem tất cả ảnh" + nút Tour 360°/Video (mock player) — lazy-load. (2) Thông tin chính: tên/toà/vị trí, **giá lớn** `formatMoney`, thông số icon, mô tả (động theo locale), badge **Đã xác minh**, nút **Lưu ♥** + **Chia sẻ**. (3) **Booking card glass sticky** (desktop) / **CTA sticky đáy** (mobile): chọn loại → ngắn ngày hiện **AvailabilityCalendar** (chặn ngày đã đặt) + date-range → tính tiền theo đêm; CTA pill. (4) Tiện ích xung quanh + **mini-map** (dùng lại map service) + khoảng cách. (5) **Smart-bundle "Đặc quyền riêng"**: tick dịch vụ nội khu + so sánh OTA, cộng dồn real-time + tuỳ chọn **bảo hiểm**. (6) **Máy tính chi phí**: mua→trả góp; thuê→tổng (giá+phí+cọc) — `lib/pricing.ts`. (7) **Reviews** 2 chiều: sao TB + list; khách đã hoàn tất booking mới được viết. (8) **Thanh toán in-app**: `Modal` glass (Apple Pay/VNPay mock) — **không redirect**, có bước xác nhận + màn thành công. (9) **So sánh** + lưới **căn tương tự** (PropertyCard).
Data qua `propertyService`; action qua `favorite/booking/review/paymentService` (optimistic). SEO metadata theo locale + OG ảnh.

### 3.2 `/search` — Kết quả tìm kiếm (màn discovery chính)
2 cột desktop: **list trái + MapLibre phải**, marker giá đồng bộ hover 2 chiều; mobile toggle List↔Map. **Bộ lọc**: loại giao dịch, giá (slider), PN, diện tích, toà, tiện ích (multi), ngày trống → **phản ánh vào URL query** (share link, map thẳng sang endpoint). Chip filter + "Xoá lọc". **Sắp xếp**: liên quan/giá/mới. **List**: PropertyCard (Lưu ♥, badge verified), skeleton/empty/error/success, phân trang hoặc infinite scroll. Nút **"Lưu tìm kiếm này"** → `savedSearchService` + bật cảnh báo (mock). Data qua `searchService.search(filters,page)`.

---

## 4. Phase 2 — Customer account `/account/*` (ProtectedRoute customer)
Layout tab/sidebar nhẹ. (1) `/account/trips`: booking sắp tới/đã qua, trạng thái, xem/huỷ/liên hệ; ngắn ngày hiện **mã Smart Lock** khi tới ngày. (2) `/account/favorites`: lưới PropertyCard đã lưu, bỏ lưu tại chỗ. (3) `/account/saved-searches`: tiêu chí đã lưu + bật/tắt cảnh báo. (4) `/account/messages`: chat in-app (bubble mượt). (5) `/account/profile`: thông tin, **eKYC status**, phương thức thanh toán, ngôn ngữ, thông báo. Mỗi mục empty + skeleton; action optimistic.

---

## 5. Phase 3 — Host portal `/host/*` (ProtectedRoute host)
**App-shell** (`PortalShell`): sidebar (Tổng quan·Tài sản·Lịch&Booking·Doanh thu·Tin nhắn·Đánh giá·Dịch vụ nội khu·Cài đặt), header (multi-property switcher, chuông, avatar), mobile drawer + bottom-nav.
- `/host` **Tổng quan**: lời chào, **KPI** (lấp đầy, doanh thu tháng, booking chờ, đánh giá TB) + TrendBadge, **chart doanh thu** (recharts, toggle kỳ), **booking chờ duyệt** Approve/Decline 1 chạm (optimistic), timeline check-in/out, ô Smart Lock.
- `/host/properties`: lưới căn + "Đăng tin siêu tốc" (modal kéo-thả ảnh, form, nút "AI gợi ý mô tả" mock).
- `/host/calendar`: calendar tháng màu theo trạng thái + chặn/mở ngày + list booking Approve/Decline; lọc theo tài sản.
- `/host/revenue`: bảng theo booking + payout status + chart + xuất báo cáo (mock).
- `/host/messages`, `/host/reviews` (phản hồi), `/host/services` (one-touch housekeeping/maintenance + Smart Lock log), `/host/settings`.

---

## 6. Phase 4 — Operations portal `/agent/*` (ProtectedRoute agent)
Portal **dùng chung** Sales + Care, **không toggle role**. Tab render theo `user.agentFunction` qua `canAccessTab`; tab không quyền → ẩn sidebar + chặn route (redirect tab hợp lệ đầu). Badge chức năng chỉ hiển thị.
- **Sales**: `/agent/leads` **Kanban @dnd-kit** (Mới→Đang tư vấn→Đã chốt, kéo-thả optimistic, drawer chi tiết) · `/agent/match` Smart Match · `/agent/collections` báo giá + preview · `/agent/contracts` eKYC + e-sign (stepper mock) · `/agent/commission` · `/agent/pricing` AI (mock).
- **Care**: `/agent/ops` hàng đợi vận hành · `/agent/tickets` CSKH · `/agent/schedule` điều phối lịch xem · `/agent/aftersale` bàn giao checklist · `/agent/quality` SLA/CSAT chart.
- **Chung**: Tin nhắn, Thông báo, Cài đặt.

---

## 7. Phase 5 — Admin portal `/admin/*` (ProtectedRoute admin, ưu tiên desktop, bảng dày)
**App-shell** riêng. `/admin` Tổng quan: **KPI toàn nền tảng** (GMV, users theo role, tin active, booking hôm nay, lấp đầy TB), chart tăng trưởng, hàng đợi duyệt (KYC/tin), cảnh báo hệ thống, audit rút gọn.
Subpages (DataTable search/filter/paging): `/admin/users` (CRUD, đổi role, **gán agentFunction** — nguồn quyết định tab Operations) · `/admin/hosts` KYC duyệt/từ chối · `/admin/listings` kiểm duyệt tin · `/admin/transactions` giao dịch/hoàn tiền/đối soát payout · `/admin/perks` CRUD catalog + đối tác · `/admin/leads` phân công · `/admin/reports` phân tích + xuất · `/admin/settings` dynamic pricing/i18n content/tham số · `/admin/audit` nhật ký.

---

## 8. Quy tắc xuyên suốt (áp mọi màn)
- **Responsive** mobile-first: breakpoint 640/768/1024; grid 1→2→3-4; portal nav → drawer/bottom-nav; CTA quan trọng ghim đáy mobile.
- **Hiệu năng**: `next/image` (width/height, lazy, priority above-fold, blur LQIP); video hero có poster, `preload=none`, muted, thay bằng ảnh <768px; **dynamic import** map/chart/lightbox/kanban, mount khi vào viewport; không nạp lib map/chart ở màn không dùng.
- **A11y**: tương phản ≥4.5:1; mọi ảnh có alt, icon-button có aria-label; Modal + Kanban điều hướng bàn phím + focus-trap + focus ring; tôn trọng `prefers-reduced-motion`.
- **SEO** cho `/, /search, /property/[id]`: metadata + OG ảnh theo locale.
- **Dữ liệu backend-ready**: KHÔNG import mock trực tiếp — đọc/ghi qua `services/*`; mọi view đủ **4 trạng thái**; action **optimistic + rollback**; business logic ở `lib/` (không nhét JSX); list/filter/sort/paging qua tham số/URL.

---

## 9. Rủi ro / cần chốt
1. **Quy mô rất lớn** (5 portal + ~30 route) → nên ship theo pha; đề nghị làm **Phase 0 + Phase 1** trước (giá trị marketing cao nhất), rồi lần lượt.
2. Backend thật cho các tính năng mới (payment, chat realtime, KYC, AI) là //TODO — pha này chỉ frontend + mock service.
3. Thêm role `admin` + `agentFunction` chạm schema/seed/middleware → làm gọn trong Phase 0.
4. Cần chốt: thứ tự ưu tiên pha; mock chat/thanh toán mức độ nào; có cần Codex review plan này trước khi code không.

## 10.5. Điều chỉnh sau review Codex (QUAN TRỌNG — thay thế phần pha ở trên)

**Đổi cách chia pha → "vertical slice" (mỗi pha 1 luồng end-to-end chạy thật), KHÔNG dồn Phase 0 khổng lồ:**
- **Slice 1 (MVP)**: `/search` + `/property/[id]` + **favorite** + **request booking** (chưa thanh toán thật). Kèm phần Foundation TỐI THIỂU cần cho slice này.
- **Slice 2**: customer `/account/trips` + host **duyệt booking** + host **calendar** (chống double-booking).
- **Slice 3**: agent **lead Kanban** (kéo-thả).
- **Slice 4**: admin **moderation tối thiểu** (duyệt tin/KYC) — xuất hiện NGAY khi host được đăng tin, không đợi Phase 5 đầy đủ.
- **Hoãn hẳn (chỉ mock UI, //TODO backend)**: chat realtime, payment thật, KYC/e-sign, AI pricing/content, smart lock, payout, perks CRUD, audit UI, báo cáo nâng cao.

**RBAC / auth (sửa lỗ hổng):**
- `middleware.ts` đang **match route chính xác** → `/host/calendar`, `/agent/leads` LỌT quyền. Dùng **prefix matcher** (`/host/:path*`, `/agent/:path*`, `/admin/:path*`, `/account/:path*`) và **enforce quyền ở API/route handler** (server), `ProtectedRoute` chỉ là UX.
- **`/` phải PUBLIC** (marketplace) — bỏ khóa customer ở `/`; chỉ `/account/*` cần customer. Sửa `middleware` + `app/page.tsx`.
- JWT giữ `role` 7 ngày → đổi role/khóa tài khoản không hiệu lực ngay: **API nạp quyền từ DB mỗi request** (đã có `getSessionUser` đọc DB — giữ vậy, không tin role trong token cho hành động nhạy cảm); thêm `User.status` (active/blocked) + kiểm ở `requireUser`. Bỏ fallback `JWT_SECRET` ở production.
- `agentFunction` = **enum DB**, kiểm ở **route handler** (không chỉ ẩn tab). Ownership checks: host chỉ sửa tài sản của mình; agent chỉ xem lead được phân công; admin action → audit.

**Data model (chuẩn từ đầu, tránh sửa lớn sau):**
- **Availability**: `DateTime` (không `String`), khoảng `[start,end)`, `bookingId`, `source`, unique + **transaction chống double-booking** (booking là server transaction, idempotencyKey, conflict trả **409**).
- **Booking lifecycle**: `pending/confirmed/cancelled/completed/no_show/refunded` + **snapshot giá/phí/cọc**, currency, guestCount, cancellationPolicy.
- **Review**: `bookingId @unique`, chỉ booking `completed` sau checkout, đúng customer/property; moderation status + host reply; **`ratingAvg` denormalize trong transaction** (client KHÔNG ghi).
- **Payment** (dù mock): contract thật `amount/currency/status/provider/idempotencyKey/bookingId` + refund/payout; **server tính tiền & chuyển trạng thái**; KHÔNG optimistic trạng thái "đã thanh toán".
- **Favorite** unique `(userId, propertyId)`; **Message** membership/authz; **AuditLog** actor/action/entity/before-after/IP, bất biến. Thêm **composite index** theo query thực tế.

**Kiến trúc/hiệu năng (sửa hiểu nhầm & bẫy):**
- `services/*` HIỆN đã gọi **API thật** (không phải mock) → **mở rộng API + mapper**, KHÔNG re-mock; giữ 1 nguồn hành vi.
- Marker map trên `/search`: dùng **GeoJSON source + clustering + viewport query + debounce bounds** (đừng render hàng trăm marker React).
- **URL-state**: 1 schema parse ở server, canonical defaults, **debounce slider**, `replace` khi kéo / `push` khi Apply (tránh loop URL↔state). **MVP dùng phân trang** (infinite scroll + map khó giữ vị trí) + query cancellation + cache.
- **Optimistic chỉ cho action dễ đảo** (favorite/stage/toggle). Booking/payment/availability → server transaction, không optimistic.
- Dynamic import map/chart/kanban: **chừa sẵn kích thước + skeleton** (tránh layout shift); map chỉ load ở chế độ Map trên mobile; không nạp lib ở màn không dùng.

**Đẹp & chuyên nghiệp (kỷ luật hệ thống):**
- Giảm "glass + animation đại trà" → **phân cấp rõ**: nền trung tính, brand chỉ cho CTA, glass chỉ ở map/overlay. Chuẩn hóa token (spacing/radius/shadow/typography/chart-map colors) — mọi portal cùng 1 phong cách.
- **Ảnh BĐS quyết định cảm nhận**: cùng tỷ lệ, crop chuẩn, LQIP/blur, gallery editorial; thiếu ảnh → placeholder cao cấp.
- `/search`: **filter bar sticky**, số kết quả rõ, selected chips, hover list↔map tinh tế, tránh quá nhiều control.
- Dashboard: ưu tiên **density & scanability**, ít KPI, bảng tốt, màu trạng thái nhất quán; không dùng chart nếu số/trend đã đủ.
- **Mock data phải "đẹp & nhất quán"** (giá/ảnh/review/lịch trống) + đủ empty/error/loading/**permission-denied** + nội dung VI/EN thật.

## 10. Verify mỗi pha
`tsc --noEmit` + `pnpm build` sạch; tự chụp bằng `_shot.mjs` (headless Chrome) ở 375px + 1440px; kiểm 4 trạng thái, keyboard/focus modal, `prefers-reduced-motion`, VI/EN.
