# UX/UI Audit & Upgrade — HOMIX (lăng kính chuyên gia product + khách hàng)

Mục tiêu: nâng UX/UI để **chuyên nghiệp, hiện đại, giữ chân & chuyển đổi tốt hơn**. Audit theo hành trình khách: **Khám phá → Duyệt → Đánh giá → Quyết định → Đặt → Quay lại**. Có dẫn chứng benchmark ngành BĐS 2025–26.

## 0. Điểm mạnh hiện có (giữ, đừng phá)
- Ảnh OCP1 thật + **bản đồ Vinhomes thật** (icon/search/filter/POI lân cận) — điểm khác biệt lớn.
- Trang chi tiết đã khá đầy: gallery vuốt/zoom, tiện ích nhóm, mini-map vị trí + khoảng cách, chủ nhà/chính sách, trust, review, căn tương tự, "vừa xem", sub-nav.
- Search list↔map (marker giá + hover 2 chiều), filter→URL, 4 trạng thái.
- Portal nhất quán (shell/KPI/kanban), SEO động, toast, 403, nav mobile.

## 1. Phát hiện theo màn (severity: 🔴 cao · 🟡 vừa · 🟢 nhỏ)

### Trang chủ (Khám phá) — quyết định niềm tin trong 5 giây
- 🔴 **Thiếu value-proposition & social proof**: hero chỉ có ảnh + search, KHÔNG có câu định vị ("Nền tảng #1 mua/thuê/lưu trú bên hồ") và **tín hiệu tin cậy** (số căn, sao TB, lượt đặt, đối tác). Research: nhà đầu tư/khách quyết niềm tin ở màn đầu.
- 🟡 **Thiếu "Cách hoạt động (3 bước)"** cho 3 loại (mua/thuê/lưu trú) → khách mới không hiểu nhanh mô hình.
- 🟡 **Thiếu testimonials/đánh giá thật + FAQ** — block chuẩn của trang BĐS chuyển đổi cao.
- 🟢 Section bản đồ full-bleed rất đẹp nhưng **thiếu CTA rõ** để "hành động" (chỉ xem). Thêm nút "Xem căn quanh đây".

### Search (Duyệt) — màn discovery chính
- 🔴 **Marker map không gom cụm** → ở vùng dày bị đè chồng, khó bấm. Cần **cluster + "Tìm khu này"**.
- 🟡 **Bộ lọc còn mỏng** (chỉ loại/sort/PN): thiếu **giá (slider), diện tích, tiện ích (multi), ngày trống**. Mobile nên là **bottom-sheet lọc**.
- 🟡 Thiếu **lưu tìm kiếm + so sánh căn** (khay so sánh nổi).
- 🟢 Card tốt; thêm tag "Mới/Hot" (chỉ khi thật), quick-view peek.

### Chi tiết căn (Đánh giá → Quyết định) — màn quyết định mua
- 🔴 **Thiếu "máy tính chi phí"**: với **mua → trả góp/khoản vay ước tính**; với **thuê → tổng (giá+phí+cọc)**. Đây là booster chuyển đổi kinh điển (prompt gốc cũng yêu cầu).
- 🟡 **Video/tour 360° đang là nút mock**: research — listing có **video nhận +403% liên hệ**, 3D giảm ~31% thời gian bán. Nên có slot video/3D thật (khi có data) thay vì nút không mở.
- 🟡 Giá minh bạch có trust block nhưng **chưa tách phí/cọc/chính sách hủy ngay cạnh giá lớn** cho mọi loại.
- 🟢 CTA "Đặt lịch xem/Đặt ngay" tốt; có thể làm nổi hơn + đếm "N người quan tâm" (chỉ khi thật).

### Đặt (Quyết định) 
- 🟡 Hiện là **request-only** (chưa thanh toán in-app). Luồng đặt chưa "đóng" — modal thanh toán không rời trang sẽ hoàn tất phễu.

### Portals (Host/Agent/Admin)
- 🟡 Nhiều tab **ComingSoon** → cảm giác chưa "đủ". Ưu tiên tab dùng nhiều: Host **Doanh thu (chart)**, Admin **Giao dịch/KYC**.
- 🟢 Dashboard nên tăng **mật độ & khả năng quét** (ít KPI, bảng tốt, màu trạng thái nhất quán).

### Mobile & Hiệu năng (75% traffic BĐS là mobile, <3s load)
- 🟡 Cần rà **tap target ≥44px**, filter bottom-sheet, portal drawer; ảnh LQIP đã có — kiểm LCP hero.
- 🟢 Native `<select>` khóa `color-scheme:light` → cần theme-aware khi làm dark mode.

## 2. Design system — siết để "một sản phẩm cao cấp"
- 🟡 **Bo góc/elevation lộn xộn** (`rounded-xl/2xl/3xl` + shadow ad-hoc). Chuẩn hoá **2 radius (control/surface) + 3 elevation**.
- 🟡 **Thiếu dark mode** (biến CSS đã sẵn) — hiện đại, hợp duyệt buổi tối.
- 🟢 Motion tốt (Reveal/Ken Burns/toast); thêm **skeleton khớp layout** + **page transition** nhẹ; luôn tôn trọng `prefers-reduced-motion`.
- 🟢 **A11y**: focus ring nhất quán, tương phản ≥4.5:1, keyboard cho modal/kanban.

## 3. Đề xuất ưu tiên (impact/effort)

**Tier 1 — Chuyển đổi & niềm tin (làm trước, tác động cao):**
1. **Trang chủ storytelling**: value-prop + **trust bar** (số liệu/sao/đối tác) + **"Cách hoạt động 3 bước"** + testimonials + FAQ → biến homepage thành landing chuyển đổi.
2. **Máy tính chi phí ở chi tiết**: trả góp (mua) / tổng chi phí (thuê–lưu trú) + tách phí/cọc/hủy cạnh giá.
3. **Search nâng cấp**: cluster marker + "Tìm khu này" + filter đầy đủ (giá slider/diện tích/tiện ích/ngày) + bottom-sheet mobile.

**Tier 2 — Hiện đại & giữ chân:**
4. **Dark mode** + polish motion/skeleton.
5. **Shortlist chia sẻ** + **"Vì sao căn này hợp"** + **lưu tìm kiếm/cảnh báo**.
6. **So sánh căn** (khay nổi) + video/3D slot thật (khi có data).

**Tier 3 — Nền tảng:**
7. Chuẩn hoá token (radius/elevation/spacing), a11y pass, JSON-LD + sitemap, kiểm mobile toàn diện.

## 4. Đo lường (biết upgrade có hiệu quả)
Funnel: home→search, search→detail, độ sâu gallery, tỉ lệ save, "book-a-tour" click, booking-start, return rate. Đặt mốc trước/sau.

## ✅ TỔNG HỢP SAU REVIEW CODEX (bản chốt)

**Đính chính hiện trạng (đừng làm lại):** `/search` đã đọc minPrice/maxPrice từ URL (homepage có price band) — chỉ **UI filter search chưa có slider/diện tích/tiện ích/ngày**. Detail đã có trust block/review/policy/mini-map/POI/recently-viewed. Booking đã có **modal xác nhận không rời trang** (chỉ thiếu payment thật). **Nút "Tour ảo 360°" đang mở lại gallery → cảm giác giả**, cần đổi.

**5 việc UX impact cao nhất — "Đợt conversion" (Codex + Claude đồng thuận):**
1. **Homepage trust/value layer**: headline định vị + **trust bar bằng số liệu THẬT** (căn đã xác minh, thời gian phản hồi TB, review từ booking thật — KHÔNG bịa "10.000 khách") + **"HOMIX khác gì OTA/môi giới"** + FAQ ngắn.
2. **Search power upgrade**: **UI** giá slider + diện tích + tiện ích (multi) + ngày trống + tower/khu; **bottom-sheet lọc mobile**; **"Tìm khu này"**.
3. **Map clustering ĐÚNG kỹ thuật**: chuyển marker giá từ **HTML `Marker` → GeoJSON source + cluster/symbol GL layer** (nhẹ DOM, dễ dùng mobile); HTML marker chỉ giữ cho card/popup nổi bật.
4. **Cost transparency ở detail**: mua = **ước tính vay/trả góp** (ghi rõ "ước tính tham khảo", tách lãi suất/kỳ hạn/vốn tự có/phí trước bạ — KHÔNG như tư vấn tài chính); thuê = cọc/phí/tháng đầu; lưu trú = đêm/phí/tổng/hủy. Đặt cạnh giá/CTA.
5. **Save/shortlist + alert** (retention thực dụng VN): lưu căn + lưu tìm kiếm + báo căn mới/giảm giá qua **Zalo/email**.

**Sửa ngay (nhỏ):** nút "Tour ảo 360°" → đổi thành "Xem toàn bộ ảnh" (hoặc chỉ hiện khi listing có video/360 thật) để không phải CTA giả.

**Cạm bẫy đã ghi nhận:** social proof chỉ dùng số thật; máy tính trả góp phải ghi "tham khảo"; map nhiều marker dùng GL layer; dark mode cần map style tối + native input + overlay (để sau, là polish không phải conversion).

**Ý tưởng khác biệt cho thị trường VN (đợt sau, tạo lợi thế):**
- **Zalo-first**: hỏi nhanh/nhận alert/gửi lịch xem qua Zalo OA.
- **"Phù hợp với tôi vì…"**: gần trường/VinBus/view hồ/tầng cao/hợp gia đình–ở ghép–đầu tư cho thuê.
- **Trust pháp lý**: sổ/hợp đồng, phí quản lý, tình trạng nội thất, **cho thuê lại/Airbnb được không**.
- **So giá theo tòa/tầng/view**: "rẻ hơn TB 6% so với cùng tòa 2PN".
- **Lịch xem theo tuyến**: gom 3–5 căn gần nhau, tối ưu lịch — rất hợp mua/thuê thực địa VN.

## Nguồn benchmark
- propphy.com — Real estate website design best practices 2026
- designmonks.co — Real estate website UX examples
- landingi.com — Real estate landing page best practices
- weweb.io — Real estate homepage features that convert
