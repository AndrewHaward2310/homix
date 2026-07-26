'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Moon,
  Users,
  Star,
  ArrowLeft,
  ArrowRight,
  Check,
  Flame,
  Ticket,
  Bike,
  Sparkles,
  BedDouble,
} from 'lucide-react'
import type { TripCombo, PerkCategory } from '@/types'
import { pickLocale } from '@/types'
import { GlassNavbar } from '@/components/luxury/glass-navbar'
import { SiteFooter } from '@/components/home/site-footer'
import { Container } from '@/components/luxury/container'
import { Body, Eyebrow } from '@/components/luxury/typography'
import { luxuryButtonVariants } from '@/components/luxury/luxury-button'
import { StateWrapper, type ViewState } from '@/components/ui/state-wrapper'
import { getCombo } from '@/services/comboService'
import { buildComboLink, buildBuilderLink } from '@/components/combo/combo-builder-core'
import { useLocale } from '@/lib/i18n/provider'
import { cn } from '@/lib/utils'

/** Map perks của combo → Record<perkId, qty> để dựng link đặt/tùy chỉnh. */
const comboPerkMap = (combo: TripCombo): Record<string, number> =>
  Object.fromEntries(combo.perks.map(({ perk, qty }) => [perk.id, qty]))

const PERK_ICON: Record<PerkCategory, typeof Flame> = {
  bbq: Flame,
  lake_ticket: Ticket,
  vehicle: Bike,
  other: Sparkles,
}

export function ComboDetailClient({ id }: { id: string }) {
  const { locale, t, formatCurrency } = useLocale()
  const [combo, setCombo] = useState<TripCombo | null>(null)
  const [state, setState] = useState<ViewState>('loading')

  useEffect(() => {
    let active = true
    setState('loading')
    getCombo(id)
      .then((c) => {
        if (!active) return
        setCombo(c)
        setState('success')
      })
      .catch(() => active && setState('error'))
    return () => {
      active = false
    }
  }, [id])

  const stayVnd = combo ? combo.property.priceVnd * combo.nights : 0

  return (
    <div className="min-h-screen bg-background">
      <GlassNavbar solid />
      <main id="main-content" className="pt-[72px] md:pt-[88px]">
        <StateWrapper state={state} className="py-24">
          {combo && (
            <>
              {/* Hero */}
              <section className="relative h-[52vh] min-h-[380px] w-full overflow-hidden">
                <Image
                  src={combo.themeImage}
                  alt={pickLocale(combo.title, locale)}
                  fill
                  priority
                  sizes="100vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/25" aria-hidden="true" />
                <Container className="relative flex h-full flex-col justify-end pb-10">
                  <Link
                    href="/#combo"
                    className="mb-auto mt-6 inline-flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1.5 font-sans text-[0.8125rem] font-medium text-white backdrop-blur-md ring-1 ring-white/25 transition hover:bg-white/25"
                  >
                    <ArrowLeft className="size-4" /> {t('combos.eyebrow')}
                  </Link>
                  <div className="flex flex-wrap gap-1.5">
                    {combo.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-white/20 px-2.5 py-1 font-sans text-[0.6875rem] font-semibold text-white backdrop-blur-md ring-1 ring-white/25"
                      >
                        {pickLocale(tag, locale)}
                      </span>
                    ))}
                  </div>
                  <h1 className="mt-3 max-w-3xl font-display text-[2.25rem] font-semibold leading-tight text-white drop-shadow-[0_2px_20px_rgba(0,0,0,0.5)] md:text-[3rem]">
                    {pickLocale(combo.title, locale)}
                  </h1>
                  <div className="mt-3 flex flex-wrap items-center gap-4 font-sans text-[0.9rem] font-medium text-white/90">
                    <span className="inline-flex items-center gap-1.5">
                      <Moon className="size-4" /> {t('combos.nights', { n: combo.nights })}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="size-4" /> {t('combos.guestsUpto', { n: combo.guests })}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Star className="size-4 fill-amber-400 text-amber-400" /> {combo.ratingAvg.toFixed(1)}
                      {combo.reviewCount > 0 && ` · ${t('combos.reviews', { n: combo.reviewCount })}`}
                    </span>
                  </div>
                </Container>
              </section>

              {/* Nội dung */}
              <Container className="grid grid-cols-1 gap-10 py-12 lg:grid-cols-[1fr_380px]">
                {/* Trái: những gì có trong combo */}
                <div>
                  <Eyebrow>{t('combos.whatsInside')}</Eyebrow>
                  <Body className="mt-4 max-w-2xl">{pickLocale(combo.subtitle, locale)}</Body>

                  {/* Chỗ ở */}
                  <h2 className="mt-10 font-sans text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {t('combos.stay')}
                  </h2>
                  <Link
                    href={`/property/${combo.property.id}`}
                    className="group mt-3 flex gap-4 rounded-2xl border border-border bg-card p-3 transition hover:shadow-luxury"
                  >
                    <div className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-secondary">
                      {combo.property.images[0] && (
                        <Image src={combo.property.images[0]} alt="" fill sizes="96px" className="object-cover" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="inline-flex items-center gap-1.5 font-sans text-[0.9rem] font-semibold text-foreground">
                        <BedDouble className="size-4 text-brand" />
                        {pickLocale(combo.property.title, locale)}
                      </div>
                      <p className="mt-1 font-sans text-[0.8125rem] text-muted-foreground">
                        {combo.property.bedrooms} PN · {combo.property.bathrooms} WC · {combo.property.areaM2}m²
                      </p>
                      <p className="mt-1 font-sans text-[0.8125rem] text-muted-foreground">
                        {t('combos.stayNight', { n: combo.nights })} · {formatCurrency(stayVnd)}
                      </p>
                    </div>
                    <ArrowRight className="size-4 shrink-0 self-center text-muted-foreground transition group-hover:translate-x-0.5" />
                  </Link>

                  {/* Trải nghiệm */}
                  <h2 className="mt-8 font-sans text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {t('combos.experiences')}
                  </h2>
                  <ul className="mt-3 divide-y divide-border rounded-2xl border border-border bg-card">
                    {combo.perks.map(({ perk, qty }) => {
                      const Icon = PERK_ICON[perk.category]
                      return (
                        <li key={perk.id} className="flex items-center gap-3 p-3.5">
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
                            <Icon className="size-5" />
                          </span>
                          <span className="min-w-0 flex-1 font-sans text-[0.9rem] font-medium text-foreground">
                            {pickLocale(perk.name, locale)}
                            {qty > 1 && <span className="text-muted-foreground"> × {qty}</span>}
                          </span>
                          <span className="shrink-0 font-sans text-[0.8125rem] text-muted-foreground">
                            {formatCurrency(perk.priceVnd * qty)}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                </div>

                {/* Phải: panel giá (sticky) */}
                <aside className="lg:sticky lg:top-28 lg:h-fit">
                  <div className="rounded-3xl border border-border bg-card p-6 shadow-luxury">
                    <div className="flex items-center justify-between">
                      <span className="font-sans text-[0.8125rem] text-muted-foreground">{t('combos.listPrice')}</span>
                      <span className="font-sans text-[0.9rem] text-muted-foreground line-through">
                        {formatCurrency(combo.listPriceVnd)}
                      </span>
                    </div>
                    <div className="mt-2 flex items-end justify-between gap-2">
                      <span className="font-display text-[2rem] font-bold leading-none text-foreground">
                        {formatCurrency(combo.packagePriceVnd)}
                      </span>
                      <span className="font-sans text-[0.8125rem] text-muted-foreground">{t('combos.package')}</span>
                    </div>
                    <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1.5 font-sans text-[0.8125rem] font-bold text-brand">
                      <Check className="size-4" />
                      {t('combos.save', { pct: combo.savingsPct })} · {formatCurrency(combo.savingsVnd)}
                    </div>

                    {/* Đặt combo: mang trải nghiệm sang trang đặt (trước đây trỏ trơn
                        /property/[id] nên booking mất combo). Số đêm do khách chọn trên lịch. */}
                    <Link
                      href={buildComboLink(combo.property.id, comboPerkMap(combo))}
                      className={cn(luxuryButtonVariants({ variant: 'primary', size: 'lg' }), 'mt-6 w-full justify-center')}
                    >
                      {t('combos.bookCombo')}
                      <ArrowRight className="size-4" />
                    </Link>

                    {/* Lối vào builder từ combo MẪU (C3): mở sẵn combo này để khách tùy chỉnh. */}
                    <Link
                      href={buildBuilderLink(
                        combo.property.id,
                        combo.nights,
                        combo.guests,
                        comboPerkMap(combo),
                      )}
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-border bg-background px-5 py-3 font-sans text-[0.9rem] font-semibold text-foreground transition hover:bg-secondary"
                    >
                      <Sparkles className="size-4" />
                      {t('combos.customize')}
                    </Link>

                    <ul className="mt-5 space-y-2">
                      {[t('combos.stayNight', { n: combo.nights }), ...combo.perks.map((p) => pickLocale(p.perk.name, locale))].map(
                        (label, i) => (
                          <li key={i} className="flex items-center gap-2 font-sans text-[0.8125rem] text-muted-foreground">
                            <Check className="size-4 shrink-0 text-brand" />
                            {label}
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                </aside>
              </Container>
            </>
          )}
        </StateWrapper>
      </main>
      <SiteFooter />
    </div>
  )
}
