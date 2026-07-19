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
import { FeaturedHeroCard } from '@/components/property/featured-hero-card'
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
      ) : items.length === 0 ? null : (
        <>
          {/* Bố cục bento: 1 căn nổi bật lớn (magazine) + lưới căn nhỏ bên cạnh.
              Chỉ chia 2 cột khi có ≥2 căn (tránh cột phải trống nếu quá ít). */}
          <div className={cn('mt-12 grid gap-6', items.length > 1 && 'lg:grid-cols-2')}>
            <Reveal className="lg:flex">
              <FeaturedHeroCard
                property={items[0]}
                towerName={towerNames[items[0].towerId]}
                favorite={isFavorite(items[0].id)}
                onToggleFavorite={toggle}
                priority
                className="w-full"
              />
            </Reveal>
            {items.length > 1 && (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {items.slice(1, 5).map((property, i) => (
                  <Reveal key={property.id} delay={(i % 2) * 80}>
                    <PropertyCard
                      property={property}
                      towerName={towerNames[property.towerId]}
                      favorite={isFavorite(property.id)}
                      onToggleFavorite={toggle}
                      priority={i < 2}
                    />
                  </Reveal>
                ))}
              </div>
            )}
          </div>

          {/* Hàng căn còn lại */}
          {items.length > 5 && (
            <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {items.slice(5, 8).map((property, i) => (
                <Reveal key={property.id} delay={(i % 3) * 80}>
                  <PropertyCard
                    property={property}
                    towerName={towerNames[property.towerId]}
                    favorite={isFavorite(property.id)}
                    onToggleFavorite={toggle}
                  />
                </Reveal>
              ))}
            </div>
          )}
        </>
      )}
    </Section>
  )
}
