'use client'

import { useEffect, useRef, useState } from 'react'
import { useLocale } from '@/lib/i18n/provider'
import { getIntlLocale } from '@/lib/i18n/config'
import { cn } from '@/lib/utils'

type Props = {
  /** Giá trị đích. */
  value: number
  /** Hậu tố sau số, ví dụ "+". */
  suffix?: string
  /** Thời lượng đếm (ms). */
  duration?: number
  className?: string
}

/**
 * CountUp — đếm số 0 → value khi cuộn tới (một lần), định dạng theo locale.
 *
 * An toàn SSR/CLS/a11y:
 *  - SSR & no-JS: hiện thẳng giá trị đích (state khởi tạo = value).
 *  - Chống nhảy layout: lớp "giữ chỗ" ẩn luôn chiếm bề rộng của giá trị đích,
 *    nên số đang đếm không đẩy các cột bên cạnh.
 *  - a11y: `aria-label` là giá trị đích ổn định; phần số đang đếm `aria-hidden`.
 *  - Tôn trọng prefers-reduced-motion: giữ nguyên giá trị đích, không animate.
 */
export function CountUp({ value, suffix = '', duration = 1100, className }: Props) {
  const { locale } = useLocale()
  const ref = useRef<HTMLSpanElement | null>(null)
  const [display, setDisplay] = useState(value) // SSR/no-JS = giá trị đích
  const fmt = (n: number) => new Intl.NumberFormat(getIntlLocale(locale)).format(n)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      setDisplay(value)
      return
    }

    let raf = 0
    let start: number | null = null
    let ran = false

    const run = () => {
      const step = (ts: number) => {
        if (start === null) start = ts
        const p = Math.min((ts - start) / duration, 1)
        const eased = 0.5 - Math.cos(Math.PI * p) / 2 // ease-in-out
        setDisplay(Math.round(value * eased))
        if (p < 1) raf = requestAnimationFrame(step)
      }
      raf = requestAnimationFrame(step)
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !ran) {
            ran = true
            setDisplay(0)
            run()
            io.unobserve(node)
          }
        })
      },
      { threshold: 0.6 },
    )
    io.observe(node)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [value, duration])

  return (
    <span
      ref={ref}
      aria-label={`${fmt(value)}${suffix}`}
      className={cn('relative inline-grid tabular-nums', className)}
    >
      {/* Giữ chỗ = giá trị đích → không nhảy layout khi số đang đếm nở ra */}
      <span aria-hidden="true" className="invisible [grid-area:1/1]">
        {fmt(value)}
        {suffix}
      </span>
      {/* Số đang đếm (đè lên lớp giữ chỗ) */}
      <span aria-hidden="true" className="[grid-area:1/1]">
        {fmt(display)}
        {suffix}
      </span>
    </span>
  )
}
