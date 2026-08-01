import { describe, it, expect } from 'vitest'
import { priceSuffixKey, formatCompactPrice } from '@/lib/property-format'
import { pickLocale } from '@/types'

describe('priceSuffixKey (hậu tố giá theo loại)', () => {
  it('thuê dài hạn → /tháng, lưu trú → /đêm, bán → null', () => {
    expect(priceSuffixKey('rent_long')).toBe('common.perMonth')
    expect(priceSuffixKey('stay_short')).toBe('common.perNight')
    expect(priceSuffixKey('sale')).toBeNull()
  })
})

describe('formatCompactPrice', () => {
  it('trả chuỗi có ký hiệu tiền VND, không rỗng', () => {
    const s = formatCompactPrice(3_150_000_000, 'vi')
    expect(typeof s).toBe('string')
    expect(s.length).toBeGreaterThan(0)
    // compact notation → không chứa toàn bộ 10 chữ số
    expect(s).not.toContain('3150000000')
  })
})

describe('pickLocale (fallback ngôn ngữ)', () => {
  it('lấy đúng locale khi có', () => {
    expect(pickLocale({ vi: 'Xin chào', en: 'Hello' }, 'en')).toBe('Hello')
    expect(pickLocale({ vi: 'Xin chào', en: 'Hello' }, 'vi')).toBe('Xin chào')
  })

  it('thiếu locale yêu cầu → fallback vi → en', () => {
    expect(pickLocale({ vi: 'Chỉ VI' } as any, 'en')).toBe('Chỉ VI')
    expect(pickLocale({ en: 'Only EN' } as any, 'vi')).toBe('Only EN')
  })
})
