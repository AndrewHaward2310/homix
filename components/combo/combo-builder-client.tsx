'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Check, Minus, Plus, Share2, ArrowRight, Sparkles } from 'lucide-react'
import type { Perk, Property } from '@/types'
import { pickLocale } from '@/types'
import { GlassNavbar } from '@/components/luxury/glass-navbar'
import { SiteFooter } from '@/components/home/site-footer'
import { Container } from '@/components/luxury/container'
import { H1, Body, Eyebrow } from '@/components/luxury/typography'
import { StateWrapper, type ViewState } from '@/components/ui/state-wrapper'
import { useToast } from '@/components/ui/toast'
import { searchProperties } from '@/services/propertyService'
import { getPerks } from '@/services/perkService'
import { getDiscountTiers } from '@/services/comboService'
import { priceCombo, tierFor, type DiscountTier } from '@/lib/combo-pricing'
import { useLocale } from '@/lib/i18n/provider'
import { cn } from '@/lib/utils'

/** Ép số nguyên trong [min,max]; giá trị lạ → fallback. */
function clampInt(raw: string | null, min: number, max: number, fallback: number): number {
  const n = Math.floor(Number(raw))
  if (!Number.isFinite(n)) return fallback
  return Math.min(Math.max(n, min), max)
}

/** Số lượng mặc định khi bật một trải nghiệm: vé bãi tắm tính theo số khách. */
function defaultQty(perk: Perk, guests: number): number {
  const q = perk.category === 'lake_ticket' ? Math.max(1, guests) : 1
  return Math.min(q, MAX_QTY)
}

const MAX_QTY = 20

/** Chuẩn hoá số lượng: chỉ nhận số NGUYÊN 1..MAX_QTY. */
const cleanQty = (v: unknown): number | null => {
  const n = Number(v)
  if (!Number.isInteger(n) || n < 1) return null
  return Math.min(n, MAX_QTY)
}
/** Id perk hợp lệ: không chứa ký tự phân tách của chuỗi URL. */
const cleanId = (id: string) => (id && !id.includes(',') && !id.includes(':') ? id : null)

/** Đọc/ghi trạng thái combo trên URL → chia sẻ được, không cần lưu DB. */
function parsePerks(raw: string | null): Record<string, number> {
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
const serializePerks = (sel: Record<string, number>) =>
  Object.entries(sel)
    .map(([id, q]) => {
      const cid = cleanId(id)
      const cq = cleanQty(q)
      return cid && cq ? `${cid}:${cq}` : null
    })
    .filter((x): x is string => x !== null)
    .join(',')

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

export function ComboBuilderClient() {
  const { locale, t, formatCurrency } = useLocale()
  const router = useRouter()
  const sp = useSearchParams()
  const toast = useToast()

  const [stays, setStays] = useState<Property[]>([])
  const [perks, setPerks] = useState<Perk[]>([])
  const [tiers, setTiers] = useState<DiscountTier[]>([])
  const [state, setState] = useState<ViewState>('loading')

  // ---- trạng thái đọc từ URL (nguồn sự thật, chia sẻ được) ----
  const propertyId = sp.get('p') ?? ''
  // Ép số nguyên + chặn cả sàn lẫn TRẦN (URL bịa ?n=999999&g=2.5 không phá giá).
  const nights = clampInt(sp.get('n'), 1, 30, 1)
  const guests = clampInt(sp.get('g'), 1, 12, 2)
  const selected = useMemo(() => parsePerks(sp.get('perks')), [sp])

  const setParams = useCallback(
    (next: Record<string, string | null>) => {
      const params = new URLSearchParams(sp.toString())
      for (const [k, v] of Object.entries(next)) {
        if (v == null || v === '') params.delete(k)
        else params.set(k, v)
      }
      router.replace(`?${params.toString()}`, { scroll: false })
    },
    [router, sp],
  )

  const load = useCallback(() => {
    setState('loading')
    Promise.all([
      searchProperties({ type: 'stay_short', pageSize: 48 }),
      getPerks(),
      // Bậc giảm giá là dữ liệu PHỤ — lỗi thì coi như không giảm, không đánh sập builder.
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

  // Bậc kế tiếp để gợi ý "thêm N món nữa → giảm X%"
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
    else next[perk.id] = Math.min(q, 20)
    setParams({ perks: serializePerks(next) || null })
  }

  const share = async () => {
    const url = window.location.href
    try {
      await navigator.clipboard.writeText(url)
      toast({ message: t('builder.shared'), variant: 'success' })
      return
    } catch {
      // Trình duyệt chặn Clipboard API (http, thiếu quyền) → fallback execCommand.
    }
    try {
      const ta = document.createElement('textarea')
      ta.value = url
      ta.setAttribute('readonly', '')
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(ta)
      toast({
        message: ok ? t('builder.shared') : url,
        variant: ok ? 'success' : 'info',
      })
    } catch {
      toast({ message: url, variant: 'info' })
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <GlassNavbar solid />
      <main className="pt-[72px] md:pt-[88px]">
        <Container className="py-10 md:py-14">
          <Eyebrow>{t('builder.eyebrow')}</Eyebrow>
          <H1 className="mt-3 font-display">{t('builder.title')}</H1>
          <Body className="mt-4 max-w-xl">{t('builder.subtitle')}</Body>

          <StateWrapper state={state} className="mt-10" onRetry={load} retryLabel={t('locator.retry')}>
            <div className="grid items-start gap-8 lg:grid-cols-[1.45fr_.95fr]">
              {/* ---------- TRÁI: các bước ---------- */}
              <div className="space-y-8">
                {/* Bước 1 — chỗ ở */}
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
                            on
                              ? 'border-brand ring-2 ring-brand/20'
                              : 'border-border hover:border-brand/40',
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
                              <span className="font-normal text-muted-foreground">
                                {t('builder.perNight')}
                              </span>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </section>

                {/* Bước 2 — đêm & khách */}
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

                {/* Bước 3 — trải nghiệm */}
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
                            {/* MỘT nút toggle duy nhất (ô check + tên) — tránh trình đọc
                                màn hình đọc trùng và lệch trạng thái. */}
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
                                  on
                                    ? 'border-brand bg-brand text-brand-foreground'
                                    : 'border-border text-transparent',
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
                        {t('builder.yourCombo')}
                      </h2>

                      <ul className="mt-3 space-y-0">
                        <li className="flex items-center justify-between gap-3 border-b border-dashed border-border py-2 font-sans text-[0.875rem]">
                          <span className="text-muted-foreground">
                            {t('builder.stayLine', { n: nights })}
                          </span>
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
                            {/* Chỉ hiện giá lẻ gạch ngang KHI thực sự có tiết kiệm */}
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

                          {/* Gợi ý bậc kế tiếp */}
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

                      <div className="mt-5 flex gap-2">
                        {/* Mang theo combo đã xếp sang trang đặt — không mất đêm/khách/trải nghiệm. */}
                        <Link
                          href={`/property/${property.id}?nights=${nights}&guests=${guests}${
                            serializePerks(selected) ? `&perks=${serializePerks(selected)}` : ''
                          }`}
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 font-sans text-[0.9rem] font-semibold text-primary-foreground transition hover:brightness-110"
                        >
                          {t('builder.book')}
                          <ArrowRight className="size-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={share}
                          className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-background px-4 py-3 font-sans text-[0.9rem] font-semibold text-foreground transition hover:bg-secondary"
                        >
                          <Share2 className="size-4" />
                          {t('builder.share')}
                        </button>
                      </div>
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
        </Container>
      </main>
      <SiteFooter />
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
