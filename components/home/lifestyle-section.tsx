'use client'

import Image from 'next/image'
import { Section } from '@/components/luxury/section'
import { H2, H3, Body, Eyebrow, Caption } from '@/components/luxury/typography'
import { Reveal } from '@/components/luxury/reveal'
import { useT } from '@/lib/i18n/provider'
import { cn } from '@/lib/utils'

const ITEMS = [
  { key: 'item1', image: '/images/apt-living-1.png' },
  { key: 'item2', image: '/images/life-dining.png' },
  { key: 'item3', image: '/images/life-beach.png' },
]

export function LifestyleSection() {
  const t = useT()

  return (
    <Section id="tien-ich" className="scroll-mt-20">
      <Reveal className="mx-auto max-w-2xl text-center">
        <Eyebrow>{t('lifestyle.eyebrow')}</Eyebrow>
        <H2 className="mt-4">{t('lifestyle.title')}</H2>
        <Body className="mx-auto mt-5">{t('lifestyle.subtitle')}</Body>
      </Reveal>

      <div className="mt-16 flex flex-col gap-20 md:gap-28">
        {ITEMS.map((item, i) => {
          const imageRight = i % 2 === 1
          return (
            <div
              key={item.key}
              className="grid grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-14"
            >
              <Reveal
                className={cn(
                  'relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-secondary',
                  imageRight && 'md:order-2',
                )}
              >
                <Image
                  src={item.image}
                  alt={t(`lifestyle.${item.key}.title`)}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
              </Reveal>

              <Reveal delay={120} className={cn(imageRight && 'md:order-1')}>
                <Caption className="font-medium uppercase tracking-[0.14em] text-brand">
                  {t(`lifestyle.${item.key}.tag`)}
                </Caption>
                <H3 className="mt-3 text-balance md:text-[1.75rem]">
                  {t(`lifestyle.${item.key}.title`)}
                </H3>
                <Body className="mt-4 max-w-md">{t(`lifestyle.${item.key}.desc`)}</Body>
              </Reveal>
            </div>
          )
        })}
      </div>
    </Section>
  )
}
