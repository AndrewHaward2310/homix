# Nâng cấp bản đồ — "wow" hơn (nghiên cứu + lộ trình)

Mục tiêu: map trang chủ **ấn tượng hơn** và **bớt rối**. Dưới đây là kết quả *nghiên cứu thực tế* trên chính vector tiles của Vinhomes (không phỏng đoán).

## Nghiên cứu — cái gì THỰC SỰ có trong dữ liệu

Kiểm tra `style.json` + `data.json` + `queryRenderedFeatures` trực tiếp trên map đang chạy:

| Phát hiện | Kết luận |
|---|---|
| Style có sẵn lớp **`building-3d`** (fill-extrusion) nhưng đặt `visibility: "none"` | **Bật lên là có 3D thật** — không phải phỏng đoán |
| Source-layer `building` có **603–721 polygon** với **`render_height` / `render_min_height` thật** (shophouse ~3.6m, cao tầng cao hơn) | Đủ dữ liệu dựng khối 3D cả khu đô thị |
| Style **không có `sky`** → nghiêng camera thì chân trời bị cụt | Thêm `map.setSky()` → chiều sâu ngay |
| Có 1 raster source **`map-raster/ocp3`** (ảnh phối cảnh minh hoạ) | **Không dùng được**: tile z≥14 đều 404 (chỉ z12 trả về), không có công khai |
| POI đang ép `icon-allow-overlap: true` | Nguyên nhân **"rối"**: 696 pin hiện cùng lúc, tắt cơ chế tránh chồng của MapLibre |
| maplibre-gl **5.24** | Hỗ trợ `setSky`, fill-extrusion, flyTo curve, (globe/terrain nếu cần) |

## ĐÃ LÀM trong đợt này (đã verify bằng screenshot)

1. **Hết rối** — bỏ `allow-overlap`, bật **collision** + `icon-padding` giãn theo zoom (22→3) + `symbol-sort-key` ưu tiên landmark (giao thông/mua sắm/hồ/giải trí). Tổng quan giờ thưa, thoáng; zoom vào lộ dần tiện ích.
2. **3D thật** — bật `building-3d` (đang bị tắt) + tăng opacity/gradient dọc + nống nhẹ chiều cao + màu theo sáng/tối. Zoom vào phân khu → cả cụm nhà (kể cả tháp Sapphire) dựng khối 3D.
3. **Bầu trời + sương** — `setSky()` tông sáng/tối, mờ dần khi nhìn từ trên → chiều sâu khi nghiêng.
4. **Bay vào điện ảnh** — vào trang: camera từ tầm cao/phẳng **hạ xuống nghiêng dần** vào OCP1 (2.6s, curve). Tôn trọng `prefers-reduced-motion` (tắt animation → khung tĩnh).
5. **Chọn phân khu** bay nghiêng sâu hơn (pitch 60, zoom 15.8) để khoe 3D.
6. **Theo theme** — đổi sáng/tối vẽ lại sky + màu nhà (MutationObserver).

## CÒN CÓ THỂ LÀM (chọn tiếp)

**A. Dark-map style thật** *(đáng làm nhất cho dark mode)* — hiện dark mode map vẫn là tile SÁNG bị làm dịu bằng CSS filter. Làm bản đồ tối đúng nghĩa = override paint các lớp nền (`background/water/landuse/road/building`) sang bảng tối. Trung–cao effort, ăn khớp dark mode đã có.

**B. Làm nổi khối nhà của phân khu đang chọn** — click 1 phân khu → tô **màu brand** cho cụm nhà thuộc phân khu đó (các lớp khác xám mờ). Cần gán building→tower theo vùng (bbox/tên `house_number` như "SH…", "Sapphire S1.xx"). Hiệu ứng "khoanh vùng" rất wow.

**C. Chip khoảng cách/thời gian** — trên popup phân khu: "3 phút tới VinUni · 5 phút tới TTTM" tính từ toạ độ thật (đường chim bay hoặc route). Dữ liệu thật, không bịa.

**D. Toạ độ căn hộ trên map (search-as-you-move)** — cần thêm lat/lng cho Property; kéo map tới đâu lọc căn tới đó. (Đã nằm trong backlog riêng.)

**E. Nhãn landmark ở mức tổng quan** — hiện tên POI chỉ hiện khi hover. Có thể cho **vài landmark lớn** (hồ, trường, TTTM) hiện nhãn cố định ở overview cho dễ định hướng (collision-managed).

## Cạm bẫy đã ghi nhận
- Raster phối cảnh `ocp3` **không lấy được** → đừng phụ thuộc.
- 3D chỉ rõ khi **zoom ≥ ~15**; ở overview nhìn cả 5 phân khu nên khối nhà nhỏ (đánh đổi có chủ đích: overview để định vị, drill-in để "wow").
- Dark-map hiện chỉ *làm dịu* bằng CSS filter — chưa phải style tối thật (mục A).
