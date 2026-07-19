'use client'

import { BadgeCheck, Receipt, Headphones } from 'lucide-react'
import { Container } from '@/components/luxury/container'
import { useT } from '@/lib/i18n/provider'

/**
 * TrustStrip — dải cam kết dịch vụ (xác minh · minh bạch · hỗ trợ 24/7).
 * Số liệu tổng quan đã nằm ở hero nên dải này chỉ giữ 3 cam kết (tránh trùng lặp).
 */
export function TrustStrip() {
  const t = useT()
  const promises = [
    { icon: BadgeCheck, label: t('trust.verified') },
    { icon: Receipt, label: t('trust.transparent') },
    { icon: Headphones, label: t('trust.support') },
  ]

  return (
    <section className="border-b border-border bg-background">
      <Container className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 py-5">
        {promises.map((p) => (
          <span
            key={p.label}
            className="inline-flex items-center gap-2 font-sans text-[0.9rem] font-medium text-foreground"
          >
            <p.icon className="size-4 text-brand" aria-hidden="true" />
            {p.label}
          </span>
        ))}
      </Container>
    </section>
  )
}
