import { pickLocale, type Property, type PropertyStatus } from '@/types'

/** Base URL công khai của site (bỏ dấu "/" cuối để không tạo URL "//..."). */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://homix-seven.vercel.app').replace(
  /\/+$/,
  '',
)

const AVAILABILITY: Record<PropertyStatus, string> = {
  available: 'https://schema.org/InStock',
  reserved: 'https://schema.org/LimitedAvailability',
  unavailable: 'https://schema.org/SoldOut',
}

/** Ảnh phải là URL TUYỆT ĐỐI trong JSON-LD (không được resolve theo metadataBase như OG). */
function absUrl(u: string) {
  return /^https?:\/\//.test(u) ? u : `${SITE_URL}${u.startsWith('/') ? '' : '/'}${u}`
}

/**
 * JSON-LD structured data cho 1 căn (schema.org Product + Offer + AggregateRating).
 * Giúp Google hiện GIÁ + SAO + ẢNH trong kết quả tìm kiếm (rich result).
 * availability phản ánh đúng status để không "báo còn hàng" khi đã đặt/ngừng.
 */
export function propertyJsonLd(p: Property) {
  const name = pickLocale(p.title, 'vi')
  // Offer: bán = giá trọn gói; thuê/lưu trú = giá theo kỳ (UnitPriceSpecification)
  // để Google không hiểu nhầm giá/tháng hay /đêm là giá mua đứt.
  const offer: Record<string, unknown> = {
    '@type': 'Offer',
    priceCurrency: 'VND',
    availability: AVAILABILITY[p.status] ?? AVAILABILITY.available,
    url: `${SITE_URL}/property/${p.id}`,
  }
  if (p.type === 'sale') {
    offer.price = p.priceVnd
  } else {
    offer.priceSpecification = {
      '@type': 'UnitPriceSpecification',
      price: p.priceVnd,
      priceCurrency: 'VND',
      unitText: p.type === 'rent_long' ? 'MONTH' : 'DAY',
    }
  }
  const data: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description: pickLocale(p.description, 'vi').slice(0, 300),
    image: p.images.slice(0, 6).map(absUrl),
    category: 'Real Estate',
    offers: offer,
  }
  // Chỉ gắn rating khi có đủ dữ liệu thật (Google từ chối rating rỗng).
  if (p.ratingAvg != null && (p.reviewCount ?? 0) > 0) {
    data.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: p.ratingAvg,
      reviewCount: p.reviewCount,
      bestRating: 5,
      worstRating: 1,
    }
  }
  return data
}

/**
 * Serialize JSON-LD AN TOÀN để nhúng vào <script>: escape các ký tự có thể phá thẻ
 * (`<`, `>`, `&`) và dấu phân dòng U+2028/U+2029 → chống XSS khi title/description
 * do host nhập chứa "</script>". Dùng thay cho JSON.stringify trần.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}
