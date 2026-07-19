'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { CalendarClock, Clock, Eye, KeyRound, LogOut, MapPin } from 'lucide-react'
import type { Booking, BookingStatus, Property } from '@/types'
import { pickLocale } from '@/types'
import { getBookings } from '@/services/bookingService'
import { searchProperties, getTowers } from '@/services/propertyService'
import { useLocale } from '@/lib/i18n/provider'
import { StateWrapper, type ViewState } from '@/components/ui/state-wrapper'
import { cn } from '@/lib/utils'

type EventKind = 'viewing' | 'checkin' | 'checkout'

type ScheduleEvent = {
  key: string
  when: Date
  dateKey: string
  hasTime: boolean
  kind: EventKind
  booking: Booking
}

const KIND_ICON: Record<EventKind, typeof Eye> = {
  viewing: Eye,
  checkin: KeyRound,
  checkout: LogOut,
}
const KIND_STYLE: Record<EventKind, string> = {
  viewing: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  checkin: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  checkout: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
}
const STATUS_STYLE: Record<BookingStatus, string> = {
  pending: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  approved: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  completed: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  declined: 'bg-red-500/15 text-red-600 dark:text-red-400',
  cancelled: 'bg-secondary text-muted-foreground',
}

/** Ngày local dạng YYYY-MM-DD (không lệch múi giờ). */
const localKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** Parse 'YYYY-MM-DD' thành Date LOCAL 00:00 (tránh lệch ngày do UTC). */
const parseLocalDate = (s: string) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

const PAGE_SIZE = 48 // trần API /api/properties

/**
 * Lấy TẤT CẢ bất động sản (phân trang) để map propertyId→title. Agent thấy mọi booking
 * nên nếu chỉ lấy trang đầu (48), booking của căn ngoài trang đầu sẽ mất tên.
 */
async function fetchAllProperties(): Promise<Property[]> {
  const first = await searchProperties({ pageSize: PAGE_SIZE, page: 1 })
  const totalPages = Math.max(1, Math.ceil(first.total / PAGE_SIZE))
  if (totalPages === 1) return first.items
  const rest = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, i) =>
      searchProperties({ pageSize: PAGE_SIZE, page: i + 2 }).then((r) => r.items),
    ),
  )
  return [first.items, ...rest].flat()
}

export default function AgentSchedulePage() {
  const { locale, t, formatDate } = useLocale()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [propById, setPropById] = useState<Map<string, Property>>(new Map())
  const [towerName, setTowerName] = useState<Record<string, string>>({})
  const [state, setState] = useState<ViewState>('loading')

  const load = useCallback(() => {
    setState('loading')
    Promise.all([getBookings(), fetchAllProperties(), getTowers()])
      .then(([bs, all, tw]) => {
        setBookings(bs)
        setPropById(new Map(all.map((p) => [p.id, p])))
        setTowerName(Object.fromEntries(tw.map((x) => [x.id, x.name])))
        setState('success')
      })
      .catch(() => setState('error'))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // Dựng sự kiện lịch từ booking THẬT: hẹn xem (viewingAt) + nhận/trả phòng (stay).
  // Bỏ đơn huỷ/từ chối. Chỉ lấy mốc từ hôm nay trở đi.
  const { groups, todayCount, weekCount } = useMemo(() => {
    const now = Date.now()
    const startToday = new Date()
    startToday.setHours(0, 0, 0, 0)
    const in7 = new Date(startToday)
    in7.setDate(in7.getDate() + 7)
    const todayKey = localKey(startToday)

    const events: ScheduleEvent[] = []
    for (const b of bookings) {
      if (b.status === 'cancelled' || b.status === 'declined') continue
      if (b.viewingAt) {
        const when = new Date(b.viewingAt)
        if (!Number.isNaN(when.getTime()))
          events.push({ key: `${b.id}-v`, when, dateKey: localKey(when), hasTime: true, kind: 'viewing', booking: b })
      }
      if (b.type === 'stay_short') {
        if (b.checkIn) {
          const when = parseLocalDate(b.checkIn)
          events.push({ key: `${b.id}-i`, when, dateKey: b.checkIn, hasTime: false, kind: 'checkin', booking: b })
        }
        if (b.checkOut) {
          const when = parseLocalDate(b.checkOut)
          events.push({ key: `${b.id}-o`, when, dateKey: b.checkOut, hasTime: false, kind: 'checkout', booking: b })
        }
      }
    }

    // Cutoff theo loại: mốc CÓ GIỜ (hẹn xem) đã qua trong hôm nay thì ẩn (>= bây giờ);
    // mốc CẢ NGÀY (nhận/trả phòng) giữ nếu còn trong hôm nay (>= đầu ngày).
    const upcoming = events
      .filter((e) => (e.hasTime ? e.when.getTime() >= now : e.when.getTime() >= startToday.getTime()))
      .sort((a, b) => a.when.getTime() - b.when.getTime())

    // Nhóm theo ngày, giữ thứ tự tăng dần.
    const byDay = new Map<string, ScheduleEvent[]>()
    for (const e of upcoming) {
      const arr = byDay.get(e.dateKey) ?? []
      arr.push(e)
      byDay.set(e.dateKey, arr)
    }

    return {
      groups: [...byDay.entries()],
      todayCount: upcoming.filter((e) => e.dateKey === todayKey).length,
      weekCount: upcoming.filter((e) => e.when.getTime() < in7.getTime()).length,
    }
  }, [bookings])

  // Nhãn ngày: Hôm nay / Ngày mai / ngày đầy đủ.
  const dayLabel = (dateKey: string) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    if (dateKey === localKey(today)) return t('agent.schedule.today')
    if (dateKey === localKey(tomorrow)) return t('agent.schedule.tomorrow')
    return formatDate(parseLocalDate(dateKey), { weekday: 'long', day: 'numeric', month: 'long' })
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-brand/10 text-brand">
          <CalendarClock className="size-5" />
        </span>
        <div>
          <h1 className="font-sans text-2xl font-bold tracking-[-0.02em] text-foreground">
            {t('agent.schedule.title')}
          </h1>
          <p className="font-sans text-[0.9rem] text-muted-foreground">{t('agent.schedule.subtitle')}</p>
        </div>
      </div>

      <StateWrapper state={state} className="mt-8" onRetry={load} retryLabel={t('locator.retry')}>
        {/* Tóm tắt nhanh */}
        <div className="flex flex-wrap gap-2.5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3.5 py-1.5 font-sans text-[0.8125rem] font-semibold text-brand">
            <Clock className="size-3.5" />
            {t('agent.schedule.todayCount', { n: todayCount })}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3.5 py-1.5 font-sans text-[0.8125rem] font-semibold text-foreground">
            <CalendarClock className="size-3.5" />
            {t('agent.schedule.weekCount', { n: weekCount })}
          </span>
        </div>

        {groups.length === 0 ? (
          <p className="mt-10 rounded-2xl border border-dashed border-border py-12 text-center font-sans text-[0.9rem] text-muted-foreground">
            {t('agent.schedule.empty')}
          </p>
        ) : (
          <div className="mt-6 space-y-7">
            {groups.map(([dateKey, evs]) => (
              <section key={dateKey}>
                <h2 className="sticky top-[72px] z-[1] -mx-1 bg-background/90 px-1 py-1.5 font-sans text-[0.8125rem] font-bold uppercase tracking-[0.08em] text-muted-foreground backdrop-blur">
                  {dayLabel(dateKey)}
                </h2>
                <ul className="mt-2 space-y-2.5">
                  {evs.map((e) => {
                    const p = propById.get(e.booking.propertyId)
                    const Icon = KIND_ICON[e.kind]
                    const tName = p ? towerName[p.towerId] : undefined
                    const inner = (
                      <>
                        {/* Cột thời gian */}
                        <div className="w-16 shrink-0 text-center">
                          <div className="font-sans text-[0.95rem] font-bold tabular-nums text-foreground">
                            {e.hasTime
                              ? formatDate(e.when, { hour: '2-digit', minute: '2-digit' })
                              : t('agent.schedule.allDay')}
                          </div>
                        </div>
                        <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-xl', KIND_STYLE[e.kind])}>
                          <Icon className="size-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-sans text-[0.8125rem] font-semibold text-foreground">
                              {t(`agent.schedule.kind.${e.kind}`)}
                            </span>
                            <span
                              className={cn(
                                'rounded-full px-2 py-0.5 font-sans text-[0.6875rem] font-semibold',
                                STATUS_STYLE[e.booking.status],
                              )}
                            >
                              {t(`booking.status.${e.booking.status}`)}
                            </span>
                          </div>
                          {/* Căn không còn trong danh sách → nhãn chung, KHÔNG lộ id nội bộ. */}
                          <p className="mt-0.5 line-clamp-2 font-sans text-[0.9rem] font-semibold leading-snug text-foreground">
                            {p ? pickLocale(p.title, locale) : t('agent.schedule.unknownProperty')}
                          </p>
                          {tName && (
                            <p className="mt-0.5 flex items-center gap-1 font-sans text-[0.75rem] text-muted-foreground">
                              <MapPin className="size-3" />
                              {tName}
                            </p>
                          )}
                        </div>
                      </>
                    )
                    const rowClass =
                      'flex items-center gap-3.5 rounded-2xl border border-border bg-card p-3.5'
                    return (
                      <li key={e.key}>
                        {/* Chỉ bọc Link khi căn còn tồn tại (tránh link chết 404). */}
                        {p ? (
                          <Link href={`/property/${e.booking.propertyId}`} className={cn(rowClass, 'transition hover:shadow-luxury')}>
                            {inner}
                          </Link>
                        ) : (
                          <div className={rowClass}>{inner}</div>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}
      </StateWrapper>
    </div>
  )
}
