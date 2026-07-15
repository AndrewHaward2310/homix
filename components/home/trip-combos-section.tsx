'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { TripCombo } from '@/types'
import { Section } from '@/components/luxury/section'
import { H2, Body, Eyebrow } from '@/components/luxury/typography'
import { Reveal } from '@/components/luxury/reveal'
import { luxuryButtonVariants } from '@/components/luxury/luxury-button'
import { ComboCard } from '@/components/combo/combo-card'
import { getCombos } from '@/services/comboService'
import { useT } from '@/lib/i18n/provider'
import { cn } from '@/lib/utils'

/**
 * TripCombosSection — dải "Combo chuyến đi": gói lưu trú + trải nghiệm ưu đãi.
 * Public, hiển thị trên trang chủ. Dữ liệu từ /api/combos.
 */
export function TripCombosSection() {
  const t = useT()
  const [combos, setCombos] = useState<TripCombo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    getCombos()
      .then((data) => active && setCombos(data))
      .catch(() => active && setCombos([]))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  if (!loading && combos.length === 0) return null

  return (
    <Section id="combo" className="scroll-mt-20 bg-secondary/40">
      <Reveal className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="max-w-2xl">
          <Eyebrow>{t('combos.eyebrow')}</Eyebrow>
          <H2 className="mt-4 font-serif">{t('combos.title')}</H2>
          <Body className="mt-5">{t('combos.subtitle')}</Body>
        </div>
        <Link
          href="/combo"
          className={cn(luxuryButtonVariants({ variant: 'outline', size: 'md' }), 'shrink-0 self-start md:self-auto')}
        >
          {t('combos.viewAll')}
          <ArrowRight className="transition-transform duration-300 group-hover:translate-x-0.5" />
        </Link>
      </Reveal>

      <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton aspect-[4/5] rounded-3xl" />
            ))
          : combos.map((combo, i) => (
              <Reveal key={combo.id} delay={(i % 3) * 90}>
                <ComboCard combo={combo} priority={i === 0} />
              </Reveal>
            ))}
      </div>
    </Section>
  )
}
