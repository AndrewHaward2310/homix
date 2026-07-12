import type { Metadata } from 'next'
import { pickLocale } from '@/types'
import { getTripCombo } from '@/lib/combos'
import { ComboDetailClient } from '@/components/combo/combo-detail-client'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const combo = await getTripCombo(id)
  if (!combo) return { title: 'HOMIX' }
  const title = pickLocale(combo.title, 'vi')
  const description = pickLocale(combo.subtitle, 'vi').slice(0, 160)
  const images = combo.themeImage ? [combo.themeImage] : []
  return {
    title: `${title} · Combo HOMIX`,
    description,
    openGraph: { title, description, images, type: 'website' },
  }
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ComboDetailClient id={id} />
}
