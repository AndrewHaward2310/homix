'use client'

import { useEffect, useState } from 'react'
import type { TripCombo } from '@/types'
import { GlassNavbar } from '@/components/luxury/glass-navbar'
import { SiteFooter } from '@/components/home/site-footer'
import { Container } from '@/components/luxury/container'
import { H1, Body, Eyebrow } from '@/components/luxury/typography'
import { Reveal } from '@/components/luxury/reveal'
import { StateWrapper, type ViewState } from '@/components/ui/state-wrapper'
import { ComboCard } from '@/components/combo/combo-card'
import { getCombos } from '@/services/comboService'
import { useT } from '@/lib/i18n/provider'

/** Trang danh sách tất cả combo chuyến đi (public). */
export function ComboIndexClient() {
  const t = useT()
  const [combos, setCombos] = useState<TripCombo[]>([])
  const [state, setState] = useState<ViewState>('loading')

  useEffect(() => {
    let active = true
    getCombos()
      .then((data) => {
        if (!active) return
        setCombos(data)
        setState(data.length ? 'success' : 'empty')
      })
      .catch(() => active && setState('error'))
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <GlassNavbar solid />
      <main className="pt-[72px] md:pt-[88px]">
        <Container className="py-12 md:py-16">
          <Reveal className="max-w-2xl">
            <Eyebrow>{t('combos.eyebrow')}</Eyebrow>
            <H1 className="mt-4 font-serif">{t('combos.allTitle')}</H1>
            <Body className="mt-5">{t('combos.allSubtitle')}</Body>
          </Reveal>

          <StateWrapper state={state} className="mt-12" emptyTitle={t('combos.empty')}>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {combos.map((combo, i) => (
                <Reveal key={combo.id} delay={(i % 3) * 90}>
                  <ComboCard combo={combo} priority={i < 3} />
                </Reveal>
              ))}
            </div>
          </StateWrapper>
        </Container>
      </main>
      <SiteFooter />
    </div>
  )
}
