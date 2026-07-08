'use client'

import { useEffect, useState } from 'react'
import type { Property } from '@/types'
import { getProperties, getMasterplanTowers } from '@/services/propertyService'
import { useRecentlyViewed } from '@/hooks/use-recently-viewed'
import { useFavorites } from '@/hooks/use-favorites'
import { useT } from '@/lib/i18n/provider'
import { Section } from '@/components/luxury/section'
import { H2, Eyebrow } from '@/components/luxury/typography'
import { PropertyCard } from '@/components/property/property-card'

/** "Vừa xem" — lưới căn đã xem gần đây (local-first). Ẩn nếu chưa có. */
export function RecentlyViewed({ exclude }: { exclude?: string }) {
  const t = useT()
  const ids = useRecentlyViewed(exclude)
  const { isFavorite, toggle } = useFavorites()
  const [byId, setById] = useState<Record<string, Property>>({})
  const [towerNames, setTowerNames] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!ids.length) return
    Promise.all([getProperties(), getMasterplanTowers()]).then(([ps, tw]) => {
      setById(Object.fromEntries(ps.map((p) => [p.id, p])))
      setTowerNames(Object.fromEntries(tw.map((x) => [x.id, x.name])))
    })
  }, [ids.length])

  const items = ids.map((id) => byId[id]).filter(Boolean).slice(0, 4)
  if (items.length === 0) return null

  return (
    <Section>
      <Eyebrow>{t('recent.eyebrow')}</Eyebrow>
      <H2 className="mt-4">{t('recent.title')}</H2>
      <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((p) => (
          <PropertyCard
            key={p.id}
            property={p}
            towerName={towerNames[p.towerId]}
            favorite={isFavorite(p.id)}
            onToggleFavorite={toggle}
          />
        ))}
      </div>
    </Section>
  )
}
