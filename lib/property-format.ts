import type { LocaleCode, PropertyType } from '@/types'
import { getIntlLocale } from '@/lib/i18n/config'

/** Giá rút gọn (compact, VND) — dùng chung cho PropertyCard & FeaturedHeroCard. */
export function formatCompactPrice(priceVnd: number, locale: LocaleCode): string {
  return new Intl.NumberFormat(getIntlLocale(locale), {
    style: 'currency',
    currency: 'VND',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(priceVnd)
}

/** Key i18n hậu tố giá theo loại giao dịch (thuê/tháng, lưu trú/đêm, mua: không). */
export function priceSuffixKey(type: PropertyType): string | null {
  if (type === 'rent_long') return 'common.perMonth'
  if (type === 'stay_short') return 'common.perNight'
  return null
}
