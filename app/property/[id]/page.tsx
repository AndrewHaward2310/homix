import type { Metadata } from 'next'
import { pickLocale } from '@/types'
import { getPropertyServer } from '@/lib/server/property'
import { PropertyDetailClient } from '@/components/property/property-detail-client'

// SEO: server component fetch metadata; UI render ở client component.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const p = await getPropertyServer(id)
  if (!p) return { title: 'HOMIX' }
  const title = pickLocale(p.title, 'vi')
  const description = pickLocale(p.description, 'vi').slice(0, 160)
  const images = p.images[0] ? [p.images[0]] : []
  return {
    title: `${title} · HOMIX`,
    description,
    openGraph: { title, description, images, type: 'website' },
    twitter: { card: 'summary_large_image', title, description, images },
  }
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <PropertyDetailClient id={id} />
}
