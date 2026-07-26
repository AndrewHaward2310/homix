'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import {
  Heart,
  Share2,
  MapPin,
  Bed,
  Bath,
  Maximize,
  BadgeCheck,
  Star,
  Clock,
  ShieldCheck,
  CalendarCheck,
  Eye,
  Flame,
  ChevronRight,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { AvailabilityRange, Property, Review, Tower } from '@/types'
import { pickLocale } from '@/types'
import {
  getProperty,
  getReviews,
  getAvailability,
  getSimilar,
  getTowers,
  recordView,
} from '@/services/propertyService'
import { useLocale } from '@/lib/i18n/provider'
import { useFavorites } from '@/hooks/use-favorites'
import { useRecordView } from '@/hooks/use-recently-viewed'
import { RecentlyViewed } from '@/components/property/recently-viewed'
import { AmenitiesGrid } from '@/components/property/amenities-grid'
import { GlassNavbar } from '@/components/luxury/glass-navbar'

const PropertyLocation = dynamic(
  () => import('@/components/property/property-location').then((m) => m.PropertyLocation),
  { ssr: false, loading: () => <div className="h-72 animate-pulse rounded-2xl bg-secondary" /> },
)
import { SiteFooter } from '@/components/home/site-footer'
import { Container } from '@/components/luxury/container'
import { StateWrapper, type ViewState } from '@/components/ui/state-wrapper'
import { Gallery } from '@/components/property/gallery'
import { BookingCard } from '@/components/property/booking-card'
import { PropertyCard } from '@/components/property/property-card'
import { ReviewForm } from '@/components/property/review-form'
import { ReviewsSection } from '@/components/property/reviews-section'
import { cn } from '@/lib/utils'

export function PropertyDetailClient({ id }: { id: string }) {
  const { locale, t, formatCurrency } = useLocale()
  const { isFavorite, toggle } = useFavorites()

  const [state, setState] = useState<ViewState>('loading')
  const [property, setProperty] = useState<Property | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [blocked, setBlocked] = useState<AvailabilityRange[]>([])
  const [similar, setSimilar] = useState<Property[]>([])
  const [towers, setTowers] = useState<Record<string, string>>({})
  const [activeSection, setActiveSection] = useState('overview')

  useEffect(() => {
    let active = true
    setState('loading')
    getProperty(id)
      .then(async (p) => {
        if (!active) return
        setProperty(p)
        setState('success')
        const [rv, av, sim, tw] = await Promise.all([
          getReviews(id).catch(() => []),
          getAvailability(id).catch(() => []),
          getSimilar(p).catch(() => []),
          getTowers().catch(() => [] as Tower[]),
        ])
        if (!active) return
        setReviews(rv)
        setBlocked(av)
        setSimilar(sim)
        setTowers(Object.fromEntries(tw.map((x) => [x.id, x.name])))
      })
      .catch(() => active && setState('error'))
    return () => {
      active = false
    }
  }, [id])

  useRecordView(property?.id)

  // Ghi nhận lượt xem phía server (throttle theo IP) — 1 lần / lần mở trang.
  useEffect(() => {
    recordView(id)
  }, [id])

  // Scroll-spy: tự sáng mục trong thanh điều hướng theo phần đang xem.
  useEffect(() => {
    if (state !== 'success') return
    const ids = ['overview', 'amenities', 'location', 'reviews']
    const els = ids.map((s) => document.getElementById(s)).filter(Boolean) as HTMLElement[]
    if (!els.length) return
    // Active = mục CUỐI CÙNG có mép trên đã vượt qua đường ~120px dưới nav.
    // Tính lại toàn bộ mỗi lần observer bắn để chọn dứt khoát (không lệ thuộc thứ tự entry).
    const LINE = 120
    const compute = () => {
      let cur = ids[0]
      for (const s of ids) {
        const el = document.getElementById(s)
        if (el && el.getBoundingClientRect().top - LINE <= 1) cur = s
      }
      setActiveSection(cur)
    }
    const obs = new IntersectionObserver(compute, { rootMargin: `-${LINE}px 0px -80% 0px`, threshold: 0 })
    els.forEach((el) => obs.observe(el))
    compute()
    return () => obs.disconnect()
  }, [state])

  const fav = property ? isFavorite(property.id) : false
  const towerName = property ? towers[property.towerId] : undefined

  return (
    <div className="min-h-screen bg-background">
      <GlassNavbar solid />
      <StateWrapper state={state} className="pt-[72px]" errorTitle="Không tải được căn hộ">
        {property && (
          <main id="main-content" className="pb-28 md:pb-16">
            <Container className="pt-6">
              {/* Breadcrumb — điều hướng + SEO */}
              <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 font-sans text-[0.8125rem] text-muted-foreground">
                <Link href="/" className="transition-colors hover:text-foreground">{t('nav.home')}</Link>
                <ChevronRight className="size-3.5 shrink-0 opacity-60" aria-hidden="true" />
                <Link href="/search" className="transition-colors hover:text-foreground">{t('nav.explore')}</Link>
                <ChevronRight className="size-3.5 shrink-0 opacity-60" aria-hidden="true" />
                <span className="truncate font-medium text-foreground" aria-current="page">{towerName ?? property.code}</span>
              </nav>

              {/* Header nhỏ: tên + hành động */}
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {property.verified && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2.5 py-1 font-sans text-[0.6875rem] font-semibold text-brand">
                        <BadgeCheck className="size-3.5" /> {t('property.verified')}
                      </span>
                    )}
                    {property.ratingAvg != null && (
                      <span className="inline-flex items-center gap-1 font-sans text-[0.8125rem] font-medium text-foreground">
                        <Star className="size-3.5 fill-amber-400 text-amber-400" />
                        {property.ratingAvg.toFixed(1)} · {t('property.reviewsCount', { count: property.reviewCount ?? reviews.length })}
                      </span>
                    )}
                  </div>
                  <h1 className="mt-2 text-balance font-sans text-2xl font-bold tracking-[-0.02em] text-foreground md:text-3xl">
                    {pickLocale(property.title, locale)}
                  </h1>
                  <p className="mt-1 inline-flex items-center gap-1.5 font-sans text-[0.9375rem] text-muted-foreground">
                    <MapPin className="size-4" /> {towerName ?? property.code}
                  </p>
                  {/* Tín hiệu quan tâm — dữ liệu THẬT: lượt xem tích luỹ + đặt gần đây */}
                  {((property.viewCount ?? 0) > 0 || (property.recentBookings ?? 0) > 0) && (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {(property.viewCount ?? 0) > 0 && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 font-sans text-[0.75rem] font-medium text-muted-foreground">
                          <Eye className="size-3.5" /> {t('property.views', { count: property.viewCount ?? 0 })}
                        </span>
                      )}
                      {(property.recentBookings ?? 0) > 0 && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/10 px-2.5 py-1 font-sans text-[0.75rem] font-semibold text-orange-600 dark:text-orange-400">
                          <Flame className="size-3.5" /> {t('property.recentBookings', { count: property.recentBookings ?? 0 })}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    aria-label={t('property.share')}
                    onClick={() => navigator.share?.({ title: pickLocale(property.title, locale) }).catch(() => {})}
                    className="flex size-10 items-center justify-center rounded-full border border-border text-foreground transition hover:bg-secondary"
                  >
                    <Share2 className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label={fav ? t('property.unsave') : t('property.save')}
                    aria-pressed={fav}
                    onClick={() => toggle(property.id)}
                    className="flex size-10 items-center justify-center rounded-full border border-border text-foreground transition hover:bg-secondary"
                  >
                    <Heart className={cn('size-4', fav && 'fill-red-500 text-red-500')} />
                  </button>
                </div>
              </div>

              {/* Gallery */}
              <div className="mt-5">
                <Gallery images={property.images} alt={pickLocale(property.title, locale)} />
              </div>

              {/* 2 cột: nội dung + booking */}
              <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_380px]">
                <div className="min-w-0">
                  {/* Sub-nav dính trong trang */}
                  <nav className="sticky top-[72px] z-20 -mx-4 mb-2 flex gap-1 overflow-x-auto border-b border-border bg-background/90 px-4 backdrop-blur-xl">
                    {[
                      ['overview', 'pnav.overview'],
                      ['amenities', 'pnav.amenities'],
                      ['location', 'pnav.location'],
                      ['reviews', 'pnav.reviews'],
                    ].map(([sid, key]) => {
                      const on = activeSection === sid
                      return (
                        <a
                          key={sid}
                          href={`#${sid}`}
                          aria-current={on ? 'true' : undefined}
                          className={cn(
                            'whitespace-nowrap border-b-2 px-3 py-3 font-sans text-[0.875rem] font-medium transition-colors',
                            on
                              ? 'border-brand text-foreground'
                              : 'border-transparent text-muted-foreground hover:border-brand/40 hover:text-foreground',
                          )}
                        >
                          {t(key)}
                        </a>
                      )
                    })}
                  </nav>

                  {/* Thông số */}
                  <div id="overview" className="flex scroll-mt-32 flex-wrap gap-x-8 gap-y-3 border-b border-border pb-6 pt-2">
                    <Spec icon={Maximize} label="m²" value={property.areaM2} />
                    <Spec icon={Bed} label={t('property.bedrooms')} value={property.bedrooms} />
                    <Spec icon={Bath} label={t('property.bathrooms')} value={property.bathrooms} />
                  </div>

                  {/* Mô tả */}
                  <section className="border-b border-border py-6">
                    <h2 className="font-sans text-lg font-bold text-foreground">{t('property.description')}</h2>
                    <p className="mt-3 whitespace-pre-line font-sans text-[0.9375rem] leading-[1.7] text-muted-foreground">
                      {pickLocale(property.description, locale)}
                    </p>
                  </section>

                  {/* Tiện ích (gom nhóm + icon) */}
                  <section id="amenities" className="scroll-mt-32 border-b border-border py-6">
                    <h2 className="mb-4 font-sans text-lg font-bold text-foreground">{t('property.amenities')}</h2>
                    <AmenitiesGrid amenities={property.amenities} />
                  </section>

                  {/* Vị trí + xung quanh */}
                  <section id="location" className="scroll-mt-32 border-b border-border py-6">
                    <h2 className="mb-1 font-sans text-lg font-bold text-foreground">{t('property.location')}</h2>
                    <p className="mb-4 font-sans text-sm text-muted-foreground">{t('property.nearby')}</p>
                    <PropertyLocation towerId={property.towerId} />
                  </section>

                  {/* Chủ nhà + Chính sách */}
                  <section className="grid gap-4 border-b border-border py-6 sm:grid-cols-2">
                    <div className="rounded-2xl border border-border bg-card p-5">
                      <div className="flex items-center gap-3">
                        <span className="flex size-11 items-center justify-center rounded-full bg-brand/10 font-sans text-base font-bold text-brand">
                          {towerName?.charAt(0) ?? 'H'}
                        </span>
                        <div className="min-w-0">
                          <p className="inline-flex items-center gap-1.5 font-sans text-[0.95rem] font-semibold text-foreground">
                            {t('property.host')} <BadgeCheck className="size-4 text-brand" />
                          </p>
                          <p className="font-sans text-[0.8125rem] text-muted-foreground">{t('property.hostResponse')}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="mt-4 w-full rounded-full border border-border py-2 font-sans text-sm font-medium text-foreground transition hover:bg-secondary"
                      >
                        {t('property.contactHost')}
                      </button>
                    </div>
                    <div className="rounded-2xl border border-border bg-card p-5">
                      <p className="font-sans text-[0.95rem] font-semibold text-foreground">{t('property.policies')}</p>
                      <ul className="mt-3 space-y-2 font-sans text-[0.8125rem] text-muted-foreground">
                        <li className="flex items-center gap-2"><Clock className="size-4 text-brand" /> {t('property.policyCheckin')}</li>
                        <li className="flex items-center gap-2"><Clock className="size-4 text-brand" /> {t('property.policyCheckout')}</li>
                        <li className="flex items-center gap-2"><CalendarCheck className="size-4 text-brand" /> {t('property.policyCancel')}</li>
                      </ul>
                    </div>
                  </section>

                  {/* Đánh giá */}
                  <section id="reviews" className="scroll-mt-32 py-6">
                    <h2 className="font-sans text-lg font-bold text-foreground">
                      {t('property.reviews')}
                      {property.ratingAvg != null && (
                        <span className="ml-2 inline-flex items-center gap-1 font-normal text-muted-foreground">
                          <Star className="size-4 fill-amber-400 text-amber-400" />
                          {property.ratingAvg.toFixed(1)}
                        </span>
                      )}
                    </h2>

                    {/* Viết đánh giá (khách đã đăng nhập) — cập nhật review + điểm/số ngay khi gửi */}
                    <ReviewForm
                      propertyId={property.id}
                      onSubmitted={(rv, p) => {
                        setReviews(rv)
                        setProperty(p)
                      }}
                    />

                    <ReviewsSection reviews={reviews} />
                  </section>
                </div>

                {/* Booking (sticky desktop) */}
                <aside id="booking" className="lg:sticky lg:top-[88px] lg:self-start">
                  <BookingCard property={property} blocked={blocked} />
                  {/* Tín hiệu tin cậy cạnh CTA */}
                  <ul className="mt-3 space-y-2 rounded-2xl border border-border bg-secondary/30 p-4">
                    {property.verified && (
                      <TrustItem icon={BadgeCheck}>{t('property.verified')}</TrustItem>
                    )}
                    <TrustItem icon={Clock}>{t('property.responseTime')}</TrustItem>
                    <TrustItem icon={ShieldCheck}>{t('property.noHiddenFee')}</TrustItem>
                    {property.type === 'stay_short' && (
                      <TrustItem icon={CalendarCheck}>{t('property.freeCancel')}</TrustItem>
                    )}
                  </ul>
                </aside>
              </div>

              {/* Căn tương tự */}
              {similar.length > 0 && (
                <section className="mt-14">
                  <h2 className="font-sans text-xl font-bold tracking-[-0.02em] text-foreground">{t('property.similar')}</h2>
                  <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
                    {similar.map((p) => (
                      <PropertyCard
                        key={p.id}
                        property={p}
                        towerName={towers[p.towerId]}
                        favorite={isFavorite(p.id)}
                        onToggleFavorite={toggle}
                      />
                    ))}
                  </div>
                </section>
              )}
            </Container>

            {/* Vừa xem */}
            <RecentlyViewed exclude={property.id} />

            {/* CTA sticky đáy (mobile) */}
            <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-xl lg:hidden">
              <div>
                <div className="font-sans text-lg font-bold tabular-nums text-foreground">{formatCurrency(property.priceVnd)}</div>
                <div className="font-sans text-[0.75rem] text-muted-foreground">
                  {property.type === 'rent_long' ? t('common.perMonth') : property.type === 'stay_short' ? t('common.perNight') : ''}
                </div>
              </div>
              <a
                href="#booking"
                className="rounded-full bg-primary px-6 py-3 font-sans text-[0.9375rem] font-semibold text-primary-foreground"
              >
                {property.type === 'stay_short' ? t('property.reserveNow') : t('property.viewingBook')}
              </a>
            </div>
          </main>
        )}
      </StateWrapper>
      <SiteFooter />
    </div>
  )
}

function TrustItem({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2.5 font-sans text-[0.8125rem] text-foreground">
      <Icon className="size-4 shrink-0 text-brand" aria-hidden="true" />
      {children}
    </li>
  )
}

function Spec({ icon: Icon, label, value }: { icon: typeof Bed; label: string; value: number }) {
  return (
    <span className="inline-flex items-center gap-2 font-sans text-[0.9375rem] text-foreground">
      <Icon className="size-5 text-muted-foreground" aria-hidden="true" />
      <span className="font-semibold">{value}</span>
      <span className="text-muted-foreground">{label}</span>
    </span>
  )
}
