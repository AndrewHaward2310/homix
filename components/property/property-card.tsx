'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Bed, Maximize, Heart, BadgeCheck, Star, ChevronLeft, ChevronRight } from 'lucide-react'
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

  // Carousel ảnh ngay trên thẻ — lướt ảnh không cần vào chi tiết.
  const images = property.images.length ? property.images : ['/placeholder.svg']
  const [idx, setIdx] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const go = (e: React.MouseEvent, dir: 1 | -1) => {
    e.preventDefault()
    e.stopPropagation()
    setLoaded(false)
    setIdx((i) => (i + dir + images.length) % images.length)
  }
  const jump = (e: React.MouseEvent, i: number) => {
    e.preventDefault()
    e.stopPropagation()
    if (i === idx) return
    setLoaded(false)
    setIdx(i)
  }
  const [burst, setBurst] = useState(false)

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
        {/* Nền shimmer trong lúc ảnh tải (blur-up nhẹ, chống "giật") */}
        <div className={cn('absolute inset-0 animate-pulse bg-secondary transition-opacity duration-300', loaded && 'opacity-0')} aria-hidden="true" />
        <Image
          key={idx}
          src={images[idx]}
          alt={`${title}${towerName ? ` — ${towerName}` : ''}`}
          fill
          priority={priority}
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 33vw, 380px"
          onLoad={() => setLoaded(true)}
          className="object-cover transition-transform duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
        />

        {/* Điều hướng nhiều ảnh — mũi tên (hiện khi hover) + chấm */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              aria-label={t('card.prevPhoto')}
              onClick={(e) => go(e, -1)}
              className="absolute left-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-black/45 text-white opacity-0 backdrop-blur-sm transition hover:bg-black/65 focus-visible:opacity-100 active:scale-90 group-hover:opacity-100"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              aria-label={t('card.nextPhoto')}
              onClick={(e) => go(e, 1)}
              className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-black/45 text-white opacity-0 backdrop-blur-sm transition hover:bg-black/65 focus-visible:opacity-100 active:scale-90 group-hover:opacity-100"
            >
              <ChevronRight className="size-4" />
            </button>
            <div className="absolute inset-x-0 bottom-2.5 flex justify-center gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={t('card.gotoPhoto', { n: i + 1 })}
                  aria-current={i === idx}
                  onClick={(e) => jump(e, i)}
                  className={cn(
                    'size-1.5 rounded-full transition-all',
                    i === idx ? 'w-4 bg-white' : 'bg-white/55 hover:bg-white/80',
                  )}
                />
              ))}
            </div>
          </>
        )}
        {/* Badge loại + verified — chừa chỗ nút yêu thích (right-3) + cho xuống dòng
            để nhãn "Đã xác minh" không bị cắt trên thẻ hẹp (lưới 3 cột). */}
        <div className="absolute left-3 right-14 top-3 flex flex-wrap items-center gap-1.5">
          <span className="whitespace-nowrap rounded-full border border-glass-border bg-glass px-2.5 py-1 font-sans text-[0.6875rem] font-medium text-foreground backdrop-blur-xl">
            {t(`ptype.${property.type}`)}
          </span>
          {property.verified && (
            <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-brand/90 px-2 py-1 font-sans text-[0.625rem] font-semibold text-brand-foreground backdrop-blur-xl">
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
              if (!favorite) setBurst(true)
              onToggleFavorite(property.id)
            }}
            className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full border border-glass-border bg-glass text-foreground backdrop-blur-xl transition-all hover:scale-105 active:scale-95"
          >
            <Heart
              onAnimationEnd={() => setBurst(false)}
              className={cn('size-4 transition-colors', burst && 'animate-heart-pop', favorite && 'fill-red-500 text-red-500')}
              aria-hidden="true"
            />
          </button>
        )}
      </div>

      {/* Nội dung gọn: tiêu đề đủ chữ (2 dòng, không cắt "..."), rồi mới tới giá.
          Thông số chi tiết để dành trang chi tiết căn. */}
      <div className="px-1 pt-4">
        {/* min-h = 2 dòng: giữ chiều cao thẻ đều nhau trong lưới */}
        <h3 className="line-clamp-2 min-h-[2.75em] font-sans text-[1.0625rem] font-semibold leading-snug tracking-[-0.02em] text-foreground">
          {title}
        </h3>

        <div className="mt-1.5 flex items-center gap-2 font-sans text-[0.9375rem] text-muted-foreground">
          <span className="min-w-0 truncate">{towerName ?? property.code}</span>
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

        <div className="mt-2.5 font-sans text-[1.125rem] font-bold tabular-nums text-brand">
          {compact}
          <span className="text-[0.9375rem] font-normal text-muted-foreground">{suffix}</span>
        </div>

        {/* Chỉ 2 thông số cốt lõi — phòng tắm & phần còn lại xem ở trang chi tiết. */}
        <div className="mt-2 flex items-center gap-4 font-sans text-[0.8125rem] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Maximize className="size-4" aria-hidden="true" />
            {property.areaM2} m²
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Bed className="size-4" aria-hidden="true" />
            {property.bedrooms}
            <span className="sr-only">{t('search.anyBeds')}</span>
          </span>
        </div>
      </div>
    </Link>
  )
}
