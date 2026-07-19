'use client'

import type { ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { Check, Minus, Plus, Sparkles } from 'lucide-react'
import type { Perk, Property } from '@/types'
import { pickLocale } from '@/types'
import { StateWrapper, type ViewState } from '@/components/ui/state-wrapper'
import { searchProperties } from '@/services/propertyService'
import { getPerks } from '@/services/perkService'
import { getDiscountTiers } from '@/services/comboService'
import { priceCombo, type ComboPrice, type DiscountTier } from '@/lib/combo-pricing'
import { useLocale } from '@/lib/i18n/provider'
import { cn } from '@/lib/utils'

const MAX_QTY = 20

/** Ép số nguyên trong [min,max]; giá trị lạ → fallback. */
export function clampInt(raw: string | null, min: number, max: number, fallback: number): number {
  const n = Math.floor(Number(raw))
  if (!Number.isFinite(n)) return fallback
  return Math.min(Math.max(n, min), max)
}

/** Số lượng mặc định khi bật một trải nghiệm: vé bãi tắm tính theo số khách. */
function defaultQty(perk: Perk, guests: number): number {
  const q = perk.category === 'lake_ticket' ? Math.max(1, guests) : 1
  return Math.min(q, MAX_QTY)
}

/** Chuẩn hoá số lượng: chỉ nhận số NGUYÊN 1..MAX_QTY. */
const cleanQty = (v: unknown): number | null => {
  const n = Number(v)
  if (!Number.isInteger(n) || n < 1) return null
  return Math.min(n, MAX_QTY)
}
/** Id perk hợp lệ: không chứa ký tự phân tách của chuỗi URL. */
const cleanId = (id: string) => (id && !id.includes(',') && !id.includes(':') ? id : null)

/** Đọc/ghi trạng thái combo trên URL → chia sẻ được, không cần lưu DB. */
export function parsePerks(raw: string | null): Record<string, number> {
  if (!raw) return {}
  const out: Record<string, number> = {}
  for (const part of raw.split(',')) {
    const [rawId, q] = part.split(':')
    const id = cleanId(rawId)
    const qty = cleanQty(q)
    if (id && qty) out[id] = qty
  }
  return out
}
export const serializePerks = (sel: Record<string, number>) =>
  Object.entries(sel)
    .map(([id, q]) => {
      const cid = cleanId(id)
      const cq = cleanQty(q)
      return cid && cq ? `${cid}:${cq}` : null
    })
    .filter((x): x is string => x !== null)
    .join(',')

/** Link đặt combo cho KHÁCH: /property/[id]?nights=&guests=&perks= (nguồn sự thật). */
export function buildComboLink(propertyId: string, nights: number, guests: number, sel: Record<string, number>) {
  const perks = serializePerks(sel)
  return `/property/${propertyId}?nights=${nights}&guests=${guests}${perks ? `&perks=${perks}` : ''}`
}

/** Sao chép text vào clipboard, fallback execCommand khi Clipboard API bị chặn. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // http / thiếu quyền → thử execCommand
  }
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}

/** Snapshot trạng thái builder truyền cho vùng hành động (public: đặt/chia sẻ; sale: báo giá). */
export type BuilderSnapshot = {
  property: Property
  nights: number
  guests: number
  selected: Record<string, number>
  chosen: { perk: Perk; qty: number }[]
  priced: ComboPrice | null
  /** Link đặt combo dành cho khách. */
  quoteLink: string
}

function Stepper({
  value,
  onChange,
  min = 1,
  max = 30,
  label,
  decreaseLabel,
  increaseLabel,
}: {
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
  label: string
  decreaseLabel: string
  increaseLabel: string
}) {
  return (
    <div className="flex flex-1 items-center justify-between rounded-2xl border border-border bg-card px-4 py-3">
      <div>
        <div className="font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </div>
        <div className="font-display text-[1.15rem] font-bold text-foreground tabular-nums">{value}</div>
      </div>
      <div className="flex gap-1.5">
        <button
          type="button"
          aria-label={`${decreaseLabel} ${label}`}
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
          className="grid size-8 place-items-center rounded-lg bg-secondary text-foreground transition hover:brightness-95 disabled:opacity-40"
        >
          <Minus className="size-4" />
        </button>
        <button
          type="button"
          aria-label={`${increaseLabel} ${label}`}
          disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + 1))}
          className="grid size-8 place-items-center rounded-lg bg-secondary text-foreground transition hover:brightness-95 disabled:opacity-40"
        >
          <Plus className="size-4" />
        </button>
      </div>
    </div>
  )
}

function StepTitle({ n, title }: { n: number; title: string }) {
  return (
    <h2 className="flex items-center gap-2.5 font-sans text-[0.95rem] font-bold text-foreground">
      <span className="grid size-6 place-items-center rounded-full bg-brand font-sans text-[0.75rem] font-bold text-brand-foreground">
        {n}
      </span>
      {title}
    </h2>
  )
}

/**
 * Lõi trình thiết kế combo — dùng chung cho trang KHÁCH (`/combo/tu-thiet-ke`) và
 * công cụ BÁO GIÁ của SALE (`/agent/collections`). Trạng thái đọc/ghi trên URL nên
 * mỗi nơi tự chia sẻ được. Vùng hành động (đặt / chia sẻ / báo giá) truyền qua
 * `renderActions` để hai ngữ cảnh khác nhau mà vẫn chung một logic giá.
 */
export function ComboBuilderCore({
  sp,
  onParams,
  renderActions,
  summaryHeading,
}: {
  sp: URLSearchParams
  onParams: (next: Record<string, string | null>) => void
  renderActions?: (s: BuilderSnapshot) => ReactNode
  summaryHeading?: string
}) {
  const { locale, t, formatCurrency } = useLocale()

  const [stays, setStays] = useState<Property[]>([])
  const [perks, setPerks] = useState<Perk[]>([])
  const [tiers, setTiers] = useState<DiscountTier[]>([])
  const [state, setState] = useState<ViewState>('loading')

  // ---- trạng thái đọc từ URL (nguồn sự thật, chia sẻ được) ----
  const propertyId = sp.get('p') ?? ''
  const nights = clampInt(sp.get('n'), 1, 30, 1)
  const guests = clampInt(sp.get('g'), 1, 12, 2)
  const selected = useMemo(() => parsePerks(sp.get('perks')), [sp])

  const setParams = useCallback(
    (next: Record<string, string | null>) => onParams(next),
    [onParams],
  )

  const load = useCallback(() => {
    setState('loading')
    Promise.all([
      searchProperties({ type: 'stay_short', pageSize: 48 }),
      getPerks(),
      getDiscountTiers().catch(() => [] as DiscountTier[]),
    ])
      .then(([res, pk, tr]) => {
        const available = res.items.filter((p) => p.status === 'available')
        setStays(available)
        setPerks(pk)
        setTiers(tr)
        setState(available.length ? 'success' : 'empty')
      })
      .catch(() => setState('error'))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // Chuẩn hoá URL sau khi có dữ liệu: chọn sẵn căn đầu tiên, thay id căn không tồn tại,
  // và loại bỏ perk id lạ (URL do người dùng sửa tay / link cũ).
  useEffect(() => {
    if (stays.length === 0) return
    const validProperty = stays.some((s) => s.id === propertyId)
    const patch: Record<string, string | null> = {}
    if (!validProperty) patch.p = stays[0].id

    if (perks.length > 0) {
      const known = new Set(perks.map((p) => p.id))
      const filtered = Object.fromEntries(
        Object.entries(selected).filter(([id]) => known.has(id)),
      )
      const nextRaw = serializePerks(filtered)
      if (nextRaw !== (sp.get('perks') ?? '')) patch.perks = nextRaw || null
    }
    if (Object.keys(patch).length > 0) setParams(patch)
  }, [propertyId, stays, perks, selected, sp, setParams])

  const property = stays.find((p) => p.id === propertyId) ?? null
  const perkById = useMemo(() => new Map(perks.map((p) => [p.id, p])), [perks])

  const chosen = useMemo(
    () =>
      Object.entries(selected)
        .map(([id, qty]) => {
          const perk = perkById.get(id)
          return perk ? { perk, qty } : null
        })
        .filter((x): x is { perk: Perk; qty: number } => x !== null),
    [selected, perkById],
  )

  const priced = useMemo(
    () =>
      property
        ? priceCombo({
            pricePerNightVnd: property.priceVnd,
            nights,
            perks: chosen.map((c) => ({ priceVnd: c.perk.priceVnd, qty: c.qty })),
            tiers,
          })
        : null,
    [property, nights, chosen, tiers],
  )

  const nextTier = useMemo(() => {
    const count = chosen.length
    const upcoming = [...tiers]
      .filter((x) => x.minPerks > count)
      .sort((a, b) => a.minPerks - b.minPerks)[0]
    return { upcoming }
  }, [chosen.length, tiers])

  const togglePerk = (perk: Perk) => {
    const next = { ...selected }
    if (next[perk.id]) delete next[perk.id]
    else next[perk.id] = defaultQty(perk, guests)
    setParams({ perks: serializePerks(next) || null })
  }

  const changeQty = (perk: Perk, delta: number) => {
    const next = { ...selected }
    const q = (next[perk.id] ?? 0) + delta
    if (q <= 0) delete next[perk.id]
    else next[perk.id] = Math.min(q, MAX_QTY)
    setParams({ perks: serializePerks(next) || null })
  }

  const snapshot: BuilderSnapshot | null = property
    ? {
        property,
        nights,
        guests,
        selected,
        chosen,
        priced,
        quoteLink: buildComboLink(property.id, nights, guests, selected),
      }
    : null

  return (
    <StateWrapper state={state} onRetry={load} retryLabel={t('locator.retry')}>
      <div className="grid items-start gap-8 lg:grid-cols-[1.45fr_.95fr]">
        {/* ---------- TRÁI: các bước ---------- */}
        <div className="space-y-8">
          <section>
            <StepTitle n={1} title={t('builder.step1')} />
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {stays.map((p) => {
                const on = p.id === propertyId
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setParams({ p: p.id })}
                    aria-pressed={on}
                    className={cn(
                      'overflow-hidden rounded-2xl border bg-card text-left transition',
                      on ? 'border-brand ring-2 ring-brand/20' : 'border-border hover:border-brand/40',
                    )}
                  >
                    <div className="relative aspect-[16/10]">
                      {p.images[0] && (
                        <Image
                          src={p.images[0]}
                          alt={pickLocale(p.title, locale)}
                          fill
                          sizes="240px"
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="p-2.5">
                      <div className="line-clamp-2 min-h-[2.5em] font-sans text-[0.8125rem] font-semibold leading-snug text-foreground">
                        {pickLocale(p.title, locale)}
                      </div>
                      <div className="mt-1 font-sans text-[0.8125rem] font-bold text-brand">
                        {formatCurrency(p.priceVnd)}
                        <span className="font-normal text-muted-foreground">{t('builder.perNight')}</span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </section>

          <section>
            <StepTitle n={2} title={t('builder.step2')} />
            <div className="mt-3 flex gap-3">
              <Stepper
                label={t('builder.nights')}
                decreaseLabel={t('builder.decrease')}
                increaseLabel={t('builder.increase')}
                value={nights}
                onChange={(v) => setParams({ n: String(v) })}
              />
              <Stepper
                label={t('builder.guests')}
                decreaseLabel={t('builder.decrease')}
                increaseLabel={t('builder.increase')}
                value={guests}
                min={1}
                max={12}
                onChange={(v) => setParams({ g: String(v) })}
              />
            </div>
          </section>

          <section>
            <StepTitle n={3} title={t('builder.step3')} />
            <ul className="mt-3 space-y-2.5">
              {perks.map((perk) => {
                const qty = selected[perk.id] ?? 0
                const on = qty > 0
                return (
                  <li key={perk.id}>
                    <div
                      className={cn(
                        'flex items-center gap-3 rounded-2xl border bg-card p-3.5 transition',
                        on ? 'border-brand ring-2 ring-brand/15' : 'border-border',
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => togglePerk(perk)}
                        aria-pressed={on}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      >
                        <span
                          aria-hidden="true"
                          className={cn(
                            'grid size-6 shrink-0 place-items-center rounded-md border-2 transition',
                            on ? 'border-brand bg-brand text-brand-foreground' : 'border-border text-transparent',
                          )}
                        >
                          <Check className="size-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block font-sans text-[0.9rem] font-semibold text-foreground">
                            {pickLocale(perk.name, locale)}
                          </span>
                          <span className="block font-sans text-[0.8125rem] text-muted-foreground">
                            {formatCurrency(perk.priceVnd)}
                          </span>
                        </span>
                      </button>
                      {on && (
                        <div className="flex shrink-0 items-center gap-1.5">
                          <button
                            type="button"
                            aria-label={`${t('builder.decrease')} ${pickLocale(perk.name, locale)}`}
                            onClick={() => changeQty(perk, -1)}
                            className="grid size-7 place-items-center rounded-lg bg-secondary"
                          >
                            <Minus className="size-3.5" />
                          </button>
                          <span className="w-6 text-center font-sans text-[0.875rem] font-bold tabular-nums">
                            {qty}
                          </span>
                          <button
                            type="button"
                            aria-label={`${t('builder.increase')} ${pickLocale(perk.name, locale)}`}
                            onClick={() => changeQty(perk, 1)}
                            className="grid size-7 place-items-center rounded-lg bg-secondary"
                          >
                            <Plus className="size-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>
        </div>

        {/* ---------- PHẢI: tóm tắt dính ---------- */}
        <aside className="lg:sticky lg:top-28 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto">
          <div className="rounded-3xl border border-border bg-card p-5 shadow-luxury">
            {property ? (
              <>
                <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-secondary">
                  {property.images[0] && (
                    <Image
                      src={property.images[0]}
                      alt={pickLocale(property.title, locale)}
                      fill
                      sizes="380px"
                      className="object-cover"
                    />
                  )}
                </div>
                <h2 className="mt-4 font-display text-[1.05rem] font-bold text-foreground">
                  {summaryHeading ?? t('builder.yourCombo')}
                </h2>

                <ul className="mt-3 space-y-0">
                  <li className="flex items-center justify-between gap-3 border-b border-dashed border-border py-2 font-sans text-[0.875rem]">
                    <span className="text-muted-foreground">{t('builder.stayLine', { n: nights })}</span>
                    <span className="shrink-0 font-semibold text-foreground">
                      {formatCurrency(property.priceVnd * nights)}
                    </span>
                  </li>
                  {chosen.length === 0 && (
                    <li className="py-2 font-sans text-[0.8125rem] text-muted-foreground">
                      {t('builder.noPerk')}
                    </li>
                  )}
                  {chosen.map(({ perk, qty }) => (
                    <li
                      key={perk.id}
                      className="flex items-center justify-between gap-3 border-b border-dashed border-border py-2 font-sans text-[0.875rem]"
                    >
                      <span className="min-w-0 text-muted-foreground">
                        {pickLocale(perk.name, locale)}
                        {qty > 1 && <span className="text-foreground"> ×{qty}</span>}
                      </span>
                      <span className="shrink-0 font-semibold text-foreground">
                        {formatCurrency(perk.priceVnd * qty)}
                      </span>
                    </li>
                  ))}
                </ul>

                {priced && (
                  <>
                    <div className="mt-4 flex items-end justify-between gap-3">
                      {priced.savingsVnd > 0 ? (
                        <div>
                          <div className="font-sans text-[0.75rem] text-muted-foreground">
                            {t('builder.listPrice')}
                          </div>
                          <div className="font-sans text-[0.875rem] text-muted-foreground line-through">
                            {formatCurrency(priced.listPriceVnd)}
                          </div>
                        </div>
                      ) : (
                        <span />
                      )}
                      <div className="text-right">
                        <div className="font-sans text-[0.75rem] text-muted-foreground">
                          {t('builder.packagePrice')}
                        </div>
                        <div className="font-display text-[1.75rem] font-bold leading-none text-foreground">
                          {formatCurrency(priced.packagePriceVnd)}
                        </div>
                      </div>
                    </div>

                    {priced.savingsVnd > 0 && (
                      <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand px-3 py-1.5 font-sans text-[0.8125rem] font-bold text-brand-foreground">
                        <Sparkles className="size-3.5" />
                        {t('builder.saveBadge', {
                          pct: priced.savingsPct,
                          amount: formatCurrency(priced.savingsVnd),
                        })}
                      </div>
                    )}

                    <div className="mt-3 flex items-center justify-between font-sans text-[0.8125rem] text-muted-foreground">
                      <span>{t('builder.perPerson', { n: guests })}</span>
                      <span className="font-semibold text-foreground">
                        {t('builder.perPersonValue', {
                          amount: formatCurrency(Math.round(priced.packagePriceVnd / guests)),
                        })}
                      </span>
                    </div>

                    <div className="mt-4 rounded-2xl border border-dashed border-brand/40 bg-brand/5 px-3.5 py-2.5 font-sans text-[0.8125rem] font-semibold text-brand">
                      {nextTier.upcoming
                        ? t('builder.nextTier', {
                            n: nextTier.upcoming.minPerks - chosen.length,
                            pct: nextTier.upcoming.percent,
                          })
                        : t('builder.maxTier')}
                    </div>
                  </>
                )}

                {snapshot && <div className="mt-5">{renderActions?.(snapshot)}</div>}
              </>
            ) : (
              <p className="py-8 text-center font-sans text-[0.9rem] text-muted-foreground">
                {t('builder.empty')}
              </p>
            )}
          </div>
        </aside>
      </div>
    </StateWrapper>
  )
}
