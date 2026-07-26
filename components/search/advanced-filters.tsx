'use client'

import { useEffect, useRef, useState } from 'react'
import { X, RotateCcw } from 'lucide-react'
import { useT } from '@/lib/i18n/provider'
import { cn } from '@/lib/utils'

/** Tiện ích lọc được — khớp giá trị lưu ở Property.amenities + key i18n amenity.* */
export const FILTERABLE_AMENITIES = [
  'pool',
  'private_pool',
  'gym',
  'parking',
  'lake_view',
  'park_view',
  'smart_home',
  'concierge',
  'marina',
  'garden',
] as const

export type AdvancedValues = {
  minPrice?: number
  maxPrice?: number
  minArea?: number
  maxArea?: number
  baths?: number
  amenities: string[]
}

const numOrU = (v: string): number | undefined => {
  const n = Number(v)
  return v.trim() !== '' && Number.isFinite(n) && n >= 0 ? n : undefined
}

/**
 * Bảng lọc NÂNG CAO — modal: khoảng giá, diện tích, số phòng tắm, tiện ích.
 * Chỉ áp khi bấm "Áp dụng" (không đổi URL từng phím gõ). Đóng bằng Escape / nền.
 */
export function AdvancedFilters({
  open,
  initial,
  onClose,
  onApply,
}: {
  open: boolean
  initial: AdvancedValues
  onClose: () => void
  onApply: (v: AdvancedValues) => void
}) {
  const t = useT()
  const [draft, setDraft] = useState<AdvancedValues>(initial)
  const dialogRef = useRef<HTMLDivElement>(null)
  const restoreRef = useRef<HTMLElement | null>(null)
  // Giữ `initial` mới nhất mà không đưa vào deps — tránh reset nháp khi parent
  // re-render (initial là object literal mới mỗi lần render).
  const initialRef = useRef(initial)
  initialRef.current = initial

  // Chỉ đồng bộ nháp từ URL đúng lúc MỞ panel (không ghi đè khi đang gõ).
  useEffect(() => {
    if (open) setDraft(initialRef.current)
  }, [open])

  // A11y: khoá cuộn nền, focus, Escape đóng, trả focus, và TRAP Tab trong dialog.
  useEffect(() => {
    if (!open) return
    restoreRef.current = document.activeElement as HTMLElement | null
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key !== 'Tab') return
      const nodes = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      if (!nodes || nodes.length === 0) return
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
      restoreRef.current?.focus?.()
    }
  }, [open, onClose])

  if (!open) return null

  const set = (patch: Partial<AdvancedValues>) => setDraft((d) => ({ ...d, ...patch }))
  const toggleAmenity = (a: string) =>
    setDraft((d) => ({
      ...d,
      amenities: d.amenities.includes(a) ? d.amenities.filter((x) => x !== a) : [...d.amenities, a],
    }))

  const reset: AdvancedValues = { amenities: [] }
  const field =
    'w-full rounded-xl border border-border bg-background px-3 py-2 font-sans text-[0.9rem] text-foreground outline-none transition focus:ring-2 focus:ring-primary/30'

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-black/50 p-0 animate-[overlay-in_0.2s_ease-out] sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={t('search.advanced')}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="sheet-enter max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-border bg-card p-5 shadow-luxury-lg outline-none sm:rounded-3xl sm:p-6"
      >
        {/* Tay kéo bottom-sheet (chỉ mobile) */}
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-border sm:hidden" aria-hidden="true" />

        <div className="flex items-center justify-between">
          <h2 className="font-display text-[1.2rem] font-bold text-foreground">{t('search.advanced')}</h2>
          <button
            type="button"
            aria-label={t('locator.close')}
            onClick={onClose}
            className="grid size-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-secondary"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Khoảng giá */}
        <fieldset className="mt-5">
          <legend className="mb-2 font-sans text-[0.8125rem] font-semibold text-foreground">
            {t('search.priceRange')} ({t('search.unitVnd')})
          </legend>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              inputMode="numeric"
              placeholder={t('search.min')}
              className={field}
              value={draft.minPrice ?? ''}
              onChange={(e) => set({ minPrice: numOrU(e.target.value) })}
            />
            <span className="text-muted-foreground">–</span>
            <input
              type="number"
              min={0}
              inputMode="numeric"
              placeholder={t('search.max')}
              className={field}
              value={draft.maxPrice ?? ''}
              onChange={(e) => set({ maxPrice: numOrU(e.target.value) })}
            />
          </div>
        </fieldset>

        {/* Diện tích */}
        <fieldset className="mt-4">
          <legend className="mb-2 font-sans text-[0.8125rem] font-semibold text-foreground">
            {t('search.area')} (m²)
          </legend>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              inputMode="numeric"
              placeholder={t('search.min')}
              className={field}
              value={draft.minArea ?? ''}
              onChange={(e) => set({ minArea: numOrU(e.target.value) })}
            />
            <span className="text-muted-foreground">–</span>
            <input
              type="number"
              min={0}
              inputMode="numeric"
              placeholder={t('search.max')}
              className={field}
              value={draft.maxArea ?? ''}
              onChange={(e) => set({ maxArea: numOrU(e.target.value) })}
            />
          </div>
        </fieldset>

        {/* Số phòng tắm */}
        <fieldset className="mt-4">
          <legend className="mb-2 font-sans text-[0.8125rem] font-semibold text-foreground">
            {t('search.baths')}
          </legend>
          <div className="flex flex-wrap gap-2">
            {[undefined, 1, 2, 3].map((n, i) => {
              const on = draft.baths === n || (n === undefined && draft.baths == null)
              return (
                <button
                  key={i}
                  type="button"
                  aria-pressed={on}
                  onClick={() => set({ baths: n })}
                  className={cn(
                    'rounded-full border px-4 py-1.5 font-sans text-[0.8125rem] font-medium transition',
                    on ? 'border-brand bg-brand/10 text-brand' : 'border-border text-foreground hover:border-brand/40',
                  )}
                >
                  {n === undefined ? t('search.any') : `≥ ${n}`}
                </button>
              )
            })}
          </div>
        </fieldset>

        {/* Tiện ích */}
        <fieldset className="mt-4">
          <legend className="mb-2 font-sans text-[0.8125rem] font-semibold text-foreground">
            {t('search.amenities')}
          </legend>
          <div className="flex flex-wrap gap-2">
            {FILTERABLE_AMENITIES.map((a) => {
              const on = draft.amenities.includes(a)
              return (
                <button
                  key={a}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleAmenity(a)}
                  className={cn(
                    'rounded-full border px-3.5 py-1.5 font-sans text-[0.8125rem] font-medium transition',
                    on ? 'border-brand bg-brand/10 text-brand' : 'border-border text-foreground hover:border-brand/40',
                  )}
                >
                  {t(`amenity.${a}`)}
                </button>
              )
            })}
          </div>
        </fieldset>

        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setDraft(reset)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2.5 font-sans text-[0.875rem] font-semibold text-foreground transition hover:bg-secondary"
          >
            <RotateCcw className="size-4" />
            {t('search.reset')}
          </button>
          <button
            type="button"
            onClick={() => onApply(draft)}
            className="flex-1 rounded-full bg-primary px-5 py-2.5 font-sans text-[0.9rem] font-semibold text-primary-foreground transition hover:brightness-110"
          >
            {t('search.apply')}
          </button>
        </div>
      </div>
    </div>
  )
}
