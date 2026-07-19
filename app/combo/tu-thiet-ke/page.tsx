import { Suspense } from 'react'
import type { Metadata } from 'next'
import { ComboBuilderClient } from '@/components/combo/combo-builder-client'
import { BrandLoader } from '@/components/luxury/brand-loader'

export const metadata: Metadata = {
  title: 'Tự thiết kế combo · HOMIX',
  description:
    'Tự xếp chuyến đi tại HOMIX: chọn chỗ ở, thêm trải nghiệm — giá gói tự tính, càng thêm càng rẻ.',
}

// useSearchParams cần Suspense boundary ở App Router.
export default function Page() {
  return (
    <Suspense fallback={<BrandLoader />}>
      <ComboBuilderClient />
    </Suspense>
  )
}
