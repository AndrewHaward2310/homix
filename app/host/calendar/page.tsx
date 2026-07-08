'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Booking, Property } from '@/types'
import { bookingService } from '@/services/bookingService'
import { getProperties } from '@/services/propertyService'
import { useAuth } from '@/components/auth/auth-context'
import { useT } from '@/lib/i18n/provider'
import { StateWrapper, type ViewState } from '@/components/ui/state-wrapper'
import { BookingItem } from '@/components/portal/booking-item'
import { cn } from '@/lib/utils'

const MS_DAY = 86_400_000
const iso = (d: Date) => d.toISOString().slice(0, 10)

export default function HostCalendarPage() {
  const { user } = useAuth()
  const t = useT()
  const [state, setState] = useState<ViewState>('loading')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [props, setProps] = useState<Property[]>([])
  const [propId, setPropId] = useState<string>('all')
  const [cursor, setCursor] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })

  const load = () => {
    setState('loading')
    Promise.all([bookingService.getBookings(), getProperties({ hostId: user?.id })])
      .then(([bk, ps]) => {
        setBookings(bk)
        setProps(ps)
        setState('success')
      })
      .catch(() => setState('error'))
  }
  useEffect(load, [user])

  const propsMap = useMemo(() => Object.fromEntries(props.map((p) => [p.id, p])), [props])
  const filtered = bookings.filter((b) => propId === 'all' || b.propertyId === propId)

  // Ngày đã đặt (stay_short, pending/approved) cho tô lịch.
  const bookedDays = useMemo(() => {
    const set = new Set<string>()
    for (const b of filtered) {
      if (b.type !== 'stay_short' || !b.checkIn || !b.checkOut) continue
      if (!['pending', 'approved'].includes(b.status)) continue
      for (let d = new Date(b.checkIn + 'T00:00:00').getTime(); d < new Date(b.checkOut + 'T00:00:00').getTime(); d += MS_DAY) {
        set.add(iso(new Date(d)))
      }
    }
    return set
  }, [filtered])

  const act = async (id: string, action: 'approve' | 'decline') => {
    const prev = bookings
    setBookings((bs) => bs.map((b) => (b.id === id ? { ...b, status: action === 'approve' ? 'approved' : 'declined' } : b)))
    const res = await bookingService.updateBooking(id, action)
    if (!res.ok) setBookings(prev)
  }

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7
  const days = new Date(year, month + 1, 0).getDate()
  const cells = [...Array(firstDow).fill(null), ...Array.from({ length: days }, (_, i) => iso(new Date(year, month, i + 1)))]

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-sans text-2xl font-bold tracking-[-0.02em] text-foreground">{t('host.calendarTitle')}</h1>
        <select
          value={propId}
          onChange={(e) => setPropId(e.target.value)}
          className="rounded-full border border-border bg-background px-4 py-2 font-sans text-sm text-foreground outline-none"
        >
          <option value="all">{t('host.allProperties')}</option>
          {props.map((p) => (
            <option key={p.id} value={p.id}>
              {p.code}
            </option>
          ))}
        </select>
      </div>

      <StateWrapper state={state} className="mt-6" onRetry={load}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
          {/* Calendar */}
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <button type="button" aria-label="Prev" onClick={() => setCursor(new Date(year, month - 1, 1))} className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary">
                <ChevronLeft className="size-4" />
              </button>
              <span className="font-sans text-sm font-semibold text-foreground">
                {cursor.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
              </span>
              <button type="button" aria-label="Next" onClick={() => setCursor(new Date(year, month + 1, 1))} className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary">
                <ChevronRight className="size-4" />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
              {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d) => (
                <span key={d} className="py-1 font-sans text-[0.6875rem] font-medium text-muted-foreground">{d}</span>
              ))}
              {cells.map((d, i) =>
                d ? (
                  <span
                    key={d}
                    className={cn(
                      'flex aspect-square items-center justify-center rounded-lg font-sans text-[0.8125rem]',
                      bookedDays.has(d) ? 'bg-brand text-brand-foreground font-semibold' : 'text-foreground',
                    )}
                  >
                    {Number(d.slice(-2))}
                  </span>
                ) : (
                  <span key={i} />
                ),
              )}
            </div>
            <p className="mt-3 flex items-center gap-2 font-sans text-[0.75rem] text-muted-foreground">
              <span className="size-3 rounded bg-brand" /> Ngày đã đặt
            </p>
          </div>

          {/* Booking list */}
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border p-6 text-center font-sans text-sm text-muted-foreground">
                {t('host.pendingEmpty')}
              </p>
            ) : (
              filtered.map((b) => (
                <BookingItem
                  key={b.id}
                  booking={b}
                  property={propsMap[b.propertyId]}
                  showCustomer
                  actions={
                    b.status === 'pending' ? (
                      <>
                        <button type="button" onClick={() => act(b.id, 'decline')} className="rounded-full border border-border px-3 py-1.5 font-sans text-[0.8125rem] font-medium text-foreground hover:bg-secondary">
                          {t('booking.decline')}
                        </button>
                        <button type="button" onClick={() => act(b.id, 'approve')} className="rounded-full bg-primary px-3.5 py-1.5 font-sans text-[0.8125rem] font-semibold text-primary-foreground hover:brightness-110">
                          {t('booking.approve')}
                        </button>
                      </>
                    ) : undefined
                  }
                />
              ))
            )}
          </div>
        </div>
      </StateWrapper>
    </div>
  )
}
