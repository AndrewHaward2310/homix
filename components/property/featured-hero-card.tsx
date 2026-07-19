'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Bed, Bath, Maximize, Heart, BadgeCheck, Star, ArrowRight } from 'lucide-react'
import type { Property } from '@/types'
import { pickLocale } from '@/types'
import { useLocale } from '@/lib/i18n/provider'
import { formatCompactPrice, priceSuffixKey } from '@/lib/property-format'
import { cn } from '@/lib/utils'

type Props = {
  property: Property
  towerName?: string
  favorite?: boolean
  onToggleFavorite?: (id: string) => void
  priority?: boolean
  className?: string
}

/**
 * FeaturedHeroCard — thẻ "căn nổi bật" LỚN kiểu magazine: ảnh tràn + overlay
 * gradient + tiêu đề/giá/thông số phủ lên. Dùng làm điểm nhấn trong bố cục bento
 * của khu "Căn hộ nổi bật" (phá kiểu lưới card đều tăm tắp).
 */
export function FeaturedHeroCard({
  property,
  towerName,
  favorite,
  onToggleFavorite,
  priority,
  className,
}: Props) {
  const { locale, t } = useLocale()
  const title = pickLocale(property.title, locale)
  const compact = formatCompactPrice(property.priceVnd, locale)
  const suffixKey = priceSuffixKey(property.type)
  const suffix = suffixKey ? t(suffixKey) : ''

  return (
    <Link
      href={`/property/${property.id}`}
      className={cn(
        'group relative flex min-h-[22rem] flex-col justify-end overflow-hidden rounded-3xl shadow-luxury outline-none transition-all duration-300 hover:shadow-luxury-lg focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        className,
      )}
    >
      <Image
        src={property.images[0] || '/placeholder.svg'}
        alt={`${title}${towerName ? ` — ${towerName}` : ''}`}
        fill
        priority={priority}
        sizes="(max-width: 1024px) 100vw, 50vw"
        className="object-cover transition-transform duration-[800ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-safe:group-hover:scale-[1.04]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" aria-hidden="true" />

      {/* Badge loại + verified */}
      <div className="absolute left-4 top-4 flex items-center gap-1.5">
        <span className="rounded-full bg-white/20 px-2.5 py-1 font-sans text-[0.75rem] font-medium text-white backdrop-blur-md ring-1 ring-white/25">
          {t(`ptype.${property.type}`)}
        </span>
        {property.verified && (
          <span className="inline-flex items-center gap-1 rounded-full bg-brand px-2.5 py-1 font-sans text-[0.6875rem] font-semibold text-brand-foreground">
            <BadgeCheck className="size-3.5" aria-hidden="true" />
            {t('property.verified')}
          </span>
        )}
      </div>

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
          className="absolute right-4 top-4 flex size-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md ring-1 ring-white/25 transition-all hover:scale-105 active:scale-95"
        >
          <Heart className={cn('size-5 transition-colors', favorite && 'fill-red-500 text-red-500')} aria-hidden="true" />
        </button>
      )}

      {/* Nội dung phủ */}
      <div className="relative p-5 md:p-6">
        <div className="flex items-center gap-2 font-sans text-[0.875rem] text-white/85">
          <span className="truncate">{towerName ?? property.code}</span>
          {property.ratingAvg != null && (
            <>
              <span aria-hidden="true" className="size-1 rounded-full bg-white/40" />
              <span className="inline-flex shrink-0 items-center gap-1">
                <Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
                {property.ratingAvg.toFixed(1)}
              </span>
            </>
          )}
        </div>
        <h3 className="mt-1.5 font-display text-[1.6rem] font-semibold leading-tight text-white drop-shadow-[0_2px_16px_rgba(0,0,0,0.5)] md:text-[1.9rem]">
          {title}
        </h3>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4 font-sans text-[0.875rem] text-white/90">
            <span className="inline-flex items-center gap-1.5">
              <Maximize className="size-4" aria-hidden="true" /> {property.areaM2} m²
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Bed className="size-4" aria-hidden="true" /> {property.bedrooms}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Bath className="size-4" aria-hidden="true" /> {property.bathrooms}
            </span>
          </div>
          <span className="font-sans text-[1.35rem] font-bold text-white">
            {compact}
            <span className="text-[0.9rem] font-normal text-white/75">{suffix}</span>
          </span>
        </div>
      </div>

      <span className="absolute bottom-5 right-5 hidden size-10 items-center justify-center rounded-full bg-white/20 text-white opacity-0 backdrop-blur-md transition-all group-hover:opacity-100 md:flex">
        <ArrowRight className="size-5" aria-hidden="true" />
      </span>
    </Link>
  )
}
