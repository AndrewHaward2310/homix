'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { Container } from '@/components/luxury/container'
import { H2, Body, Eyebrow } from '@/components/luxury/typography'
import { Reveal } from '@/components/luxury/reveal'
import { BrandLoaderInline } from '@/components/luxury/brand-loader'
import { useT } from '@/lib/i18n/provider'

// Bản đồ kéo theo maplibre-gl (nặng). Section này nằm dưới màn đầu → CHỈ nạp chunk
// + khởi tạo WebGL khi người dùng cuộn tới gần (IntersectionObserver), giúp trang chủ
// nhẹ hơn lúc tải đầu (LCP/TTI). Placeholder cùng chiều cao để không nhảy layout (CLS).
const MasterplanLocator = dynamic(
  () => import('./masterplan/masterplan-locator').then((m) => m.MasterplanLocator),
  { ssr: false },
)

/**
 * Section "Vị trí" — header ngữ cảnh, rồi bản đồ tương tác full-bleed (nạp lười).
 */
export function BuildingLocatorSection() {
  const t = useT()
  const ref = useRef<HTMLDivElement>(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (show) return
    const el = ref.current
    if (!el) return
    // rootMargin 400px: bắt đầu nạp bản đồ TRƯỚC khi vào khung nhìn để đỡ chờ.
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShow(true)
          io.disconnect()
        }
      },
      { rootMargin: '400px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [show])

  return (
    <section id="vi-tri" className="scroll-mt-20 bg-secondary/40 py-16 md:py-24">
      <Container>
        <Reveal className="max-w-2xl">
          <Eyebrow>{t('locator.eyebrow')}</Eyebrow>
          <H2 className="mt-4">{t('locator.title')}</H2>
          <Body className="mt-5">{t('locator.subtitle')}</Body>
        </Reveal>
      </Container>

      <div ref={ref} className="mt-10">
        {show ? (
          <MasterplanLocator />
        ) : (
          <div
            className="relative grid h-[70vh] min-h-[420px] w-full place-items-center bg-secondary md:h-[88vh]"
            aria-hidden="true"
          >
            <BrandLoaderInline />
          </div>
        )}
      </div>
    </section>
  )
}
