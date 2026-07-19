'use client'

import { Container } from '@/components/luxury/container'
import { H2, Body, Eyebrow } from '@/components/luxury/typography'
import { Reveal } from '@/components/luxury/reveal'
import { useT } from '@/lib/i18n/provider'
import { MasterplanLocator } from './masterplan/masterplan-locator'

/**
 * Section "Vị trí" — có header ngữ cảnh, rồi tới bản đồ tương tác full-bleed.
 */
export function BuildingLocatorSection() {
  const t = useT()
  return (
    <section id="vi-tri" className="scroll-mt-20 bg-secondary/40 py-16 md:py-24">
      <Container>
        <Reveal className="max-w-2xl">
          <Eyebrow>{t('locator.eyebrow')}</Eyebrow>
          <H2 className="mt-4">{t('locator.title')}</H2>
          <Body className="mt-5">{t('locator.subtitle')}</Body>
        </Reveal>
      </Container>

      <div className="mt-10">
        <MasterplanLocator />
      </div>
    </section>
  )
}
