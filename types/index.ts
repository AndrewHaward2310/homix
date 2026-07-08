// ============================================================================
// Ocean Park — Data Contract dùng chung cho toàn bộ project
// Bước này KHÔNG build UI. Chỉ định nghĩa kiểu dữ liệu (types) + mock mẫu.
// Mọi màn hình import từ đây để đảm bảo thống nhất shape dữ liệu.
// ============================================================================

// ---------------------------------------------------------------------------
// Vai trò người dùng
// ---------------------------------------------------------------------------
export type Role = 'customer' | 'host' | 'agent' | 'admin'

/** Chức năng của nhân sự vận hành (agent): bán hàng / chăm sóc / cả hai. */
export type AgentFunction = 'sales' | 'care' | 'both'

// ---------------------------------------------------------------------------
// Nội dung ĐỘNG đa ngôn ngữ (title, description, tên tiện ích...).
// KHÁC với chữ giao diện TĨNH (nút, nhãn) — thứ nằm trong locales/*.json.
// vi/en là bắt buộc; ko/zh tùy chọn.
// ---------------------------------------------------------------------------
export type LocalizedText = {
  vi: string
  en: string
  ko?: string
  zh?: string
}

/** Mã ngôn ngữ được hỗ trợ ở tầng dữ liệu động. */
export type LocaleCode = 'vi' | 'en' | 'ko' | 'zh'

// ---------------------------------------------------------------------------
// Người dùng
// ---------------------------------------------------------------------------
export type User = {
  id: string
  name: string
  email: string
  role: Role
  avatarUrl: string
  phone?: string
  /** Ngôn ngữ ưu tiên khi hiển thị nội dung động. */
  preferredLocale: LocaleCode
  /** Chỉ với role 'agent': quyết định các tab được thấy ở Operations portal. */
  agentFunction?: AgentFunction
}

// ---------------------------------------------------------------------------
// Tòa tháp trong khu đô thị
// ---------------------------------------------------------------------------
export type TowerStatus = 'selling' | 'sold_out' | 'coming_soon'

export type Tower = {
  id: string
  name: string
  /** Tọa độ [lat, lng] để đặt marker trên bản đồ. */
  coords: [number, number]
  priceFromVnd: number
  status: TowerStatus
  image: string
}

// ---------------------------------------------------------------------------
// Bất động sản (căn hộ / shophouse ...)
// ---------------------------------------------------------------------------
export type PropertyType = 'sale' | 'rent_long' | 'stay_short'
export type PropertyStatus = 'available' | 'reserved' | 'unavailable'

export type Property = {
  id: string
  /** Mã căn hộ nội bộ, ví dụ "S1.05-1203". */
  code: string
  title: LocalizedText
  description: LocalizedText
  type: PropertyType
  towerId: string
  areaM2: number
  bedrooms: number
  bathrooms: number
  /**
   * Với sale: giá bán. Với rent_long: giá thuê/tháng.
   * Với stay_short: giá thuê/đêm. Đơn vị VND.
   */
  priceVnd: number
  images: string[]
  /** Danh sách id tiện ích (khớp với Amenity ở tầng UI/locale nếu cần). */
  amenities: string[]
  status: PropertyStatus
  hostId: string
  /** Tin đã được kiểm duyệt/xác minh. */
  verified: boolean
  /** Điểm đánh giá trung bình (denormalize từ Review, do server tính). */
  ratingAvg?: number
  reviewCount?: number
}

// ---------------------------------------------------------------------------
// Yêu thích (favorite) & Đánh giá (review)
// ---------------------------------------------------------------------------
export type Favorite = {
  id: string
  userId: string
  propertyId: string
  createdAt: string
}

export type Review = {
  id: string
  propertyId: string
  customerId: string
  customerName: string
  avatarUrl?: string
  /** 1..5 */
  rating: number
  comment: string
  createdAt: string
}

/** Khoảng ngày đã bị đặt (chặn trên lịch), suy từ Booking stay_short. YYYY-MM-DD. */
export type AvailabilityRange = { from: string; to: string }

// ---------------------------------------------------------------------------
// Đặt chỗ: mua/thuê dài hạn (viewing) hoặc lưu trú ngắn ngày (check-in/out)
// ---------------------------------------------------------------------------
export type BookingType = PropertyType
export type BookingStatus =
  | 'pending'
  | 'approved'
  | 'declined'
  | 'cancelled'
  | 'completed'

export type Booking = {
  id: string
  propertyId: string
  customerId: string
  type: BookingType
  /** stay_short: ngày nhận phòng. */
  checkIn?: string
  /** stay_short: ngày trả phòng. */
  checkOut?: string
  /** sale / rent_long: thời điểm hẹn xem nhà (ISO). */
  viewingAt?: string
  status: BookingStatus
  totalVnd: number
  createdAt: string
}

// ---------------------------------------------------------------------------
// Lead: khách hàng tiềm năng do chuyên viên (agent) chăm sóc
// ---------------------------------------------------------------------------
export type LeadStage = 'new' | 'consulting' | 'closed'

export type Lead = {
  id: string
  customerName: string
  /** SĐT hoặc email liên hệ. */
  contact: string
  needSummary: string
  stage: LeadStage
  assignedAgentId: string
  matchedPropertyIds: string[]
}

// ---------------------------------------------------------------------------
// Perk: dịch vụ/tiện ích cộng thêm có thể mua kèm
// ---------------------------------------------------------------------------
export type PerkCategory = 'bbq' | 'lake_ticket' | 'vehicle' | 'other'

export type Perk = {
  id: string
  name: LocalizedText
  priceVnd: number
  category: PerkCategory
}

// ---------------------------------------------------------------------------
// Tiện ích định dạng
// ---------------------------------------------------------------------------

/** Bản đồ locale dữ liệu -> locale chuẩn Intl. */
const INTL_LOCALE: Record<LocaleCode, string> = {
  vi: 'vi-VN',
  en: 'en-US',
  ko: 'ko-KR',
  zh: 'zh-CN',
}

/**
 * Định dạng số tiền VND theo ngôn ngữ.
 * Luôn hiển thị đơn vị VND (currency: 'VND'), không có phần thập phân.
 */
export function formatMoney(amountVnd: number, locale: LocaleCode = 'vi'): string {
  return new Intl.NumberFormat(INTL_LOCALE[locale] ?? 'vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amountVnd)
}

/** Lấy nội dung động theo ngôn ngữ, fallback vi -> en. */
export function pickLocale(text: LocalizedText, locale: LocaleCode = 'vi'): string {
  return text[locale] ?? text.vi ?? text.en
}
