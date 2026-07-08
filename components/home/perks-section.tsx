'use client'

import { useEffect, useState } from 'react'
import { Check, X, Flame, Ticket, Bike, Sparkles, Plus } from 'lucide-react'
import type { PerkCategory, Perk } from '@/types'
import { pickLocale } from '@/types'
import { Section } from '@/components/luxury/section'
import { H2, H3, Body, Eyebrow, Caption } from '@/components/luxury/typography'
import { Reveal } from '@/components/luxury/reveal'
import { LuxuryButton } from '@/components/luxury/luxury-button'
import { getPerks } from '@/services/perkService'
import { useLocale } from '@/lib/i18n/provider'
import { cn } from '@/lib/utils'

const PERK_ICON: Record<PerkCategory, typeof Flame> = {
  bbq: Flame,
  lake_ticket: Ticket,
  vehicle: Bike,
  other: Sparkles,
}

type Provider = {
  id: string
  name: string
  nightly: number
  fee: number
  perks: boolean
  supportKey: string
  recommended?: boolean
}

const PROVIDERS: Provider[] = [
  { id: 'op', name: 'HOMIX', nightly: 1_450_000, fee: 0, perks: true, supportKey: 'perks.support247', recommended: true },
  { id: 'airbnb', name: 'Airbnb', nightly: 1_450_000, fee: 203_000, perks: false, supportKey: 'perks.supportRemote' },
  { id: 'agoda', name: 'Agoda', nightly: 1_520_000, fee: 182_000, perks: false, supportKey: 'perks.supportRemote' },
]

export function PerksSection() {
  const { locale, t, formatCurrency } = useLocale()
  const [perks, setPerks] = useState<Perk[]>([])

  useEffect(() => {
    let active = true
    getPerks()
      .then((data) => {
        if (active) setPerks(data)
      })
      .catch(() => {
        if (active) setPerks([])
      })
    return () => {
      active = false
    }
  }, [])

  const opTotal = PROVIDERS[0].nightly + PROVIDERS[0].fee
  const maxOtaTotal = Math.max(...PROVIDERS.slice(1).map((p) => p.nightly + p.fee))
  const save = maxOtaTotal - opTotal

  return (
    <Section className="bg-secondary/40">
      <Reveal className="mx-auto max-w-2xl text-center">
        <Eyebrow>{t('perks.eyebrow')}</Eyebrow>
        <H2 className="mt-4">{t('perks.title')}</H2>
        <Body className="mx-auto mt-5">{t('perks.subtitle')}</Body>
      </Reveal>

      {/* Bảng so sánh giá */}
      <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3">
        {PROVIDERS.map((p, i) => {
          const total = p.nightly + p.fee
          return (
            <Reveal key={p.id} delay={i * 90}>
              <div
                className={cn(
                  'flex h-full flex-col rounded-2xl border bg-card p-7',
                  p.recommended
                    ? 'border-primary shadow-luxury-lg ring-1 ring-primary/20'
                    : 'border-border',
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-sans text-[1.125rem] font-semibold tracking-[-0.01em] text-foreground">
                    {p.name}
                  </span>
                  {p.recommended ? (
                    <span className="rounded-full bg-primary px-3 py-1 font-sans text-[0.6875rem] font-medium uppercase tracking-[0.1em] text-primary-foreground">
                      {t('perks.recommended')}
                    </span>
                  ) : null}
                </div>

                <div className="mt-5">
                  <span className="font-sans text-[2rem] font-bold tracking-[-0.03em] text-foreground">
                    {formatCurrency(total)}
                  </span>
                  <span className="ml-1 font-sans text-[0.9375rem] text-muted-foreground">
                    {t('common.perNight')}
                  </span>
                </div>

                {p.recommended && save > 0 ? (
                  <span className="mt-3 inline-flex w-fit rounded-full bg-primary/10 px-3 py-1 font-sans text-[0.8125rem] font-medium text-primary">
                    {t('perks.save', { amount: formatCurrency(save) })}
                  </span>
                ) : (
                  <span className="mt-3 h-[1.75rem]" aria-hidden="true" />
                )}

                <ul className="mt-6 flex flex-col gap-3 border-t border-border pt-6">
                  <Row label={t('perks.rowServiceFee')} ok={p.fee === 0}>
                    {p.fee === 0 ? t('perks.feeFree') : `+ ${formatCurrency(p.fee)}`}
                  </Row>
                  <Row label={t('perks.rowPerks')} ok={p.perks}>
                    {p.perks ? t('perks.included') : t('perks.notIncluded')}
                  </Row>
                  <Row label={t('perks.rowSupport')} ok={p.id === 'op'}>
                    {t(p.supportKey)}
                  </Row>
                </ul>

                {p.recommended ? (
                  <LuxuryButton variant="primary" size="md" className="mt-7 w-full">
                    {t('perks.cta')}
                  </LuxuryButton>
                ) : (
                  <div className="mt-7 h-11" aria-hidden="true" />
                )}
              </div>
            </Reveal>
          )
        })}
      </div>

      {/* Combo nội khu */}
      <Reveal className="mt-20">
        <H3>{t('perks.comboTitle')}</H3>
        <Body className="mt-3 max-w-xl">{t('perks.comboSubtitle')}</Body>
      </Reveal>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {perks.map((perk, i) => {
          const Icon = PERK_ICON[perk.category]
          return (
            <Reveal key={perk.id} delay={(i % 3) * 80}>
              <div className="flex h-full items-center gap-4 rounded-xl border border-border bg-card p-5">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-sans text-[1rem] font-semibold text-foreground">
                    {pickLocale(perk.name, locale)}
                  </p>
                  <p className="mt-0.5 font-sans text-[0.875rem] text-muted-foreground">
                    {formatCurrency(perk.priceVnd)}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={t('perks.addCombo')}
                  className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  <Plus className="size-4" aria-hidden="true" />
                </button>
              </div>
            </Reveal>
          )
        })}
      </div>
    </Section>
  )
}

function Row({
  label,
  ok,
  children,
}: {
  label: string
  ok: boolean
  children: React.ReactNode
}) {
  return (
    <li className="flex items-center justify-between gap-3">
      <span className="inline-flex items-center gap-2 font-sans text-[0.9375rem] text-muted-foreground">
        {ok ? (
          <Check className="size-4 text-primary" aria-hidden="true" />
        ) : (
          <X className="size-4 text-muted-foreground/60" aria-hidden="true" />
        )}
        {label}
      </span>
      <span
        className={cn(
          'text-right font-sans text-[0.9375rem] font-medium',
          ok ? 'text-foreground' : 'text-muted-foreground',
        )}
      >
        {children}
      </span>
    </li>
  )
}
