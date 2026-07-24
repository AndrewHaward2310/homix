import type { Metadata } from 'next'
import { ComboIndexClient } from '@/components/combo/combo-index-client'

export const metadata: Metadata = {
  title: 'Combo chuyến đi · DOMIX HOME',
  description: 'Gói lưu trú kèm trải nghiệm được tuyển chọn tại DOMIX HOME — đặt một lần, tận hưởng trọn vẹn.',
}

export default function Page() {
  return <ComboIndexClient />
}
