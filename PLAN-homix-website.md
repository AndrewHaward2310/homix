# PLAN — Nâng HOMIX thành website bất động sản chuyên nghiệp, đẹp, cuốn hút

Mục tiêu: từ demo hiện tại → một trải nghiệm **cao cấp, điện ảnh, giàu cảm xúc** cho nền tảng
BĐS ven hồ HOMIX (mua / thuê dài hạn / lưu trú ngắn ngày). Ưu tiên: ấn tượng ngay từ màn đầu,
cuộn tới đâu "wow" tới đó, nhưng vẫn tối giản kiểu Apple Luxury.

## 0. Định hướng thẩm mỹ (design direction)
- **Câu chuyện chủ đạo**: "Resort giữa lòng thành phố" — nước xanh ngọc, cát trắng, ánh hoàng hôn.
- **Ngôn ngữ hình ảnh**: ảnh lớn tràn viền (editorial), nhiều khoảng trắng, accent ocean `#0B5C63`
  dùng tiết chế, kính mờ (glass) + bóng mềm.
- **Typography**: Plus Jakarta Sans (đã áp). Thêm **cấp độ display** rõ ràng, line-height thoáng,
  chữ hoa nhỏ (eyebrow) có letter-spacing.
- **Chuyển động**: có "ngôn ngữ motion" nhất quán (reveal, parallax, hover, đếm số, chuyển section)
  — tinh tế, tôn trọng `prefers-reduced-motion`.
- **Dark mode**: rà soát trọn bộ (hiện chỉ sáng).

## 1. Nền tảng design system (làm trước — mọi thứ dựa vào đây)
- Chuẩn hoá tokens: thang màu (thêm sắc độ ocean 50–900), gradient mẫu, bóng, radius, spacing rhythm.
- Bộ **motion primitives** dùng lại: `<Reveal>` (có sẵn) + thêm `<Parallax>`, `<Magnetic>` (nút hút chuột),
  `<TiltCard>` (nghiêng 3D nhẹ khi hover), `<CountUp>` (đã có ở hero — tách ra tái dùng), `<Marquee>`.
- Chuẩn hoá `LuxuryButton` (thêm size/loading/icon), `Card`, `Input/Select` (đẹp hơn native select),
  `Badge`, `SectionHeading` (eyebrow + title + subtitle canh giữa/trái).
- **Smooth scroll** cho anchor + progress bar mảnh trên đỉnh trang.

## 2. Trang chủ — nâng cấp từng section (điểm nhấn sáng tạo)
1. **Hero điện ảnh** (đã có nền + search): thêm parallax nhẹ khi cuộn; thanh search **"dock"** lên
   navbar khi cuộn qua hero (glass search thu nhỏ dính top). Tùy chọn: lớp hạt sáng/bokeh rất nhẹ.
2. **Trust bar**: dải logo/giải thưởng + số liệu đếm động (420ha · 66 tháp · 6.1ha biển hồ · hàng nghìn cư dân).
3. **Khám phá theo nhu cầu**: 3 thẻ lớn Mua / Thuê dài hạn / Lưu trú — ảnh hover zoom, mô tả ngắn, CTA.
4. **Căn hộ nổi bật**: card **cao cấp hơn** — hover hé lộ (mặt bằng/tiện ích), nút lưu ♥, badge loại,
   giá compact; lọc tab mượt (animated underline); carousel kéo được trên mobile.
5. **Masterplan map** (đã đẹp/đúng data Vin): thêm liên kết "xem căn hộ theo phân khu".
6. **Lifestyle — kể chuyện "một ngày ven hồ"**: bố cục editorial xen kẽ ảnh/chữ, parallax ảnh;
   hoặc timeline ngang (bình minh → cà phê → biển hồ → BBQ hoàng hôn).
7. **Vì sao HOMIX (perks)**: bảng so sánh (đã có) + combo nội khu; thêm hiệu ứng "rẻ hơn tới X" nổi bật.
8. **Quy trình 3 bước** (mới): Khám phá → Đặt lịch/booking → Nhận nhà; icon + line nối động khi cuộn.
9. **Cảm nhận cư dân / social proof** (mới): testimonial card + avatar thật, rating, tên phân khu.
10. **Tiện ích khu vực** (mới, nối map): lưới highlight Vincom/VinUni/Vinmec/biển hồ với ảnh + khoảng cách.
11. **CTA band + newsletter** (mới): dải màu ocean/gradient, "Đặt lịch tham quan" + ô email.
12. **Footer**: giàu hơn (cột link, mạng xã hội, ngôn ngữ, chứng nhận).

## 3. Trang mới (chiều sâu sản phẩm)
- **Chi tiết BĐS `/property/[id]`**: gallery lớn (lightbox), thông số, tiện ích icon, bản đồ vị trí,
  **widget đặt lịch/booking** (nối `createBooking` — API đã sẵn), "căn tương tự".
- **Kết quả tìm kiếm `/search`**: lọc (loại/khoảng giá/phân khu/PN), lưới card, map mini bên cạnh.
- **Luồng booking**: modal chọn ngày/loại → gọi API → màn xác nhận (tính tiền server-side đã có).

## 4. Portal (hiện là placeholder)
- **Host**: dashboard — thẻ KPI (tỉ lệ lấp đầy/doanh thu), danh sách căn, lịch booking, biểu đồ.
- **Agent**: **Kanban leads** (Khách mới → Đang tư vấn → Đã chốt) kéo-thả, panel chi tiết + BĐS gợi ý.

## 5. Motion & micro-interactions (chất "cao cấp")
- Reveal khi cuộn (đã có) áp đồng bộ mọi section; parallax ảnh hero/lifestyle.
- Nút **magnetic** + ripple nhẹ; **card tilt** cho property/perk.
- Đếm số (stats), Ken Burns (hero — đã có), gạch chân nav động (đã có).
- **Chuyển cảnh mượt** giữa route (fade/slide) nếu khả thi với App Router.
- Con trỏ tuỳ biến rất nhẹ ở khu hero (tùy chọn, tắt trên mobile/touch).

## 6. Hình ảnh & nội dung
- Thay nốt ảnh còn placeholder: **nội thất căn hộ** (living/bedroom/kitchen/studio/penthouse),
  **avatar** cư dân/nhân sự, life-dining, villa — dùng ảnh thật OCP1/nội thất cao cấp (ffmpeg nén).
- Rà copywriting: tiêu đề giàu cảm xúc, mô tả ngắn gọn, CTA rõ; đủ VI/EN.

## 7. Chất lượng (bắt buộc)
- **Responsive mobile-first** mọi section (kiểm 375px & 1440px).
- **A11y**: focus ring, keyboard, aria, tương phản; motion tôn trọng reduced-motion.
- **Hiệu năng**: cân nhắc bật lại tối ưu ảnh (đang `unoptimized`), lazy-load, kích thước ảnh hợp lý.
- **Skeleton/empty state** cho các section fetch (hiện trống lúc tải).
- Dark mode pass; i18n không thiếu key.

## 8. Phân đợt (đề xuất ưu tiên)
- **Đợt 1 — Ấn tượng đầu**: design-system polish + motion primitives + Hero dock-search + Trust bar +
  Section "Khám phá theo nhu cầu" + nâng card căn hộ + Quy trình 3 bước + CTA band. (Wow ngay ở trang chủ.)
- **Đợt 2 — Chiều sâu**: `/property/[id]` + `/search` + luồng booking.
- **Đợt 3 — Portal**: Host dashboard + Agent kanban.
- **Đợt 4 — Hoàn thiện**: testimonials + tiện ích khu vực + ảnh thật + dark mode + a11y/perf + QA responsive.

## 9. Verify (mỗi đợt)
- Tự chụp headless (`_shot.mjs`) ở 375px + 1440px; `tsc --noEmit` + `pnpm build` sạch.
- Kiểm booking end-to-end (tạo booking, tính tiền server); kiểm VI/EN + dark mode.

## Cần chốt trước khi làm đợt 1
1. Ưu tiên đợt nào trước? (đề xuất: Đợt 1 để "wow" trang chủ ngay)
2. Mức độ motion: **tinh tế** (đề xuất) hay **mạnh/nổi bật**?
3. Có thêm **section mới nào bắt buộc** không (vd: bảng giá, tin tức, đối tác)?
4. Ảnh nội thất/avatar: tôi tự tìm ảnh thật hay bạn cấp?
