// ============================================================================
// Ocean Park — Nguồn ảnh dùng chung (single source of truth cho asset tĩnh).
// Tách riêng để dễ thay bằng CDN / API sau này.
// TODO: thay đường dẫn cục bộ bằng URL CDN của tôi khi lên production.
// ============================================================================

export const images = {
  /** Ảnh phối cảnh tổng thể (bird's-eye) cho <MasterplanLocator />. */
  masterplan: '/images/masterplan-oceanpark.png',
  /** Ảnh nền dự phòng khi thiếu masterplan. */
  masterplanFallback: '/images/amenity-park.png',
  hero: '/images/hero-lakeside.png',
} as const

export type ImageKey = keyof typeof images
