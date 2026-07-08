import type { Tower } from '@/types'

// TODO: thay mock bằng fetch API backend của tôi (GET /api/towers).
// Các phân khu / tòa tháp tiêu biểu tại Ocean Park (tọa độ quanh khu Gia Lâm - Hà Nội).

export const mockTowers: Tower[] = [
  {
    id: 'tw_s1',
    name: 'Sapphire S1',
    coords: [20.9739, 105.9483],
    priceFromVnd: 2_350_000_000,
    status: 'selling',
    image: '/images/apt-tower-1.png',
  },
  {
    id: 'tw_s2',
    name: 'Sapphire S2',
    coords: [20.9721, 105.9501],
    priceFromVnd: 2_180_000_000,
    status: 'selling',
    image: '/images/apt-tower-1.png',
  },
  {
    id: 'tw_r1',
    name: 'Ruby R1',
    coords: [20.9756, 105.9467],
    priceFromVnd: 3_050_000_000,
    status: 'sold_out',
    image: '/images/apt-tower-1.png',
  },
  {
    id: 'tw_d1',
    name: 'Diamond D1',
    coords: [20.9702, 105.9522],
    priceFromVnd: 4_600_000_000,
    status: 'coming_soon',
    image: '/images/apt-tower-1.png',
  },
  {
    id: 'tw_k1',
    name: 'The King Villas',
    coords: [20.9688, 105.9448],
    priceFromVnd: 18_500_000_000,
    status: 'selling',
    image: '/images/apt-tower-1.png',
  },
]

/** Tra cứu nhanh tòa tháp theo id. */
export const mockTowersById: Record<string, Tower> = Object.fromEntries(
  mockTowers.map((t) => [t.id, t]),
)
