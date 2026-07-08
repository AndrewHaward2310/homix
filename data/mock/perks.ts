import type { Perk } from '@/types'

// TODO: thay mock bằng fetch API backend của tôi (GET /api/perks).
// Dịch vụ / tiện ích cộng thêm có thể mua kèm khi lưu trú hoặc sinh sống.

export const mockPerks: Perk[] = [
  {
    id: 'pk_bbq',
    name: {
      vi: 'Combo tiệc nướng BBQ ven hồ',
      en: 'Lakeside BBQ Party Combo',
      ko: '호숫가 바비큐 파티 콤보',
      zh: '湖畔烧烤派对套餐',
    },
    priceVnd: 1_200_000,
    category: 'bbq',
  },
  {
    id: 'pk_lake_ticket',
    name: {
      vi: 'Vé bãi tắm biển nước mặn (1 ngày)',
      en: 'Saltwater Beach Day Pass',
      ko: '소금물 해변 1일 이용권',
      zh: '咸水沙滩一日通票',
    },
    priceVnd: 250_000,
    category: 'lake_ticket',
  },
  {
    id: 'pk_kayak',
    name: {
      vi: 'Thuê kayak đôi (2 giờ)',
      en: 'Tandem Kayak Rental (2 hours)',
      ko: '2인용 카약 대여 (2시간)',
      zh: '双人皮划艇租赁（2小时）',
    },
    priceVnd: 300_000,
    category: 'vehicle',
  },
  {
    id: 'pk_buggy',
    name: {
      vi: 'Xe điện đưa đón nội khu (nửa ngày)',
      en: 'Electric Buggy Shuttle (half day)',
      ko: '단지 내 전동 카트 (반나절)',
      zh: '园区电瓶车接送（半天）',
    },
    priceVnd: 400_000,
    category: 'vehicle',
  },
  {
    id: 'pk_cleaning',
    name: {
      vi: 'Dịch vụ dọn phòng cao cấp',
      en: 'Premium Housekeeping Service',
      ko: '프리미엄 하우스키핑 서비스',
      zh: '高级客房清洁服务',
    },
    priceVnd: 350_000,
    category: 'other',
  },
  {
    id: 'pk_breakfast',
    name: {
      vi: 'Bữa sáng giao tận căn (2 người)',
      en: 'In-Room Breakfast for Two',
      ko: '객실 조식 (2인)',
      zh: '客房早餐（双人）',
    },
    priceVnd: 280_000,
    category: 'other',
  },
]

/** Tra cứu nhanh perk theo id. */
export const mockPerksById: Record<string, Perk> = Object.fromEntries(
  mockPerks.map((p) => [p.id, p]),
)
