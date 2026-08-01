import { describe, it, expect } from 'vitest'
import { propertyJsonLd, serializeJsonLd, SITE_URL } from '@/lib/seo'
import type { Property } from '@/types'

const base: Property = {
  id: 'p_1',
  code: 'DMX-001',
  title: { vi: 'Căn hộ 2PN', en: '2BR apartment' },
  description: { vi: 'Mô tả', en: 'Desc' },
  type: 'sale',
  towerId: 't1',
  areaM2: 72,
  bedrooms: 2,
  bathrooms: 2,
  priceVnd: 3_150_000_000,
  images: ['/images/a.png', 'https://cdn.example.com/b.jpg'],
  amenities: [],
  status: 'available',
  hostId: 'h1',
  verified: true,
  ratingAvg: 4,
  reviewCount: 2,
}

describe('propertyJsonLd', () => {
  it('bán: Offer có price trọn gói, không priceSpecification', () => {
    const d = propertyJsonLd({ ...base, type: 'sale' }) as any
    expect(d['@type']).toBe('Product')
    expect(d.offers.price).toBe(3_150_000_000)
    expect(d.offers.priceSpecification).toBeUndefined()
  })

  it('thuê dài hạn: dùng UnitPriceSpecification MONTH, không price trần', () => {
    const d = propertyJsonLd({ ...base, type: 'rent_long' }) as any
    expect(d.offers.price).toBeUndefined()
    expect(d.offers.priceSpecification.unitText).toBe('MONTH')
  })

  it('lưu trú ngắn: UnitPriceSpecification DAY', () => {
    const d = propertyJsonLd({ ...base, type: 'stay_short' }) as any
    expect(d.offers.priceSpecification.unitText).toBe('DAY')
  })

  it('availability ánh xạ theo status', () => {
    expect((propertyJsonLd({ ...base, status: 'available' }) as any).offers.availability).toContain('InStock')
    expect((propertyJsonLd({ ...base, status: 'reserved' }) as any).offers.availability).toContain('LimitedAvailability')
    expect((propertyJsonLd({ ...base, status: 'unavailable' }) as any).offers.availability).toContain('SoldOut')
  })

  it('ảnh chuyển URL tuyệt đối; ảnh đã tuyệt đối giữ nguyên', () => {
    const d = propertyJsonLd(base) as any
    expect(d.image[0]).toBe(`${SITE_URL}/images/a.png`)
    expect(d.image[1]).toBe('https://cdn.example.com/b.jpg')
  })

  it('chỉ gắn aggregateRating khi có review thật', () => {
    expect((propertyJsonLd(base) as any).aggregateRating.reviewCount).toBe(2)
    expect((propertyJsonLd({ ...base, ratingAvg: undefined, reviewCount: 0 }) as any).aggregateRating).toBeUndefined()
  })
})

describe('serializeJsonLd (chống XSS)', () => {
  it('escape </script> để không phá thẻ script', () => {
    const out = serializeJsonLd({ x: '</script><script>alert(1)</script>' })
    expect(out).not.toContain('</script>')
    expect(out).toContain('\\u003c')
  })

  it('vẫn parse lại được thành JSON hợp lệ', () => {
    const payload = { a: 1, b: '<b>&</b>' }
    const out = serializeJsonLd(payload)
    // Sau khi thay \\u003c... chuỗi vẫn là JSON hợp lệ (unicode escape hợp lệ trong JSON).
    expect(JSON.parse(out)).toEqual(payload)
  })
})
