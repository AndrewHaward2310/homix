'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Star, Quote } from 'lucide-react'
import type { FeaturedReview } from '@/services/homeService'
import { pickLocale } from '@/types'
import { Section } from '@/components/luxury/section'
import { H2, Body, Eyebrow } from '@/components/luxury/typography'
import { Reveal } from '@/components/luxury/reveal'
import { getFeaturedReviews } from '@/services/homeService'
import { useLocale } from '@/lib/i18n/provider'

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating}/5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={i <= rating ? 'size-4 fill-amber-400 text-amber-400' : 'size-4 text-border'}
          aria-hidden="true"
        />
      ))}
    </div>
  )
}

function ReviewCard({ review }: { review: FeaturedReview }) {
  const { locale } = useLocale()
  return (
    <figure className="flex h-full flex-col rounded-3xl border border-border bg-card p-6 shadow-luxury-sm">
      <Quote className="size-7 text-brand/25" aria-hidden="true" />
      <blockquote className="mt-3 flex-1 font-sans text-[0.95rem] leading-relaxed text-foreground">
        “{review.comment}”
      </blockquote>
      <div className="mt-5 flex items-center gap-3 border-t border-border pt-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={review.avatarUrl || '/images/avatar-customer.png'}
          alt=""
          className="size-10 shrink-0 rounded-full object-cover ring-1 ring-black/5"
        />
        <figcaption className="min-w-0 flex-1">
          <div className="truncate font-sans text-[0.875rem] font-semibold text-foreground">
            {review.customerName}
          </div>
          <Link
            href={`/property/${review.propertyId}`}
            className="truncate font-sans text-[0.75rem] text-muted-foreground transition hover:text-brand"
          >
            {pickLocale(review.propertyTitle, locale)}
          </Link>
        </figcaption>
        <Stars rating={review.rating} />
      </div>
    </figure>
  )
}

/**
 * TestimonialsSection — dải "Khách nói gì": đánh giá THẬT (rating ≥4) toàn sàn,
 * kèm avatar, tên khách và link tới căn đã ở. Tăng tín hiệu tin cậy.
 */
export function TestimonialsSection() {
  const { t } = useLocale()
  const [reviews, setReviews] = useState<FeaturedReview[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    getFeaturedReviews(6)
      .then((data) => active && setReviews(data))
      .catch(() => active && setReviews([]))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  if (!loading && reviews.length === 0) return null

  const avg = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : '5.0'

  return (
    <Section id="danh-gia" className="scroll-mt-20">
      <Reveal className="max-w-2xl">
        <Eyebrow>{t('testimonials.eyebrow')}</Eyebrow>
        <H2 className="mt-4 font-serif">{t('testimonials.title')}</H2>
        <Body className="mt-5">{t('testimonials.subtitle')}</Body>
        {!loading && (
          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2">
            <Star className="size-4 fill-amber-400 text-amber-400" />
            <span className="font-sans text-[0.9rem] font-semibold text-foreground">
              {t('testimonials.ratingLine', { avg, n: reviews.length })}
            </span>
          </div>
        )}
      </Reveal>

      <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-56 rounded-3xl" />)
          : reviews.map((r, i) => (
              <Reveal key={r.id} delay={(i % 3) * 80}>
                <ReviewCard review={r} />
              </Reveal>
            ))}
      </div>
    </Section>
  )
}
