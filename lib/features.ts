// ============================================================================
// Feature flags theo biến môi trường — triết lý "CÓ KEY THÌ BẬT, THIẾU THÌ FALLBACK".
// UI/route gọi các hàm này để quyết định dùng tính năng thật hay bản demo/fallback,
// KHÔNG bao giờ crash vì thiếu key. Đồng bộ với isStorageConfigured() ở lib/storage.ts.
//
// Lưu ý phạm vi:
//  - `NEXT_PUBLIC_*` được Next inline vào client → đọc được ở CẢ client và server.
//  - Các key còn lại chỉ tồn tại phía SERVER → hàm tương ứng luôn trả false nếu gọi
//    trên client (đúng ý: client không cần biết secret). Chỉ dùng chúng trong
//    route handler / server component.
// ============================================================================

/** Key Google Maps (client-safe). Rỗng nếu chưa cấu hình. */
export const googleMapsKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''

/** Có bật bản đồ Google thật không (thiếu → giữ maplibre). Dùng được ở client. */
export function isGoogleMapsEnabled(): boolean {
  return googleMapsKey.length > 0
}

/** AI (Anthropic Claude) cho blog/tóm tắt tin — SERVER ONLY. */
export function isAnthropicEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY)
}

/** Danh sách RSS nguồn tin BĐS (ngăn bằng dấu phẩy). SERVER ONLY. */
export function blogRssFeeds(): string[] {
  return (process.env.BLOG_RSS_FEEDS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

/** Gửi email xác nhận thật (Resend) — SERVER ONLY. Thiếu → chỉ mô phỏng. */
export function isEmailEnabled(): boolean {
  return Boolean(process.env.RESEND_API_KEY)
}

/** Gửi SMS thật (Twilio) — SERVER ONLY. Cần đủ 3 biến. Thiếu → chỉ mô phỏng. */
export function isSmsEnabled(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM,
  )
}

/** Thanh toán thật (VNPay) — SERVER ONLY. Thiếu → thanh toán demo, không trừ tiền. */
export function isPaymentEnabled(): boolean {
  return Boolean(process.env.VNPAY_TMN_CODE && process.env.VNPAY_HASH_SECRET)
}
