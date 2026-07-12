# Plan: Định vị thương hiệu HOMIX rõ ràng ngay từ màn hình đầu

> **Mục tiêu:** Trong 5 giây đầu, người dùng phải trả lời được 3 câu hỏi: *(1) Đây là gì? (2) Mình làm được gì ở đây? (3) Tại sao tin/chọn HOMIX?*
> **Bối cảnh feedback:** "Vào trang web người dùng không biết đây là trang về gì — hơi chung chung."
> **Tài liệu này dành cho Codex review** — nêu chẩn đoán, quyết định định vị, và các thay đổi ở mức file.

---

## 1. Chẩn đoán gốc rễ

### 1.1. Vấn đề #1 — Hero KHÔNG render câu định vị (bug, không phải thiếu nội dung)
Copy định vị **đã tồn tại** trong `locales/vi.json` + `locales/en.json`:
- `hero.title` = "Sống trọn từng khoảnh khắc bên hồ"
- `hero.subtitle` = "Nền tảng bất động sản cao cấp HOMIX — mua, thuê dài hạn và lưu trú ngắn ngày…"

Nhưng `components/home/hero-section.tsx` chỉ render `<Image>` nền + `<SearchBar>`. Toàn bộ `hero.title`, `hero.subtitle`, `hero.eyebrow`, các `hero.stat*` **không được dùng ở đâu cả**. → Người dùng vào trang chỉ thấy ảnh hồ + ô search, không một dòng chữ định vị.

### 1.2. Vấn đề #2 — Xung đột định vị: "dự án đơn lẻ" vs "marketplace"
Copy & số liệu hiện tại mô tả **một khu đô thị ven hồ cụ thể**:
- `hero.eyebrow` = "Đô thị bên hồ"
- `hero.title` = "Sống trọn từng khoảnh khắc bên hồ"
- `hero.statArea` = "Hecta quy hoạch", `hero.statLagoon` = "Ha biển hồ nước mặn", `hero.statTowers` = "Tòa tháp"

Nhưng kiến trúc thực tế (xem `CLAUDE.md`, memory `marketplace-build`) là **sàn giao dịch BĐS 5 portal** với 3 mô hình: **mua / thuê dài hạn / lưu trú ngắn ngày** (tab trong `search-bar.tsx`). Hai thông điệp đá nhau → cảm giác "chung chung". Đây mới là nguyên nhân sâu, không chỉ là thiếu chữ.

**Quyết định định vị (cần Codex xác nhận):** HOMIX là **marketplace BĐS cao cấp** (mua · thuê dài hạn · lưu trú ngắn). "Ven hồ / Ocean Park" chỉ là *nguồn hàng nổi bật*, KHÔNG phải là toàn bộ danh tính. Toàn bộ copy phía dưới đi theo quyết định này.

### 1.3. Đối chiếu Agoda (tham khảo)
Agoda giải quyết "đây là gì" bằng 4 tầng above-the-fold: **(a)** logo + 1 câu định vị; **(b)** widget search với tab tự giải thích ("Hotels / Homes & apts / Flights"); **(c)** dải trust ("hàng triệu chỗ ở · đảm bảo giá · không phí ẩn"); **(d)** deals/điểm đến gợi ý ngay sau đó. HOMIX hiện chỉ có (b) một phần.

---

## 2. Nguyên tắc thiết kế

1. **Copy đã có sẵn thì render, đừng viết mới** trừ khi mâu thuẫn định vị (mục 1.2).
2. **Không phá design system.** Tái dùng `components/luxury/*` (`Typography`, `Container`, `Reveal`, `Section`) và CSS variables trong `app/globals.css` (`@theme inline`). Nếu thêm token → cập nhật đồng bộ cả `lib/design-tokens.ts` (theo CLAUDE.md).
3. **i18n đầy đủ.** Mọi chuỗi mới thêm vào **cả** `locales/vi.json` **và** `locales/en.json`, đọc qua `useT()`. Không hardcode.
4. **Accessibility & LCP.** Hero là LCP → title là text thật (không phải ảnh), giữ `priority` trên `<Image>`, contrast overlay đủ AA.
5. Vietnamese-first cho comment & UI copy (theo CLAUDE.md).

---

## 3. Các thay đổi theo giai đoạn

### 🔴 Phase 1 — Trả lại câu định vị cho Hero (impact cao nhất, chi phí thấp nhất)

**File:** `components/home/hero-section.tsx`
- Thêm khối text phía trên `<SearchBar>` trong `<Container>`:
  - `eyebrow`: nhãn brand + loại hình, ví dụ **"HOMIX · Sàn bất động sản cao cấp"** (thay `hero.eyebrow` "Đô thị bên hồ" — xem Phase 2 về copy).
  - `h1` = `hero.title` — render bằng `components/luxury/typography.tsx` (dùng đúng scale display), màu trắng, `text-balance`.
  - `p` = `hero.subtitle` — max-w ~2xl, `text-white/85`.
- Bọc bằng `Reveal` (đã có) để giữ animation nhất quán; đảm bảo không đẩy LCP quá mốc (text reveal nhẹ, không lazy ảnh).
- Kiểm tra tương phản: khối text nằm vùng tối của gradient (`from-black/75`) — OK, nhưng test trên mobile khi ảnh sáng.

**Acceptance:** Tải `/`, thấy ngay tiêu đề + mô tả nói rõ "sàn BĐS: mua/thuê/lưu trú" trước khi cuộn. Lighthouse LCP không tăng > 200ms so với hiện tại.

### 🟠 Phase 2 — Chuẩn hoá copy định vị (giải quyết xung đột 1.2)

**File:** `locales/vi.json`, `locales/en.json` (sửa song song; `lib/design-tokens.ts` không liên quan).
- `hero.eyebrow`: "Đô thị bên hồ" → **"Sàn bất động sản cao cấp"** (EN: "Premium real estate marketplace").
- `hero.title`: cân nhắc đổi từ thuần cảm xúc sang **định vị + cảm xúc**. Đề xuất giữ chất thơ nhưng thêm rõ chức năng, ví dụ: *"Mua, thuê hay lưu trú — trọn không gian sống cao cấp"* (Codex chọn giữa 2–3 phương án ở mục 6).
- `hero.subtitle`: giữ (đã tốt, đã nêu 3 mô hình).
- **Quyết định về stats:** `statArea/statLagoon/statTowers` là số liệu của *một dự án*. Nếu theo hướng marketplace → đổi sang metric sàn (**số căn đang mở bán/cho thuê**, **số phân khu**, **chủ nhà đã xác thực**) HOẶC giữ nguyên nhưng gắn nhãn "Nguồn hàng nổi bật: Ocean Park". Cần Codex quyết (mục 6).

**Acceptance:** grep không còn chuỗi định vị "đô thị đơn lẻ" mâu thuẫn với tab mua/thuê/lưu trú.

### 🟡 Phase 3 — Dải Trust / Value-props ngay dưới search (Agoda tầng c)

**File mới:** `components/home/value-props-strip.tsx`; render trong `app/page.tsx` ngay sau `<HeroSection>` (hoặc bên trong hero, dưới search).
- 3–4 điểm, mỗi điểm 1 icon (lucide) + 1 dòng:
  1. **1 nền tảng — Mua · Thuê dài hạn · Lưu trú ngắn**
  2. **Chủ nhà & tin đăng được xác thực**
  3. **Giá minh bạch, không phí ẩn** (tính `totalVnd` server-side đã có → nói được thật)
  4. (tuỳ chọn) số liệu sàn từ Phase 2.
- Thêm keys i18n `home.trust.*` (vi/en).
- Layout: `Container` + grid responsive, dùng token màu `muted-foreground`, không tạo màu mới.

**Acceptance:** Hiển thị đúng trên mobile (stack) & desktop (hàng ngang), có bản dịch EN.

### 🟢 Phase 4 — Tab search "biết nói" + Inspiration strip (Agoda tầng b nâng cấp + d)

**File:** `components/home/search-bar.tsx`
- Thêm micro-copy dưới mỗi tab (vd Lưu trú: "Theo đêm, như khách sạn"; Thuê dài hạn: "Hợp đồng ≥ 6 tháng"; Mua bán: "Sở hữu lâu dài"). Keys `search.tabHint*`.
- Tăng độ tương phản pill tab chưa chọn trên nền ảnh (hiện `bg-white/10` hơi mờ).

**File (tuỳ chọn):** tái dùng `featured-properties-section.tsx` hoặc thêm "Phân khu nổi bật / Ưu đãi lưu trú" dạng card cuộn ngang ngay sau value-props → tín hiệu "marketplace có hàng thật". Dữ liệu qua `propertyService` (không fetch inline, theo CLAUDE.md).

**Acceptance:** Mỗi tab tự giải thích mô hình mà không cần click.

---

## 4. Thứ tự & phạm vi ảnh hưởng

| Phase | File chính | Rủi ro | Ưu tiên |
|------|-----------|--------|---------|
| 1 | `hero-section.tsx` | Thấp (chỉ thêm markup) | Bắt buộc |
| 2 | `locales/{vi,en}.json` | Thấp–TB (quyết định copy) | Bắt buộc |
| 3 | `value-props-strip.tsx` (mới), `page.tsx` | Thấp | Nên |
| 4 | `search-bar.tsx`, section inspiration | TB | Tuỳ chọn |

Phase 1+2 nên đi cùng một PR (fix trực tiếp feedback). Phase 3, 4 tách PR sau.

---

## 5. Kiểm thử / verify
- `pnpm exec tsc --noEmit` (build bỏ qua lỗi TS → phải check tay, theo CLAUDE.md).
- `pnpm lint`.
- Chạy `/` ở cả `vi` và `en`, light & dark theme, mobile + desktop.
- Lighthouse: LCP, contrast (AA) cho khối text hero.
- Grep chuỗi hardcode: đảm bảo dùng `useT()`.

---

## 6. Điểm cần Codex quyết trước khi code
1. **Định vị chốt:** "Marketplace BĐS cao cấp (mua/thuê/lưu trú), Ocean Park là nguồn hàng nổi bật" — đồng ý?
2. **`hero.title`:** giữ nguyên chất thơ | đổi sang định vị-rõ | phương án lai. (Đề xuất: lai.)
3. **Hero stats:** đổi sang metric sàn | giữ metric dự án có gắn nhãn | bỏ hẳn.
4. **Vị trí value-props:** trong hero (dưới search) hay là section riêng ngay sau hero.
