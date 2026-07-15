'use client'

import Image from 'next/image'
import { Container } from '@/components/luxury/container'
import { Eyebrow, Display } from '@/components/luxury/typography'
import { Reveal } from '@/components/luxury/reveal'
import { useT } from '@/lib/i18n/provider'
import { SearchBar } from './search-bar'

/**
 * HeroSection — full-viewport, ảnh lifestyle tràn viền (Ken Burns) + overlay.
 * Nội dung canh GIỮA: một dòng định vị ngắn gọn (không gây rối) + thanh tìm kiếm
 * lớn làm trung tâm. Navbar overlay đè lên trên.
 */
export function HeroSection() {
  const t = useT()

  return (
    <section
      id="tong-quan"
      className="relative flex min-h-screen items-center justify-center overflow-hidden"
    >
      {/* Ảnh nền tràn viền + Ken Burns */}
      <div className="absolute inset-0 overflow-hidden">
        <Image
          src="/images/hero-lakeside.png"
          alt="Toàn cảnh khu đô thị HOMIX bên hồ lúc hoàng hôn"
          fill
          priority
          sizes="100vw"
          className="animate-kenburns object-cover"
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/30 to-black/60"
          aria-hidden="true"
        />
      </div>

      {/* Nội dung canh giữa */}
      <Container className="relative z-10 flex flex-col items-center pb-16 pt-28 text-center md:pt-32">
        <Reveal className="flex flex-col items-center">
          <Eyebrow className="text-white/85">{t('hero.eyebrow')}</Eyebrow>
          <Display className="mt-5 max-w-4xl text-balance font-display font-medium tracking-[-0.015em] text-white drop-shadow-[0_2px_30px_rgba(0,0,0,0.5)]">
            {t('hero.pitch')}
          </Display>
        </Reveal>

        {/* Thanh tìm kiếm — trung tâm, lớn */}
        <Reveal delay={120} className="mt-10 w-full md:mt-12">
          <SearchBar />
        </Reveal>
      </Container>
    </section>
  )
}
