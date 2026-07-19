'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Maximize, ArrowUpRight } from 'lucide-react'
import type { Property } from '@/types'
import { pickLocale } from '@/types'
import type { HeroStats } from '@/lib/server/home'
import { Container } from '@/components/luxury/container'
import { Eyebrow, Display, Body } from '@/components/luxury/typography'
import { Reveal } from '@/components/luxury/reveal'
import { useLocale } from '@/lib/i18n/provider'
import { getIntlLocale } from '@/lib/i18n/config'
import { formatCompactPrice, priceSuffixKey } from '@/lib/property-format'
import { SearchBar } from './search-bar'

type Props = {
  /** Căn nổi bật + số liệu lấy ở SERVER (app/page.tsx) → ảnh vào HTML đầu, không CLS. */
  featured: Property | null
  stats: HeroStats
}

/**
 * HeroSection — bố cục "editorial split" trên nền SÁNG (sang, không giống template):
 * TRÁI: định vị + tìm kiếm + số liệu tin cậy. PHẢI: ảnh căn nổi bật sạch + thẻ giá nổi.
 * Navbar dùng biến thể `solid` (chữ tối) vì nền hero giờ sáng.
 */
export function HeroSection({ featured, stats }: Props) {
  const { locale, t } = useLocale()
  const nf = (n: number) => new Intl.NumberFormat(getIntlLocale(locale)).format(n)
  const suffixKey = featured ? priceSuffixKey(featured.type) : null

  const metrics = [
    { v: `${nf(stats.properties)}+`, l: t('trust.properties') },
    { v: nf(stats.towers), l: t('trust.towers') },
    { v: nf(stats.hosts), l: t('trust.hosts') },
  ]

  return (
    <section id="tong-quan" className="relative overflow-hidden bg-background pt-[72px] md:pt-[88px]">
      {/* Trang trí mềm — quầng sáng brand góc phải, tạo chiều sâu nhẹ */}
      <div
        className="pointer-events-none absolute -right-40 -top-24 size-[36rem] rounded-full bg-brand/10 blur-3xl"
        aria-hidden="true"
      />

      <Container className="relative grid items-center gap-10 py-12 md:py-16 lg:grid-cols-[1.05fr_.95fr] lg:gap-16">
        {/* TRÁI — nội dung */}
        <div className="max-w-xl">
          <Reveal>
            <Eyebrow>{t('hero.eyebrow')}</Eyebrow>
            {/* Thu nhỏ thang chữ so với Display mặc định vì đứng trong cột hẹp */}
            <Display className="mt-4 font-display text-[2.5rem] font-semibold tracking-[-0.02em] text-foreground sm:text-5xl md:text-5xl lg:text-[3.5rem]">
              {t('hero.pitch')}
            </Display>
            <Body className="mt-5 max-w-md">{t('hero.subtitle')}</Body>
          </Reveal>

          <Reveal delay={120} className="mt-8">
            <SearchBar onLight align="left" compact />
          </Reveal>

          {/* Số liệu tin cậy (server-rendered → không nhảy layout) */}
          <Reveal delay={200}>
            <div className="mt-7 flex flex-wrap items-center gap-x-8 gap-y-3">
              {metrics.map((s) => (
                <div key={s.l}>
                  <div className="font-display text-[1.5rem] font-bold leading-none tracking-[-0.02em] text-foreground tabular-nums">
                    {s.v}
                  </div>
                  <div className="mt-1 font-sans text-[0.8125rem] text-muted-foreground">{s.l}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        {/* PHẢI — ảnh căn nổi bật + thẻ giá nổi */}
        <Reveal delay={120} className="relative">
          <div className="relative aspect-[4/4.4] w-full overflow-hidden rounded-[1.75rem] bg-secondary shadow-luxury-lg ring-1 ring-black/5">
            {featured?.images[0] && (
              <Image
                src={featured.images[0]}
                alt={pickLocale(featured.title, locale)}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 45vw"
                className="object-cover"
              />
            )}
          </div>

          {featured && (
            <Link
              href={`/property/${featured.id}`}
              className="group absolute -bottom-5 left-4 flex items-center gap-3 rounded-2xl border border-border bg-background/95 p-3 pr-4 shadow-luxury-lg backdrop-blur-sm transition hover:-translate-y-0.5 sm:-left-6"
            >
              <div className="min-w-0">
                <div className="font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  {t(`ptype.${featured.type}`)}
                </div>
                {/* Tiêu đề xuống 2 dòng cho đủ chữ (không cắt "...") */}
                <div className="mt-0.5 line-clamp-2 max-w-[15rem] font-sans text-[0.9rem] font-semibold leading-snug text-foreground">
                  {pickLocale(featured.title, locale)}
                </div>
                <div className="mt-1.5 flex items-center gap-3 font-sans text-[0.8125rem] font-medium text-foreground">
                  <span className="font-bold text-brand">
                    {formatCompactPrice(featured.priceVnd, locale)}
                    {suffixKey && <span className="font-normal">{t(suffixKey)}</span>}
                  </span>
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <Maximize className="size-3.5" /> {featured.areaM2}m²
                  </span>
                </div>
              </div>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition group-hover:brightness-110">
                <ArrowUpRight className="size-4" />
              </span>
            </Link>
          )}
        </Reveal>
      </Container>
    </section>
  )
}
