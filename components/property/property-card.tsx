'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Bed, Bath, Maximize, Heart, BadgeCheck, Star } from 'lucide-react'
import type { Property } from '@/types'
import { pickLocale } from '@/types'
import { useLocale } from '@/lib/i18n/provider'
import { formatCompactPrice, priceSuffixKey } from '@/lib/property-format'
import { cn } from '@/lib/utils'

type PropertyCardProps = {
  property: Property
  towerName?: string
  favorite?: boolean
  onToggleFavorite?: (id: string) => void
  className?: string
  priority?: boolean
  /** Đồng bộ hover với marker trên bản đồ (/search). */
  onHover?: (id: string | null) => void
  active?: boolean
}

export function PropertyCard({
  property,
  towerName,
  favorite,
  onToggleFavorite,
  className,
  priority,
  onHover,
  active,
}: PropertyCardProps) {
  const { locale, t } = useLocale()
  const title = pickLocale(property.title, locale)
  const compact = formatCompactPrice(property.priceVnd, locale)
  const suffixKey = priceSuffixKey(property.type)
  const suffix = suffixKey ? t(suffixKey) : ''

  return (
    <Link
      href={`/property/${property.id}`}
      onMouseEnter={() => onHover?.(property.id)}
      onMouseLeave={() => onHover?.(null)}
      className={cn(
        'group block rounded-2xl outline-none transition-[transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-4 focus-visible:ring-offset-background',
        active && 'ring-2 ring-brand/50 ring-offset-2 ring-offset-background',
        className,
      )}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-secondary shadow-luxury-sm transition-shadow duration-300 group-hover:shadow-luxury-lg">
        <Image
          src={property.images[0] || '/placeholder.svg'}
          alt={`${title}${towerName ? ` — ${towerName}` : ''}`}
          fill
          priority={priority}
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 33vw, 380px"
          className="object-cover transition-transform duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
        />
        {/* Badge loại + verified */}
        <div className="absolute left-3 top-3 flex items-center gap-1.5">
          <span className="rounded-full border border-glass-border bg-glass px-2.5 py-1 font-sans text-[0.6875rem] font-medium text-foreground backdrop-blur-xl">
            {t(`ptype.${property.type}`)}
          </span>
          {property.verified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-brand/90 px-2 py-1 font-sans text-[0.625rem] font-semibold text-brand-foreground backdrop-blur-xl">
              <BadgeCheck className="size-3" aria-hidden="true" />
              {t('property.verified')}
            </span>
          )}
        </div>
        {/* Favorite */}
        {onToggleFavorite && (
          <button
            type="button"
            aria-label={favorite ? t('property.unsave') : t('property.save')}
            aria-pressed={favorite}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onToggleFavorite(property.id)
            }}
            className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full border border-glass-border bg-glass text-foreground backdrop-blur-xl transition-all hover:scale-105 active:scale-95"
          >
            <Heart
              className={cn('size-4 transition-colors', favorite && 'fill-red-500 text-red-500')}
              aria-hidden="true"
            />
          </button>
        )}
      </div>

      <div className="px-1 pt-4">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="min-w-0 truncate font-sans text-[1.0625rem] font-semibold tracking-[-0.02em] text-foreground">
            {title}
          </h3>
          <span className="shrink-0 font-sans text-[1rem] font-bold text-brand">
            {compact}
            <span className="font-normal text-muted-foreground">{suffix}</span>
          </span>
        </div>

        <div className="mt-1 flex items-center gap-2 font-sans text-[0.9375rem] text-muted-foreground">
          <span className="truncate">{towerName ?? property.code}</span>
          {property.ratingAvg != null && (
            <>
              <span aria-hidden="true" className="size-1 rounded-full bg-border" />
              <span className="inline-flex shrink-0 items-center gap-1 text-foreground">
                <Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
                {property.ratingAvg.toFixed(1)}
              </span>
            </>
          )}
        </div>

        <div className="mt-2.5 flex items-center gap-4 font-sans text-[0.8125rem] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Maximize className="size-4" aria-hidden="true" />
            {property.areaM2} m²
          </span>
          <span aria-hidden="true" className="size-1 rounded-full bg-border" />
          <span className="inline-flex items-center gap-1.5">
            <Bed className="size-4" aria-hidden="true" />
            {property.bedrooms}
          </span>
          <span aria-hidden="true" className="size-1 rounded-full bg-border" />
          <span className="inline-flex items-center gap-1.5">
            <Bath className="size-4" aria-hidden="true" />
            {property.bathrooms}
          </span>
        </div>
      </div>
    </Link>
  )
}
