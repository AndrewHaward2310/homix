# Plan sửa: Rebrand HOMIX · Typography · Map giống Vinhomes

Mục tiêu: xử lý các phản hồi mới nhất của chủ dự án. Chưa code — chờ review (Codex) rồi mới thực thi.

## Bối cảnh / vấn đề
- Thương hiệu thật là **HOMIX** (đang hiển thị tạm "Ocean Park"). Cần logo nhận diện + đổi tên toàn site.
- Kiểu chữ hiện tại (Geist) bị chê xấu → đổi sang font hiện đại/sang hơn.
- Map (`components/home/masterplan/masterplan-locator.tsx`) chưa bằng `maps-vh.vinhomes.vn/ocp1`:
  - **Khung lệch**: `MAP_MAX_BOUNDS` đang hardcode `[[105.935,20.968],[105.976,20.998]]` — quá rộng, bao cả vùng không liên quan, OCP1 không nằm giữa.
  - Pin **hiện nhãn tên cố định** → rối; Vinhomes để trống, chỉ hiện tên khi **hover**.
  - Thanh search + filter đang ở **giữa trên**; Vinhomes để **góc trái trên**.
  - Có chữ tiêu đề overlay góc trái ("Định vị tổ ấm…") cần bỏ, nhường chỗ cho search.
  - Một số POI toạ độ lệch ra ngoài lõi OCP1 → tạm loại bỏ.

## Hạng mục & cách làm

### 1. Rebrand → HOMIX
- Tạo `components/luxury/logo.tsx`: logo SVG (mark hình học + wordmark "HOMIX"), nhận `variant` (light/dark) + `size`. Dùng brand color `#0B5C63`.
- Thay text thương hiệu ở: `glass-navbar.tsx`, `site-footer.tsx`, `portal-header.tsx`, `app/login/page.tsx` → dùng `<Logo/>`.
- Đổi `common.brand` trong `locales/{vi,en}.json` thành "HOMIX". Rà các chỗ dùng chuỗi "Ocean Park" làm tên thương hiệu (giữ "Ocean Park" ở nội dung mô tả dự án nếu là tên khu, nhưng thương hiệu nền tảng = HOMIX — cần chốt với chủ).
- Cập nhật `app/layout.tsx` metadata title + `public/icon.svg` (favicon) theo logo mới.

### 2. Typography
- Đổi font trong `app/layout.tsx`: bỏ `Geist`, dùng **Plus Jakarta Sans** (hoặc Manrope) qua `next/font/google`, giữ biến CSS `--font-geist-sans` (để không phải sửa `globals.css`) hoặc đổi tên biến cho sạch.
- Cân nhắc font hiển thị (display) riêng cho heading để sang hơn — sẽ chốt 1 phương án ở phần review.

### 3. Map — sửa khung (framing)
- Tính bbox từ **dữ liệu POI thật** (đã phân tích: lõi p1–p99 lng[105.934,105.960] lat[20.988,21.003]) + 5 toạ độ tháp, thay `MAP_MAX_BOUNDS` bằng hộp bó sát lõi OCP1, có padding nhỏ.
- Đặt `MAP_DEFAULT_VIEW.center` = tâm lõi, chỉnh `zoom` để `fitBounds` khít khu (không lố ra Kiêu Ky/Dương Xá).
- Siết `MAP_MIN_ZOOM` để không zoom-out lộ vùng ngoài.

### 4. Map — pin sạch + tooltip hover (giống Vinhomes)
- **Bỏ `text-field`** (nhãn tên cố định) khỏi layer `poi-dot` → map gọn như Vinhomes.
- Thêm **hover tooltip**: `map.on('mousemove','poi-dot', …)` tạo `maplibregl.Popup` (không nút đóng, `closeButton:false`) hiển thị **tên + nhóm** (và địa chỉ nếu có); `mouseleave` thì remove. Style popup nhẹ, bo tròn.

### 5. Map — chuyển search sang góc trái + bỏ tiêu đề
- Xoá block tiêu đề overlay góc trái (eyebrow/title/subtitle "Định vị tổ ấm…") trong `masterplan-locator.tsx`.
- Di chuyển cụm **search + chip lọc** từ `top-center` → **`absolute left-4 top-4`** (desktop `left-6 top-6`), style pill trắng giống thanh của Vinhomes (ô tìm + các nhóm lọc).
- Cân nhắc gộp 9 nhóm thành các dropdown như Vinhomes ("Tiện ích giao thông ▾", "công viên ▾", "Cửa hàng ▾", "Địa điểm khác ▾") — hoặc giữ chip nhưng đặt gọn góc trái. Chốt ở review.

### 6. Loại POI toạ độ sai (tạm thời)
- Lọc `public/data/ocp1-pois.json`: bỏ ~24 điểm ngoài hộp lõi (p1–p99) để hết pin lạc + khung khỏi bị kéo rộng. Giữ script lọc để tái tạo khi cần.

### 7. Thanh search hero (trang chủ)
- Tinh chỉnh typography theo font mới; rà lại spacing/ҳhero search cho hiện đại hơn (đã là thanh trắng có icon — chủ yếu áp font mới + cân chỉnh).

## File đụng tới
`components/luxury/logo.tsx` (mới), `glass-navbar.tsx`, `components/home/site-footer.tsx`, `components/auth/portal-header.tsx`, `app/login/page.tsx`, `app/layout.tsx`, `public/icon.svg`, `locales/{vi,en}.json`, `services/propertyService.ts` (bounds), `components/home/masterplan/masterplan-locator.tsx` (tooltip/label/search vị trí), `public/data/ocp1-pois.json` (lọc), `app/globals.css` (nếu đổi biến font).

## Verify (tôi tự chụp bằng headless Chrome `_shot.mjs`)
- Map: khung khít OCP1 (không lộ Kiêu Ky/Dương Xá); pin không nhãn; hover ra tooltip tên; search ở góc trái; không còn tiêu đề trái.
- Rebrand: logo HOMIX ở navbar (light/scrolled), footer, login, portal.
- Font mới áp toàn site; `tsc --noEmit` sạch; build sạch.

## Cập nhật sau review của Codex (điều chỉnh kỹ thuật)
- **Bounds tách 2 loại**: `CONTENT_BOUNDS` (bbox nội dung để `fitBounds`) và `PAN_MAX_BOUNDS` (rộng hơn ~10–15%, dùng cho `maxBounds`). Lưu ý `maxBounds` chỉ giới hạn **tâm camera**, không chặn viewport lộ vùng ngoài → PAN_MAX_BOUNDS phải rộng hơn.
- **Framing responsive**: initial view + reset tính bằng `fitBounds(CONTENT_BOUNDS, {padding})` sau `load`/`resize`, padding theo breakpoint; không phụ thuộc `minZoom` cứng (chỉ đặt minZoom "sàn" an toàn).
- **Tooltip hover**: tạo **1** `Popup` duy nhất qua `useRef`, `mousemove` chỉ cập nhật `setLngLat`+nội dung; **escape** text (dùng DOM node, không `setHTML` chuỗi thô — data POI có ký tự `<...>`); remove khi `mouseleave`/đổi filter/ẩn layer/unmount. **Hỗ trợ tap trên mobile** + đóng bằng `Escape`. Tránh tooltip che search.
- **Cleanup**: `setup()` async cần cờ `cancelled` (map có thể bị remove trước khi ảnh icon load xong); gỡ mọi `map.on(...)` khi cleanup.
- **Search góc trái responsive**: `left-4 right-4 md:right-auto md:w-[440px]`, không đè navbar/controls; cân nhắc safe-area.
- **Font**: khai báo `subsets:['latin','vietnamese']`; **đổi tên biến CSS** cho sạch (không giữ `--font-geist-sans`) → sửa cả `globals.css`; giữ mono riêng.
- **Rebrand full-repo**: quét cả metadata, `aria-label="Ocean Park map"`, class `ocean-pill`, favicon PNG/apple-icon, alt ảnh, SEO — không chỉ vài file.
- **Không xoá POI gốc**: giữ file gốc, sinh `ocp1-pois.json` đã lọc bằng script (kèm tiêu chí bbox + thống kê) để tái tạo được.
- **Logo tương phản**: kiểm variant theo nền thật (navbar transparent/scrolled, dark mode, size nhỏ).
- **Filter UX**: gộp 9 nhóm vào **1 dropdown "Tiện ích"** thay vì 9 chip (đỡ chiếm bản đồ).
- **Verify thêm**: mobile 375px + desktop 1440px, dark mode, keyboard/focus, VI/EN; assert mọi POI/tower nằm trong `CONTENT_BOUNDS`; reset view chạy đúng ở 2 breakpoint.

## Cần chủ dự án chốt (ở bước review)
1. Font: **Plus Jakarta Sans** hay Manrope/khác? Có muốn heading dùng font riêng (vd serif sang) không?
2. Logo HOMIX: phong cách **mark hình học tối giản** (đề xuất) hay wordmark thuần? Tông màu giữ ocean `#0B5C63` hay đổi?
3. Filter map: gộp thành 4 dropdown như Vinhomes hay giữ chip 9 nhóm gọn góc trái?
4. "Ocean Park" trong nội dung: chỉ đổi **tên thương hiệu nền tảng** thành HOMIX, còn tên khu đô thị vẫn là Vinhomes Ocean Park — đúng không?
