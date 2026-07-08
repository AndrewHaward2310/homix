'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { Property } from '@/types'
import { Section } from '@/components/luxury/section'
import { H2, Body, Eyebrow } from '@/components/luxury/typography'
import { Reveal } from '@/components/luxury/reveal'
import { luxuryButtonVariants } from '@/components/luxury/luxury-button'
import { getProperties, getTowers } from '@/services/propertyService'
import { useFavorites } from '@/hooks/use-favorites'
import { useT } from '@/lib/i18n/provider'
import { PropertyCard } from '@/components/property/property-card'
import { PropertyGridSkeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export function FeaturedPropertiesSection() {
  const t = useT()
  const { isFavorite, toggle } = useFavorites()
  const [items, setItems] = useState<Property[]>([])
  const [towerNames, setTowerNames] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    Promise.all([getProperties(), getTowers()])
      .then(([properties, towers]) => {
        if (!active) return
        setItems(properties.slice(0, 8))
        setTowerNames(Object.fromEntries(towers.map((tw) => [tw.id, tw.name])))
      })
      .catch(() => {
        if (active) setItems([])
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <Section id="can-ho" className="scroll-mt-20">
      <Reveal className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="max-w-2xl">
          <Eyebrow>{t('featured.eyebrow')}</Eyebrow>
          <H2 className="mt-4">{t('featured.title')}</H2>
          <Body className="mt-5">{t('featured.subtitle')}</Body>
        </div>
        <Link
          href="/search"
          className={cn(luxuryButtonVariants({ variant: 'outline', size: 'md' }), 'shrink-0 self-start md:self-auto')}
        >
          {t('featured.viewAll')}
          <ArrowRight className="transition-transform duration-300 group-hover:translate-x-0.5" />
        </Link>
      </Reveal>

      {loading ? (
        <PropertyGridSkeleton count={8} className="mt-12" />
      ) : (
        <div className="mt-12 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((property, i) => (
            <Reveal key={property.id} delay={(i % 4) * 80}>
              <PropertyCard
                property={property}
                towerName={towerNames[property.towerId]}
                favorite={isFavorite(property.id)}
                onToggleFavorite={toggle}
                priority={i < 4}
              />
            </Reveal>
          ))}
        </div>
      )}
    </Section>
  )
}
