'use client'

import Image from 'next/image'
import { Container } from '@/components/luxury/container'
import { SearchBar } from './search-bar'

/**
 * HeroSection — full-viewport, ảnh lifestyle tràn viền (Ken Burns) + overlay,
 * thanh tìm kiếm glassmorphism nổi. Navbar overlay đè lên trên.
 */
export function HeroSection() {
  return (
    <section id="tong-quan" className="relative flex min-h-screen items-end overflow-hidden">
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
          className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/20"
          aria-hidden="true"
        />
      </div>

      {/* Thanh tìm kiếm */}
      <Container className="relative z-10 pb-16 pt-32 md:pb-24">
        <SearchBar />
      </Container>
    </section>
  )
}
