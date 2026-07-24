import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tìm kiếm căn hộ · DOMIX HOME',
  description: 'Khám phá căn hộ mua, thuê dài hạn và lưu trú ngắn ngày quanh hồ trung tâm — lọc theo giá, phòng ngủ, tiện ích trên bản đồ thật.',
  openGraph: {
    title: 'Tìm kiếm căn hộ · DOMIX HOME',
    description: 'Khám phá căn hộ quanh hồ trung tâm với bản đồ tương tác.',
  },
}

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children
}
