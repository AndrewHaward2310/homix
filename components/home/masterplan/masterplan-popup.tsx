'use client'

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Image from 'next/image'
import {
  X,
  ArrowRight,
  BedDouble,
  Waves,
  Trees,
  Droplets,
  Dumbbell,
  Car,
  Smartphone,
  BellRing,
  Anchor,
  Sprout,
  type LucideIcon,
} from 'lucide-react'
import { useLocale } from '@/lib/i18n/provider'
import { formatMoney } from '@/types'
import { cn } from '@/lib/utils'
import type { MasterplanTower } from '@/services/propertyService'

/** icon cho từng tiện ích nổi bật. */
const AMENITY_ICON: Record<string, LucideIcon> = {
  lake_view: Waves,
  park_view: Trees,
  pool: Droplets,
  private_pool: Droplets,
  gym: Dumbbell,
  parking: Car,
  smart_home: Smartphone,
  concierge: BellRing,
  marina: Anchor,
  garden: Sprout,
}

const STATUS_BADGE: Record<string, string> = {
  selling: 'bg-primary/10 text-primary',
  coming_soon: 'bg-secondary text-muted-foreground',
  sold_out: 'bg-secondary text-muted-foreground line-through decoration-1',
}

type Props = {
  tower: MasterplanTower
  isMobile: boolean
  /** Vị trí hotspot (px, tương đối với khung ảnh) để neo popup desktop. */
  point: { x: number; y: number }
  frame: { w: number; h: number }
  onClose: () => void
  onViewUnits: (tower: MasterplanTower) => void
}

const CARD_W = 264

export function MasterplanPopup({
  tower,
  isMobile,
  point,
  frame,
  onClose,
  onViewUnits,
}: Props) {
  const { locale, t } = useLocale()
  const cardRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const [cardH, setCardH] = useState(0)

  // Đo chiều cao thật của popup để canh/clamp trong khung (desktop).
  useLayoutEffect(() => {
    if (isMobile) return
    setCardH(cardRef.current?.offsetHeight ?? 0)
  }, [isMobile, tower.id])

  // Focus trap + đóng bằng Esc.
  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key !== 'Tab') return
      const focusables = cardRef.current?.querySelectorAll<HTMLElement>(
        'button, a, [tabindex]:not([tabindex="-1"])',
      )
      if (!focusables || focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const price = formatMoney(tower.priceFromVnd, locale)

  // Vị trí neo cho desktop: canh giữa theo x (clamp trong khung), ưu tiên phía trên.
  const GAP = 16
  const left = Math.min(Math.max(point.x, CARD_W / 2 + 8), frame.w - CARD_W / 2 - 8)
  // Ưu tiên đặt phía trên hotspot; nếu không đủ chỗ thì đặt phía dưới, rồi clamp trong khung.
  const roomAbove = point.y - GAP - cardH >= 8
  let cardTop = roomAbove ? point.y - GAP - cardH : point.y + GAP
  const maxTop = Math.max(8, frame.h - cardH - 8)
  cardTop = Math.min(Math.max(cardTop, 8), maxTop)

  const body = (
    <div
      ref={cardRef}
      role="dialog"
      aria-modal="true"
      aria-label={tower.name}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        'overflow-hidden border border-border bg-background/95 shadow-luxury-lg backdrop-blur-xl',
        isMobile
          ? 'w-full rounded-t-3xl motion-safe:animate-in motion-safe:slide-in-from-bottom motion-safe:duration-300'
          : 'w-[264px] rounded-2xl motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-200',
      )}
    >
      {/* Ảnh */}
      <div className={cn('relative', isMobile ? 'h-40' : 'h-32')}>
        <Image
          src={tower.image || '/placeholder.svg'}
          alt={tower.name}
          fill
          sizes="264px"
          className="object-cover"
        />
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label={t('locator.close')}
          className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full border border-glass-border bg-glass text-foreground backdrop-blur-xl transition-transform hover:scale-105 active:scale-95"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>

      {/* Nội dung */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-sans text-lg font-semibold tracking-[-0.01em] text-foreground">
            {tower.name}
          </h3>
          <span
            className={cn(
              'mt-0.5 shrink-0 rounded-full px-2.5 py-1 font-sans text-[0.6875rem] font-medium',
              STATUS_BADGE[tower.status],
            )}
          >
            {t(`tower.${tower.status}`)}
          </span>
        </div>

        <p className="mt-1 font-sans text-[0.875rem] text-muted-foreground">
          {t('locator.priceFrom')}{' '}
          <span className="font-semibold text-primary">{price}</span>
        </p>

        <p className="mt-1 flex items-center gap-1.5 font-sans text-[0.8125rem] text-muted-foreground">
          <BedDouble className="size-4" aria-hidden="true" />
          {t('locator.bedroomsRange', {
            min: tower.bedroomsRange.min,
            max: tower.bedroomsRange.max,
          })}
        </p>

        {/* Tiện ích icon */}
        {tower.amenities.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2">
            {tower.amenities.slice(0, 3).map((a) => {
              const Icon = AMENITY_ICON[a] ?? Waves
              return (
                <li
                  key={a}
                  className="flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 font-sans text-[0.75rem] text-foreground"
                >
                  <Icon className="size-3.5 text-primary" aria-hidden="true" />
                  {t(`amenity.${a}`)}
                </li>
              )
            })}
          </ul>
        )}

        <button
          type="button"
          onClick={() => onViewUnits(tower)}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 font-sans text-[0.875rem] font-medium text-primary-foreground transition-transform hover:-translate-y-0.5 active:translate-y-0"
        >
          {t('locator.viewUnits')}
          <ArrowRight className="size-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <div className="absolute inset-x-0 bottom-0 z-30 px-0" onClick={onClose}>
        {body}
      </div>
    )
  }

  return (
    <div
      className="absolute z-30"
      style={{
        left,
        top: cardTop,
        transform: 'translateX(-50%)',
        visibility: cardH === 0 ? 'hidden' : 'visible',
      }}
    >
      {body}
    </div>
  )
}
