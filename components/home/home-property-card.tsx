'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Bed, Bath, Maximize } from 'lucide-react'
import type { Property } from '@/types'
import { pickLocale } from '@/types'
import { useLocale } from '@/lib/i18n/provider'
import { getIntlLocale } from '@/lib/i18n/config'
import { cn } from '@/lib/utils'

type HomePropertyCardProps = {
  property: Property
  /** Tên tòa tháp (tra từ danh sách towers ở component cha). Fallback: mã căn. */
  towerName?: string
  className?: string
  priority?: boolean
}

/**
 * HomePropertyCard — thẻ căn hộ nhận dữ liệu ĐỘNG (rich Property) + i18n.
 * Ảnh tràn 4:5 bo 12px không viền cứng, hover scale 1.03, thông tin tối giản.
 * (Khác PropertyCard trong design-system vốn dùng shape phẳng cho styleguide.)
 */
export function HomePropertyCard({
  property,
  towerName,
  className,
  priority,
}: HomePropertyCardProps) {
  const { locale, t } = useLocale()

  const title = pickLocale(property.title, locale)
  const displayTowerName = towerName ?? property.code

  // Giá hiển thị gọn (compact) theo locale, kèm hậu tố theo loại hình.
  const intl = getIntlLocale(locale)
  const compact = new Intl.NumberFormat(intl, {
    style: 'currency',
    currency: 'VND',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(property.priceVnd)
  const priceSuffix =
    property.type === 'rent_long'
      ? t('common.perMonth')
      : property.type === 'stay_short'
        ? t('common.perNight')
        : ''

  return (
    <Link
      href={`/property/${property.id}`}
      className={cn(
        'group block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-4 focus-visible:ring-offset-background',
        className,
      )}
    >
      {/* Ảnh tràn viền 4:5 */}
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-secondary">
        <Image
          src={property.images[0] || '/placeholder.svg'}
          alt={`${title} — ${displayTowerName}`}
          fill
          priority={priority}
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 25vw, 300px"
          className="object-cover transition-transform duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
        />
        <span className="absolute left-4 top-4 rounded-full border border-glass-border bg-glass px-3 py-1 font-sans text-[0.75rem] font-medium text-foreground backdrop-blur-xl">
          {t(`ptype.${property.type}`)}
        </span>
      </div>

      {/* Thông tin tối giản */}
      <div className="px-1 pt-5">
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="min-w-0 truncate font-sans text-[1.125rem] font-semibold tracking-[-0.02em] text-foreground">
            {title}
          </h3>
          <span className="shrink-0 font-sans text-[1rem] font-semibold text-brand">
            {compact}
            <span className="font-normal text-muted-foreground">{priceSuffix}</span>
          </span>
        </div>

        <p className="mt-1 font-sans text-[0.95rem] text-muted-foreground">{displayTowerName}</p>

        <div className="mt-4 flex items-center gap-4 font-sans text-[0.8125rem] text-muted-foreground">
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
