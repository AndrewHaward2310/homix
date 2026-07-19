'use client'

import { useEffect, useRef, useState } from 'react'
import { X, ArrowRight, Sparkles, Check, Loader2 } from 'lucide-react'
import type { Perk } from '@/types'
import { getPerks } from '@/services/perkService'
import { useT } from '@/lib/i18n/provider'
import { cn } from '@/lib/utils'
import { serializePerks } from './combo-builder-core'

/** Nhóm khách → số người mặc định. */
const PARTY = [
  { key: 'couple', guests: 2 },
  { key: 'family', guests: 4 },
  { key: 'friends', guests: 6 },
] as const

/**
 * Sở thích → perk ĐƯỢC ƯU TIÊN (theo id, không theo category) để chọn đúng trải nghiệm
 * hợp nghĩa, không phụ thuộc thứ tự dữ liệu. `lake_ticket` tính theo số khách.
 */
const INTEREST: { key: string; perkIds: string[] }[] = [
  { key: 'relax', perkIds: ['pk_bbq'] },
  { key: 'water', perkIds: ['pk_lake_ticket', 'pk_kayak'] },
  { key: 'food', perkIds: ['pk_breakfast'] },
]

/**
 * Wizard "hỏi nhanh" — một trong ba lối vào builder. Hỏi đi với ai / mấy đêm /
 * thích gì rồi dựng sẵn combo (n/g/perks) và áp vào URL builder. Không tự tính giá:
 * builder vẫn là nguồn sự thật, wizard chỉ đặt điểm khởi đầu.
 */
export function ComboWizard({
  open,
  onClose,
  onApply,
}: {
  open: boolean
  onClose: () => void
  onApply: (patch: { n: string; g: string; perks: string | null }) => void
}) {
  const t = useT()
  const [perks, setPerks] = useState<Perk[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [reload, setReload] = useState(0)
  const [party, setParty] = useState<(typeof PARTY)[number]['key']>('couple')
  const [nights, setNights] = useState(2)
  const [interests, setInterests] = useState<string[]>(['relax'])
  const dialogRef = useRef<HTMLDivElement>(null)
  const restoreRef = useRef<HTMLElement | null>(null)

  // Nạp perk khi mở — chỉ cho "Dựng combo" sau khi có dữ liệu (tránh dựng combo rỗng).
  useEffect(() => {
    if (!open) return
    let active = true
    setStatus('loading')
    getPerks()
      .then((rows) => {
        if (!active) return
        setPerks(rows)
        setStatus('ready')
      })
      .catch(() => active && setStatus('error'))
    return () => {
      active = false
    }
  }, [open, reload])

  // A11y: khoá cuộn nền, focus vào modal, đóng bằng Escape, trả focus về nút mở,
  // và giữ focus trong modal (Tab vòng lại).
  useEffect(() => {
    if (!open) return
    restoreRef.current = document.activeElement as HTMLElement | null
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key !== 'Tab') return
      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
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
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      restoreRef.current?.focus?.()
    }
  }, [open, onClose])

  if (!open) return null

  const guests = PARTY.find((p) => p.key === party)!.guests

  const toggleInterest = (key: string) =>
    setInterests((xs) => (xs.includes(key) ? xs.filter((x) => x !== key) : [...xs, key]))

  const apply = () => {
    if (status !== 'ready') return
    // Với mỗi sở thích, chọn các perk ưu tiên (theo id) thực sự tồn tại.
    const sel: Record<string, number> = {}
    const known = new Set(perks.map((p) => p.id))
    const wantIds = new Set(interests.flatMap((k) => INTEREST.find((i) => i.key === k)?.perkIds ?? []))
    for (const id of wantIds) {
      if (!known.has(id)) continue
      sel[id] = id === 'pk_lake_ticket' ? Math.max(1, guests) : 1
    }
    onApply({ n: String(nights), g: String(guests), perks: serializePerks(sel) || null })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-black/50 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={t('wizard.title')}
        tabIndex={-1}
        className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-luxury-lg outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 font-sans text-[0.8125rem] font-bold text-brand">
              <Sparkles className="size-4" />
              {t('wizard.eyebrow')}
            </div>
            <h2 className="mt-1 font-display text-[1.25rem] font-bold text-foreground">
              {t('wizard.title')}
            </h2>
          </div>
          <button
            type="button"
            aria-label={t('locator.close')}
            onClick={onClose}
            className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition hover:bg-secondary"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Bước 1 — đi với ai */}
        <fieldset className="mt-5">
          <legend className="font-sans text-[0.8125rem] font-semibold text-foreground">
            {t('wizard.party')}
          </legend>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {PARTY.map((p) => (
              <button
                key={p.key}
                type="button"
                aria-pressed={party === p.key}
                onClick={() => setParty(p.key)}
                className={cn(
                  'rounded-xl border px-3 py-2.5 font-sans text-[0.8125rem] font-medium transition',
                  party === p.key
                    ? 'border-brand bg-brand/10 text-brand'
                    : 'border-border text-foreground hover:border-brand/40',
                )}
              >
                {t(`wizard.party.${p.key}`)}
              </button>
            ))}
          </div>
        </fieldset>

        {/* Bước 2 — mấy đêm */}
        <fieldset className="mt-4">
          <legend className="font-sans text-[0.8125rem] font-semibold text-foreground">
            {t('wizard.nights')}
          </legend>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {[1, 2, 3].map((n) => (
              <button
                key={n}
                type="button"
                aria-pressed={nights === n}
                onClick={() => setNights(n)}
                className={cn(
                  'rounded-xl border px-3 py-2.5 font-sans text-[0.8125rem] font-medium transition',
                  nights === n
                    ? 'border-brand bg-brand/10 text-brand'
                    : 'border-border text-foreground hover:border-brand/40',
                )}
              >
                {t('wizard.nightsN', { n })}
              </button>
            ))}
          </div>
        </fieldset>

        {/* Bước 3 — thích gì (nhiều lựa chọn) */}
        <fieldset className="mt-4">
          <legend className="font-sans text-[0.8125rem] font-semibold text-foreground">
            {t('wizard.interests')}
          </legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {INTEREST.map((i) => {
              const on = interests.includes(i.key)
              return (
                <button
                  key={i.key}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleInterest(i.key)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 font-sans text-[0.8125rem] font-medium transition',
                    on
                      ? 'border-brand bg-brand/10 text-brand'
                      : 'border-border text-foreground hover:border-brand/40',
                  )}
                >
                  {on && <Check className="size-3.5" />}
                  {t(`wizard.interest.${i.key}`)}
                </button>
              )
            })}
          </div>
        </fieldset>

        {status === 'error' ? (
          <div className="mt-6 flex items-center justify-between gap-3 rounded-xl border border-red-500/40 bg-red-500/5 px-4 py-3 font-sans text-[0.8125rem] text-red-600">
            {t('wizard.loadError')}
            <button
              type="button"
              onClick={() => setReload((n) => n + 1)}
              className="font-semibold text-brand underline underline-offset-2"
            >
              {t('locator.retry')}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={apply}
            disabled={status !== 'ready'}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 font-sans text-[0.9rem] font-semibold text-primary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {t('wizard.build')}
            {status === 'loading' ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ArrowRight className="size-4" />
            )}
          </button>
        )}
      </div>
    </div>
  )
}
