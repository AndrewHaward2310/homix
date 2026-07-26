'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { Star, ImageIcon, X, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Review } from '@/types'
import { useT } from '@/lib/i18n/provider'
import { cn } from '@/lib/utils'

/**
 * ReviewsSection — tóm tắt điểm + THANH PHÂN BỐ SAO + bộ lọc (theo sao / chỉ ảnh)
 * rồi danh sách review đã lọc. Tăng tin cậy tức thì (skill: Trust & Authority).
 * Tính toàn bộ từ mảng reviews nên luôn khớp dữ liệu hiển thị.
 */
export function ReviewsSection({ reviews }: { reviews: Review[] }) {
  const t = useT()
  const [star, setStar] = useState<number | null>(null)
  const [photosOnly, setPhotosOnly] = useState(false)
  // Lightbox ảnh review: bộ ảnh của 1 review + vị trí đang xem.
  const [view, setView] = useState<{ imgs: string[]; i: number; name: string } | null>(null)

  const stats = useMemo(() => {
    const total = reviews.length
    const avg = total ? reviews.reduce((s, r) => s + r.rating, 0) / total : 0
    const dist = [5, 4, 3, 2, 1].map((s) => ({ s, n: reviews.filter((r) => r.rating === s).length }))
    const withPhotos = reviews.filter((r) => r.images.length > 0).length
    return { total, avg, dist, withPhotos }
  }, [reviews])

  const shown = reviews.filter(
    (r) => (star == null || r.rating === star) && (!photosOnly || r.images.length > 0),
  )

  // Điều hướng lightbox bằng bàn phím: ←/→ chuyển ảnh, Esc đóng. Khoá cuộn nền.
  useEffect(() => {
    if (!view) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setView(null)
      else if (e.key === 'ArrowRight') setView((v) => (v ? { ...v, i: (v.i + 1) % v.imgs.length } : v))
      else if (e.key === 'ArrowLeft') setView((v) => (v ? { ...v, i: (v.i - 1 + v.imgs.length) % v.imgs.length } : v))
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [view])

  if (reviews.length === 0) {
    return <p className="mt-3 font-sans text-sm text-muted-foreground">{t('property.noReviews')}</p>
  }

  return (
    <div className="mt-4">
      {/* Tóm tắt: điểm lớn + phân bố sao */}
      <div className="grid gap-5 rounded-2xl border border-border bg-card p-5 sm:grid-cols-[auto_1fr] sm:items-center sm:gap-8">
        <div className="text-center sm:pr-6">
          <div className="font-display text-4xl font-bold tabular-nums text-foreground">
            {stats.avg.toFixed(1)}
          </div>
          <div className="mt-1 flex justify-center gap-0.5">
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                className={cn('size-4', i < Math.round(stats.avg) ? 'fill-amber-400 text-amber-400' : 'text-border')}
              />
            ))}
          </div>
          <div className="mt-1 font-sans text-[0.8125rem] text-muted-foreground">
            {t('property.reviewsCount', { count: stats.total })}
          </div>
        </div>

        <div className="flex flex-col gap-1.5" aria-hidden="true">
          {stats.dist.map(({ s, n }) => {
            const pct = stats.total ? Math.round((n / stats.total) * 100) : 0
            return (
              <div key={s} className="flex items-center gap-2.5">
                <span className="flex w-9 shrink-0 items-center gap-0.5 font-sans text-[0.75rem] tabular-nums text-muted-foreground">
                  {s} <Star className="size-3 fill-amber-400 text-amber-400" />
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-amber-400 transition-[width] duration-500" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-7 shrink-0 text-right font-sans text-[0.75rem] tabular-nums text-muted-foreground">{n}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Bộ lọc: theo sao + chỉ ảnh */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <FilterChip active={star == null && !photosOnly} onClick={() => { setStar(null); setPhotosOnly(false) }}>
          {t('review.filterAll')}
        </FilterChip>
        {[5, 4, 3, 2, 1].map((s) => (
          <FilterChip key={s} active={star === s} disabled={stats.dist.find((d) => d.s === s)!.n === 0} onClick={() => setStar(star === s ? null : s)}>
            {s} <Star className="size-3 fill-amber-400 text-amber-400" />
          </FilterChip>
        ))}
        {stats.withPhotos > 0 && (
          <FilterChip active={photosOnly} onClick={() => setPhotosOnly((v) => !v)}>
            <ImageIcon className="size-3.5" /> {t('review.withPhotos')} ({stats.withPhotos})
          </FilterChip>
        )}
      </div>

      {/* Danh sách đã lọc */}
      {shown.length === 0 ? (
        <p className="mt-4 font-sans text-sm text-muted-foreground">{t('review.noMatch')}</p>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {shown.map((r) => (
            <div key={r.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-full bg-secondary font-sans text-xs font-semibold text-foreground">
                  {r.customerName.charAt(0)}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-sans text-sm font-semibold text-foreground">{r.customerName}</p>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star key={i} className={cn('size-3', i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-border')} />
                    ))}
                  </div>
                </div>
              </div>
              <p className="mt-2.5 font-sans text-[0.875rem] leading-[1.6] text-muted-foreground">{r.comment}</p>
              {r.images.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {r.images.map((src, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setView({ imgs: r.images, i, name: r.customerName })}
                      aria-label={t('review.photoAlt', { name: r.customerName })}
                      className="relative size-16 overflow-hidden rounded-lg ring-1 ring-border transition hover:ring-brand focus-visible:ring-2 focus-visible:ring-brand active:scale-95"
                    >
                      <Image src={src} alt={t('review.photoAlt', { name: r.customerName })} fill sizes="64px" className="object-cover transition hover:scale-105" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox ảnh review */}
      {view && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t('review.photoAlt', { name: view.name })}
          onClick={() => setView(null)}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
        >
          <button
            type="button"
            aria-label={t('locator.close')}
            onClick={() => setView(null)}
            className="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          >
            <X className="size-5" />
          </button>

          {view.imgs.length > 1 && (
            <>
              <button
                type="button"
                aria-label={t('card.prevPhoto')}
                onClick={(e) => { e.stopPropagation(); setView((v) => (v ? { ...v, i: (v.i - 1 + v.imgs.length) % v.imgs.length } : v)) }}
                className="absolute left-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20 md:left-6"
              >
                <ChevronLeft className="size-6" />
              </button>
              <button
                type="button"
                aria-label={t('card.nextPhoto')}
                onClick={(e) => { e.stopPropagation(); setView((v) => (v ? { ...v, i: (v.i + 1) % v.imgs.length } : v)) }}
                className="absolute right-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20 md:right-6"
              >
                <ChevronRight className="size-6" />
              </button>
            </>
          )}

          <div className="relative max-h-[85vh] w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <img
              src={view.imgs[view.i]}
              alt={t('review.photoAlt', { name: view.name })}
              className="mx-auto max-h-[85vh] w-auto rounded-xl object-contain"
            />
            {view.imgs.length > 1 && (
              <div className="mt-3 text-center font-sans text-sm text-white/70">
                {view.i + 1} / {view.imgs.length}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function FilterChip({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-3 py-1.5 font-sans text-[0.8125rem] font-medium transition active:scale-95 disabled:opacity-40',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border text-foreground hover:bg-secondary',
      )}
    >
      {children}
    </button>
  )
}
