import type { LocalizedText } from '@/types'

/**
 * Định nghĩa combo "chuyến đi" — nội dung biên tập (curated), tham chiếu tới
 * Property + Perk có thật trong DB qua id. API `/api/combos` sẽ hydrate & tính giá.
 * Sửa file này để thêm/bớt combo (không cần migration DB).
 */
export type ComboDef = {
  id: string
  title: LocalizedText
  subtitle: LocalizedText
  themeImage: string
  nights: number
  guests: number
  tags: LocalizedText[]
  propertyId: string
  perks: { perkId: string; qty: number }[]
  /** % giảm của giá gói so với tổng mua lẻ (0.15 = giảm 15%). */
  discount: number
  /** Ưu tiên sắp xếp (nhỏ trước). */
  order: number
}

export const COMBO_DEFS: ComboDef[] = [
  {
    id: 'cb_lakeside_retreat',
    title: { vi: 'Nghỉ dưỡng ven hồ 2N1Đ', en: 'Lakeside Retreat 2D1N' },
    subtitle: {
      vi: 'Căn hộ bên hồ, tiệc BBQ hoàng hôn và một ngày đắm mình ở biển hồ nước mặn.',
      en: 'A lakeside stay, a sunset BBQ, and a day at the saltwater lagoon.',
    },
    themeImage: '/images/life-beach.png',
    nights: 1,
    guests: 2,
    tags: [{ vi: 'Nghỉ dưỡng', en: 'Retreat' }, { vi: 'Cặp đôi', en: 'Couples' }],
    propertyId: 'p_3',
    perks: [
      { perkId: 'pk_bbq', qty: 1 },
      { perkId: 'pk_lake_ticket', qty: 2 },
      { perkId: 'pk_breakfast', qty: 1 },
    ],
    discount: 0.12,
    order: 1,
  },
  {
    id: 'cb_foodie_weekend',
    title: { vi: 'Cuối tuần Foodie K-Town', en: 'K-Town Foodie Weekend' },
    subtitle: {
      vi: 'Hai đêm căn 2PN, bữa sáng tận căn và xe điện dạo phố ẩm thực chuẩn Hàn.',
      en: 'Two nights in a 2BR, in-room breakfast, and a buggy to the Korean food street.',
    },
    themeImage: '/images/life-dining.png',
    nights: 2,
    guests: 4,
    tags: [{ vi: 'Ẩm thực', en: 'Foodie' }, { vi: 'Nhóm bạn', en: 'Friends' }],
    propertyId: 'p_6',
    perks: [
      { perkId: 'pk_breakfast', qty: 2 },
      { perkId: 'pk_buggy', qty: 1 },
      { perkId: 'pk_cleaning', qty: 1 },
    ],
    discount: 0.15,
    order: 2,
  },
  {
    id: 'cb_active_family',
    title: { vi: 'Gia đình năng động', en: 'Active Family Escape' },
    subtitle: {
      vi: 'Villa hồ bơi riêng, chèo kayak, vé biển hồ cả nhà và tiệc nướng sân vườn.',
      en: 'A private-pool villa, kayaking, lagoon passes for all, and a garden BBQ.',
    },
    themeImage: '/images/hero-lakeside.png',
    nights: 1,
    guests: 6,
    tags: [{ vi: 'Gia đình', en: 'Family' }, { vi: 'Ngoài trời', en: 'Outdoors' }],
    propertyId: 'p_10',
    perks: [
      { perkId: 'pk_kayak', qty: 2 },
      { perkId: 'pk_lake_ticket', qty: 4 },
      { perkId: 'pk_bbq', qty: 1 },
    ],
    discount: 0.18,
    order: 3,
  },
]
