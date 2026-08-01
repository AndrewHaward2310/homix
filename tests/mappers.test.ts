import { describe, it, expect } from 'vitest'
import { toProperty, toReview } from '@/lib/mappers'

// Prisma row giả (chỉ các field mapper đọc). Cast an toàn theo tham số hàm.
type PropRow = Parameters<typeof toProperty>[0]
type ReviewRow = Parameters<typeof toReview>[0]

const propRow = {
  id: 'p_1',
  code: 'DMX-001',
  title: { vi: 'Căn hộ', en: 'Apartment' },
  description: { vi: 'Mô tả', en: 'Desc' },
  type: 'sale',
  towerId: 't1',
  areaM2: 72,
  bedrooms: 2,
  bathrooms: 2,
  priceVnd: BigInt('3150000000'),
  images: ['/a.png'],
  amenities: ['pool'],
  status: 'available',
  verified: true,
  ratingAvg: 4.5,
  reviewCount: 3,
  viewCount: 10,
  towerId2: undefined,
  hostId: 'h1',
} as unknown as PropRow

describe('toProperty (không rò rỉ type Prisma)', () => {
  it('priceVnd BigInt → number (bất biến quan trọng)', () => {
    const p = toProperty(propRow)
    expect(typeof p.priceVnd).toBe('number')
    expect(p.priceVnd).toBe(3_150_000_000)
  })

  it('giữ nguyên field cơ bản + viewCount', () => {
    const p = toProperty(propRow)
    expect(p.id).toBe('p_1')
    expect(p.bedrooms).toBe(2)
    expect(p.viewCount).toBe(10)
    expect(p.ratingAvg).toBe(4.5)
  })
})

describe('toReview', () => {
  const baseReview = {
    id: 'r1',
    propertyId: 'p_1',
    customerId: 'c1',
    rating: 5,
    comment: 'Tốt',
    images: ['/x.jpg'],
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  }

  it('tên khách fallback "Khách" khi thiếu customer', () => {
    const r = toReview({ ...baseReview } as unknown as ReviewRow)
    expect(r.customerName).toBe('Khách')
    expect(r.images).toEqual(['/x.jpg'])
    expect(r.createdAt).toBe('2026-01-01T00:00:00.000Z')
  })

  it('images mặc định [] khi null', () => {
    const r = toReview({ ...baseReview, images: null } as unknown as ReviewRow)
    expect(r.images).toEqual([])
  })

  it('lấy tên + avatar từ customer include', () => {
    const r = toReview({
      ...baseReview,
      customer: { name: 'An', avatarUrl: '/av.png' },
    } as unknown as ReviewRow)
    expect(r.customerName).toBe('An')
    expect(r.avatarUrl).toBe('/av.png')
  })
})
