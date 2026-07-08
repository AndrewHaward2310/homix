import type { LocaleCode } from '@/types'

// ============================================================================
// Ocean Park — Cấu hình i18n
// Kiến trúc "thêm 1 file locale là chạy": muốn thêm Hàn (ko) / Trung (zh),
// chỉ cần (1) tạo locales/<mã>.json và (2) thêm mục vào LOCALES bên dưới.
// KHÔNG phải sửa bất kỳ component nào.
// ============================================================================

export const DEFAULT_LOCALE: LocaleCode = 'vi'

/** Khóa lưu ngôn ngữ đang chọn trong localStorage. */
export const LOCALE_STORAGE_KEY = 'oceanpark.locale'

export type LocaleMeta = {
  code: LocaleCode
  /** Nhãn gọn hiển thị trên switcher, ví dụ "VI". */
  short: string
  /** Tên đầy đủ bằng chính ngôn ngữ đó. */
  label: string
  /** Locale chuẩn cho Intl (số/tiền/ngày). */
  intl: string
}

/**
 * Danh sách ngôn ngữ ĐANG bật.
 * ko/zh đã có type sẵn ở tầng dữ liệu; khi có file locale chỉ cần bỏ comment.
 */
export const LOCALES: LocaleMeta[] = [
  { code: 'vi', short: 'VI', label: 'Tiếng Việt', intl: 'vi-VN' },
  { code: 'en', short: 'EN', label: 'English', intl: 'en-US' },
  // { code: 'ko', short: 'KO', label: '한국어', intl: 'ko-KR' },
  // { code: 'zh', short: 'ZH', label: '中文', intl: 'zh-CN' },
]

export const SUPPORTED_LOCALES: LocaleCode[] = LOCALES.map((l) => l.code)

export function isSupportedLocale(value: string): value is LocaleCode {
  return SUPPORTED_LOCALES.includes(value as LocaleCode)
}

export function getIntlLocale(code: LocaleCode): string {
  return LOCALES.find((l) => l.code === code)?.intl ?? 'vi-VN'
}
