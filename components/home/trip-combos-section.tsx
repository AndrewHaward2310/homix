'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Wand2 } from 'lucide-react'
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
          <H2 className="mt-4 font-display">{t('combos.title')}</H2>
          <Body className="mt-5">{t('combos.subtitle')}</Body>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 self-start md:self-auto">
          <Link
            href="/combo/tu-thiet-ke"
            className={cn(luxuryButtonVariants({ variant: 'primary', size: 'md' }))}
          >
            <Wand2 className="size-4" />
            {t('builder.cta')}
          </Link>
          <Link href="/combo" className={cn(luxuryButtonVariants({ variant: 'outline', size: 'md' }))}>
            {t('combos.viewAll')}
            <ArrowRight className="transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </Reveal>

      {/* Mobile: dải CUỘN NGANG có snap (tràn mép để lộ thẻ kế → mời vuốt).
          md+: quay lại lưới như cũ. */}
      <div
        role="region"
        aria-label={t('combos.title')}
        tabIndex={0}
        className={cn(
          // Âm lề phải KHỚP gutter của Container (px-5 → sm:px-8), nếu không sẽ
          // lố vài px và làm cả trang tràn ngang.
          'mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto',
          '-mx-5 px-5 sm:-mx-8 sm:px-8',
          // scroll-padding: để thẻ snap xong vẫn giữ gutter, không dính sát mép.
          'scroll-pl-5 sm:scroll-pl-8 md:scroll-pl-0',
          // py (không phải pb): overflow-x cũng cắt theo trục Y → chừa chỗ cho
          // bóng đổ và hover nâng của thẻ.
          'py-3',
          '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          'md:mx-0 md:grid md:grid-cols-2 md:gap-6 md:overflow-visible md:px-0 md:py-0 lg:grid-cols-3',
        )}
      >
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="skeleton aspect-[4/5] w-[80%] shrink-0 snap-start rounded-3xl sm:w-[58%] md:w-auto md:shrink"
              />
            ))
          : combos.map((combo, i) => (
              <Reveal
                key={combo.id}
                delay={(i % 3) * 90}
                // threshold 0: trong dải cuộn ngang thẻ kế chỉ ló ~12% ở mép,
                // không bao giờ đạt ngưỡng 0.15 → sẽ mãi vô hình.
                threshold={0}
                className="w-[80%] shrink-0 snap-start sm:w-[58%] md:w-auto md:shrink"
              >
                <ComboCard combo={combo} priority={i === 0} />
              </Reveal>
            ))}
      </div>

      {/* Gợi ý vuốt — chỉ hiện ở mobile, nơi dải cuộn ngang thực sự tồn tại */}
      <p className="mt-3 font-sans text-[0.75rem] text-muted-foreground md:hidden">
        {t('combos.swipeHint')}
      </p>
    </Section>
  )
}
