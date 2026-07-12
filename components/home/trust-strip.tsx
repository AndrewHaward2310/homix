'use client'

import { useEffect, useState } from 'react'
import { BadgeCheck, Receipt, Headphones, Building2, MapPin, Users, Star } from 'lucide-react'
import { Container } from '@/components/luxury/container'
import { getHomeStats, type HomeStats } from '@/services/homeService'
import { useT } from '@/lib/i18n/provider'

/**
 * TrustStrip — dải tín hiệu tin cậy ngay dưới hero: số liệu THẬT từ DB
 * (căn hộ, phân khu, chủ nhà xác thực, đánh giá) + 3 cam kết dịch vụ.
 */
export function TrustStrip() {
  const t = useT()
  const [stats, setStats] = useState<HomeStats | null>(null)

  useEffect(() => {
    let active = true
    getHomeStats()
      .then((s) => active && setStats(s))
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])

  const nf = (n: number) => new Intl.NumberFormat('vi-VN').format(n)
  const metrics = [
    { icon: Building2, value: stats ? `${nf(stats.properties)}+` : '—', label: t('trust.properties') },
    { icon: MapPin, value: stats ? nf(stats.towers) : '—', label: t('trust.towers') },
    { icon: Users, value: stats ? nf(stats.hosts) : '—', label: t('trust.hosts') },
    { icon: Star, value: stats ? nf(stats.reviews) : '—', label: t('trust.reviews') },
  ]
  const promises = [
    { icon: BadgeCheck, label: t('trust.verified') },
    { icon: Receipt, label: t('trust.transparent') },
    { icon: Headphones, label: t('trust.support') },
  ]

  return (
    <section className="border-b border-border bg-background">
      <Container className="py-8">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {metrics.map((m) => (
            <div key={m.label} className="flex flex-col items-center text-center sm:flex-row sm:items-center sm:gap-3 sm:text-left">
              <m.icon className="mb-2 size-6 text-brand sm:mb-0" aria-hidden="true" />
              <div>
                <div className="font-sans text-[1.4rem] font-bold leading-none tracking-[-0.02em] text-foreground tabular-nums">
                  {m.value}
                </div>
                <div className="mt-1 font-sans text-[0.8125rem] text-muted-foreground">{m.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 border-t border-border pt-6">
          {promises.map((p) => (
            <span key={p.label} className="inline-flex items-center gap-2 font-sans text-[0.875rem] font-medium text-foreground">
              <p.icon className="size-4 text-brand" aria-hidden="true" />
              {p.label}
            </span>
          ))}
        </div>
      </Container>
    </section>
  )
}
