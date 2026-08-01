import { Suspense } from 'react'
import type { Metadata } from 'next'
import { pickLocale } from '@/types'
import { getPropertyServer } from '@/lib/server/property'
import { propertyJsonLd, serializeJsonLd } from '@/lib/seo'
import { PropertyDetailClient } from '@/components/property/property-detail-client'
import { BrandLoader } from '@/components/luxury/brand-loader'

// SEO: server component fetch metadata; UI render ở client component.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const p = await getPropertyServer(id)
  if (!p) return { title: 'DOMIX HOME' }
  const title = pickLocale(p.title, 'vi')
  const description = pickLocale(p.description, 'vi').slice(0, 160)
  const images = p.images[0] ? [p.images[0]] : []
  // Tin chưa kiểm duyệt / đã ngừng: vẫn xem được (host preview) nhưng KHÔNG cho index.
  const indexable = p.verified && p.status !== 'unavailable'
  return {
    title: `${title} · DOMIX HOME`,
    description,
    openGraph: { title, description, images, type: 'website' },
    twitter: { card: 'summary_large_image', title, description, images },
    ...(indexable ? {} : { robots: { index: false, follow: true } }),
  }
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const p = await getPropertyServer(id)
  // BookingCard đọc useSearchParams (?perks) → cần Suspense boundary.
  return (
    <>
      {/* JSON-LD giúp Google hiện giá + sao + ảnh trong kết quả tìm kiếm */}
      {p && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(propertyJsonLd(p)) }}
        />
      )}
      <Suspense fallback={<BrandLoader />}>
        <PropertyDetailClient id={id} />
      </Suspense>
    </>
  )
}
