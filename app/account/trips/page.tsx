'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import type { Booking, Property } from '@/types'
import { bookingService } from '@/services/bookingService'
import { getProperties } from '@/services/propertyService'
import { useT } from '@/lib/i18n/provider'
import { useToast } from '@/components/ui/toast'
import { StateWrapper, type ViewState } from '@/components/ui/state-wrapper'
import { BookingItem } from '@/components/portal/booking-item'

export default function TripsPage() {
  const t = useT()
  const toast = useToast()
  const [state, setState] = useState<ViewState>('loading')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [props, setProps] = useState<Record<string, Property>>({})

  const load = () => {
    setState('loading')
    Promise.all([bookingService.getBookings(), getProperties()])
      .then(([bk, ps]) => {
        setBookings(bk)
        setProps(Object.fromEntries(ps.map((p) => [p.id, p])))
        setState(bk.length ? 'success' : 'empty')
      })
      .catch(() => setState('error'))
  }
  useEffect(load, [])

  const now = Date.now()
  const dateOf = (b: Booking) =>
    b.type === 'stay_short'
      ? new Date((b.checkOut ?? b.checkIn ?? '') + 'T23:59:59').getTime()
      : b.viewingAt
        ? new Date(b.viewingAt).getTime()
        : 0

  const { upcoming, past } = useMemo(() => {
    const up: Booking[] = []
    const pa: Booking[] = []
    for (const b of bookings) {
      const active = b.status === 'pending' || b.status === 'approved'
      if (active && dateOf(b) >= now) up.push(b)
      else pa.push(b)
    }
    const byDate = (a: Booking, b: Booking) => dateOf(a) - dateOf(b)
    return { upcoming: up.sort(byDate), past: pa.sort((a, b) => dateOf(b) - dateOf(a)) }
  }, [bookings, now])

  const cancel = async (id: string) => {
    const prev = bookings
    setBookings((bs) => bs.map((b) => (b.id === id ? { ...b, status: 'cancelled' } : b)))
    const res = await bookingService.updateBooking(id, 'cancel')
    if (!res.ok) {
      setBookings(prev)
      toast({ message: t('toast.error'), variant: 'error' })
    } else {
      toast({ message: t('toast.cancelled') })
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-sans text-2xl font-bold tracking-[-0.02em] text-foreground">{t('account.trips')}</h1>

      <StateWrapper
        state={state}
        className="mt-6"
        onRetry={load}
        emptyTitle={t('account.tripsEmpty')}
        emptyHint={t('account.tripsEmptyHint')}
      >
        {upcoming.length > 0 && (
          <section>
            <h2 className="mb-3 font-sans text-sm font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              {t('account.upcoming')}
            </h2>
            <div className="space-y-3">
              {upcoming.map((b) => (
                <BookingItem
                  key={b.id}
                  booking={b}
                  property={props[b.propertyId]}
                  actions={
                    <button
                      type="button"
                      onClick={() => cancel(b.id)}
                      className="rounded-full border border-border px-3.5 py-1.5 font-sans text-[0.8125rem] font-medium text-foreground transition-colors hover:bg-secondary"
                    >
                      {t('booking.cancel')}
                    </button>
                  }
                />
              ))}
            </div>
          </section>
        )}

        {past.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 font-sans text-sm font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              {t('account.past')}
            </h2>
            <div className="space-y-3 opacity-90">
              {past.map((b) => (
                <BookingItem key={b.id} booking={b} property={props[b.propertyId]} />
              ))}
            </div>
          </section>
        )}
      </StateWrapper>

      <Link
        href="/search"
        className="mt-8 inline-flex rounded-full bg-primary px-5 py-2.5 font-sans text-sm font-semibold text-primary-foreground"
      >
        {t('account.explore')}
      </Link>
    </div>
  )
}
