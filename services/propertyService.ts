// ============================================================================
// Ocean Park — Property service (client → API)
// Mọi màn hình gọi qua service này thay vì import mock trực tiếp. Trước đây trả
// mock; nay fetch Route Handlers dưới app/api/*. Shape trả về GIỮ NGUYÊN.
// ============================================================================

import type {
  AvailabilityRange,
  Property,
  PropertyStatus,
  PropertyType,
  Review,
  Tower,
  TowerStatus,
} from '@/types'

/** Toạ độ địa lý [lng, lat] cho marker trên bản đồ MapLibre. */
export type LngLat = [number, number]

/** Tâm & góc nhìn mặc định của bản đồ (tâm cụm dữ liệu thật của OCP1). */
export const MAP_DEFAULT_VIEW = {
  center: [105.9472, 20.9955] as LngLat,
  zoom: 13.9,
  pitch: 45,
  bearing: -14,
}

/** Style bản đồ nền (Vinhomes GL). TODO: đổi sang style/tiles nội bộ nếu cần. */
export const MAP_STYLE_URL = 'https://vh.vinhomes.vn/apps/gl/styles/basic/style.json'

/**
 * CONTENT_BOUNDS — bbox thực của toàn bộ POI/tháp OCP1 (suy từ dữ liệu thật).
 * Dùng cho fitBounds (khung nhìn ban đầu + reset) để luôn canh giữa khu đô thị.
 * [ [swLng, swLat], [neLng, neLat] ].
 */
export const MAP_CONTENT_BOUNDS: [[number, number], [number, number]] = [
  [105.9347, 20.9881],
  [105.9596, 21.0028],
]

/**
 * PAN_MAX_BOUNDS — giới hạn kéo camera, RỘNG HƠN content ~15%. Lưu ý: maxBounds
 * chỉ chặn TÂM camera nên phải nới thêm để viewport không "kẹt" khi kéo/nghiêng.
 */
export const MAP_MAX_BOUNDS: [[number, number], [number, number]] = [
  [105.9290, 20.9850],
  [105.9655, 21.0060],
]

/** Zoom: sàn để không lộ vùng ngoài; trần để xem từng tiện ích. */
export const MAP_MIN_ZOOM = 12.8
export const MAP_MAX_ZOOM = 18

// ---------------------------------------------------------------------------
// Lớp POI tiện ích — dữ liệu THẬT của Vinhomes cho OCP1 (696 điểm), đã trích 1 lần
// và "nướng" vào public/data/ocp1-pois.json (không phụ thuộc API lúc chạy).
// Mỗi feature: { name, cat, type }. Render dạng cluster + màu theo nhóm.
// Nguồn: API coms/maps utilities/all (areaId 19) — xem memory ghi chú cách lấy lại.
// ---------------------------------------------------------------------------

/** GeoJSON POI thật của OCP1 (đặt trong /public để fetch tĩnh). */
export const POI_GEOJSON_URL = '/data/ocp1-pois.json'

/** Nhóm tiện ích, suy từ utilityType của Vinhomes. */
export type AmenityCategory =
  | 'service'
  | 'bbq'
  | 'sport'
  | 'transport'
  | 'food'
  | 'retail'
  | 'water'
  | 'entertainment'
  | 'other'

/** Metadata hiển thị cho từng nhóm (màu chấm + nhãn song ngữ). */
export const AMENITY_CATEGORY_META: Record<
  AmenityCategory,
  { label: { vi: string; en: string }; color: string }
> = {
  service: { label: { vi: 'Dịch vụ', en: 'Services' }, color: '#2563EB' },
  bbq: { label: { vi: 'BBQ ven hồ', en: 'BBQ' }, color: '#C2410C' },
  sport: { label: { vi: 'Thể thao', en: 'Sport' }, color: '#7C3AED' },
  transport: { label: { vi: 'Giao thông', en: 'Transport' }, color: '#475569' },
  food: { label: { vi: 'Ẩm thực', en: 'Food & drink' }, color: '#D97706' },
  retail: { label: { vi: 'Mua sắm', en: 'Shopping' }, color: '#0891B2' },
  water: { label: { vi: 'Câu cá / hồ', en: 'Lake' }, color: '#0E7490' },
  entertainment: { label: { vi: 'Giải trí', en: 'Entertainment' }, color: '#DB2777' },
  other: { label: { vi: 'Khác', en: 'Other' }, color: '#0B5C63' },
}

/** Thứ tự nhóm hiển thị trong legend (theo mật độ điểm). */
export const AMENITY_CATEGORY_ORDER: AmenityCategory[] = [
  'service', 'bbq', 'sport', 'transport', 'food', 'retail', 'water', 'entertainment', 'other',
]

/** Tòa tháp phục vụ <MasterplanLocator /> (bản đồ MapLibre). */
export type MasterplanTower = {
  id: string
  name: string
  lngLat: LngLat
  status: TowerStatus
  priceFromVnd: number
  image: string
  /** Khoảng số phòng ngủ (min–max) để hiển thị trong popup. */
  bedroomsRange: { min: number; max: number }
  /** 2–3 id tiện ích nổi bật để render icon trong popup. */
  amenities: string[]
}

/** Bộ lọc danh sách bất động sản (khớp query của GET /api/properties). */
export type PropertyFilters = {
  type?: PropertyType
  towerId?: string
  status?: PropertyStatus
  hostId?: string
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`GET ${url} thất bại (${res.status})`)
  return res.json() as Promise<T>
}

/** Danh sách bất động sản, có thể lọc theo type/tower/status/host. */
export async function getProperties(filters: PropertyFilters = {}): Promise<Property[]> {
  const qs = new URLSearchParams(
    Object.entries(filters).filter(([, v]) => v != null) as [string, string][],
  ).toString()
  const data = await getJson<{ properties: Property[] }>(
    `/api/properties${qs ? `?${qs}` : ''}`,
  )
  return data.properties
}

/** Một bất động sản theo id. */
export async function getProperty(id: string): Promise<Property> {
  const data = await getJson<{ property: Property }>(`/api/properties/${id}`)
  return data.property
}

/** Bộ lọc tìm kiếm (khớp query GET /api/properties). */
export type SearchFilters = {
  type?: PropertyType
  towerId?: string
  q?: string
  minPrice?: number
  maxPrice?: number
  beds?: number
  baths?: number
  minArea?: number
  maxArea?: number
  amenities?: string[]
  sort?: 'relevant' | 'price_asc' | 'price_desc' | 'newest' | 'top_rated'
  page?: number
  pageSize?: number
  exclude?: string
}

export type SearchResult = {
  items: Property[]
  total: number
  page: number
  pageSize: number
}

function filtersToParams(f: SearchFilters): string {
  const p = new URLSearchParams()
  if (f.type) p.set('type', f.type)
  if (f.towerId) p.set('towerId', f.towerId)
  if (f.q) p.set('q', f.q)
  if (f.minPrice != null) p.set('minPrice', String(f.minPrice))
  if (f.maxPrice != null) p.set('maxPrice', String(f.maxPrice))
  if (f.beds != null) p.set('beds', String(f.beds))
  if (f.baths != null) p.set('baths', String(f.baths))
  if (f.minArea != null) p.set('minArea', String(f.minArea))
  if (f.maxArea != null) p.set('maxArea', String(f.maxArea))
  if (f.amenities?.length) p.set('amenities', f.amenities.join(','))
  if (f.sort) p.set('sort', f.sort)
  if (f.exclude) p.set('exclude', f.exclude)
  if (f.page) p.set('page', String(f.page))
  if (f.pageSize) p.set('pageSize', String(f.pageSize))
  return p.toString()
}

/** Tìm kiếm có lọc/sắp xếp/phân trang → { items, total, page, pageSize }. */
export async function searchProperties(f: SearchFilters = {}): Promise<SearchResult> {
  const qs = filtersToParams(f)
  const data = await getJson<{ properties: Property[]; total: number; page: number; pageSize: number }>(
    `/api/properties${qs ? `?${qs}` : ''}`,
  )
  return { items: data.properties, total: data.total, page: data.page, pageSize: data.pageSize }
}

/** Đánh giá của một căn. */
export async function getReviews(id: string): Promise<Review[]> {
  const data = await getJson<{ reviews: Review[] }>(`/api/properties/${id}/reviews`)
  return data.reviews
}

export type SubmitReviewResult =
  | { ok: true; reviews: Review[]; property: Property }
  | { ok: false; error: string }

/** Gửi đánh giá (sao + bình luận + ảnh khách chụp). Trả review + property đã cập nhật. */
export async function submitReview(
  id: string,
  input: { rating: number; comment: string; files: File[] },
): Promise<SubmitReviewResult> {
  const fd = new FormData()
  fd.set('rating', String(input.rating))
  fd.set('comment', input.comment)
  input.files.forEach((f) => fd.append('images', f))
  const res = await fetch(`/api/properties/${id}/reviews`, { method: 'POST', body: fd })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) return { ok: false, error: data.error ?? 'Gửi đánh giá thất bại.' }
  return { ok: true, reviews: data.reviews as Review[], property: data.property as Property }
}

/** Khoảng ngày đã bị đặt (chặn lịch) của một căn. */
export async function getAvailability(id: string): Promise<AvailabilityRange[]> {
  const data = await getJson<{ blocked: AvailabilityRange[] }>(
    `/api/properties/${id}/availability`,
  )
  return data.blocked
}

/** Căn tương tự (cùng loại, khác id). */
export async function getSimilar(property: Property, limit = 4): Promise<Property[]> {
  const { items } = await searchProperties({
    type: property.type,
    exclude: property.id,
    pageSize: limit,
  })
  return items
}

async function parseError(res: Response): Promise<never> {
  const body = (await res.json().catch(() => null)) as { error?: string } | null
  throw new Error(body?.error ?? `Thao tác thất bại (${res.status})`)
}

/** Upload thêm ảnh cho 1 căn (admin/host sở hữu) → trả Property đã cập nhật. */
export async function uploadPropertyImages(id: string, files: File[]): Promise<Property> {
  const fd = new FormData()
  files.forEach((f) => fd.append('files', f))
  const res = await fetch(`/api/properties/${id}/images`, { method: 'POST', body: fd })
  if (!res.ok) await parseError(res)
  return ((await res.json()) as { property: Property }).property
}

/** Sắp xếp lại thứ tự ảnh (ảnh đầu = ảnh bìa) → trả Property đã cập nhật. */
export async function reorderPropertyImages(id: string, images: string[]): Promise<Property> {
  const res = await fetch(`/api/properties/${id}/images`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ images }),
  })
  if (!res.ok) await parseError(res)
  return ((await res.json()) as { property: Property }).property
}

/** Xoá 1 ảnh của căn → trả Property đã cập nhật. */
export async function deletePropertyImage(id: string, url: string): Promise<Property> {
  const res = await fetch(`/api/properties/${id}/images`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  })
  if (!res.ok) await parseError(res)
  return ((await res.json()) as { property: Property }).property
}

/** Danh sách tòa tháp (shape Tower cơ bản) — cho search-bar & tra cứu theo id. */
export async function getTowers(): Promise<Tower[]> {
  const data = await getJson<{ towers: Tower[] }>('/api/towers')
  return data.towers
}

/** Tòa tháp cho MasterplanLocator (kèm toạ độ bản đồ + metadata popup). */
export async function getMasterplanTowers(): Promise<MasterplanTower[]> {
  const data = await getJson<{ towers: MasterplanTower[] }>('/api/towers/masterplan')
  return data.towers
}

export const propertyService = {
  getProperties,
  getProperty,
  searchProperties,
  getReviews,
  submitReview,
  getAvailability,
  getSimilar,
  getTowers,
  getMasterplanTowers,
  uploadPropertyImages,
  reorderPropertyImages,
  deletePropertyImage,
}
