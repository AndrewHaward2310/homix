'use client'

import { useEffect, useMemo, useState } from 'react'
import { TrendingUp, Wallet, Clock, Star } from 'lucide-react'
import type { Booking, Property } from '@/types'
import { bookingService } from '@/services/bookingService'
import { getProperties } from '@/services/propertyService'
import { useAuth } from '@/components/auth/auth-context'
import { useLocale } from '@/lib/i18n/provider'
import { useToast } from '@/components/ui/toast'
import { StateWrapper, type ViewState } from '@/components/ui/state-wrapper'
import { KpiCard } from '@/components/portal/kpi-card'
import { BookingItem } from '@/components/portal/booking-item'

export default function HostOverviewPage() {
  const { user } = useAuth()
  const { t, formatCurrency } = useLocale()
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
        setState('success')
      })
      .catch(() => setState('error'))
  }
  useEffect(load, [])

  const myProps = useMemo(
    () => Object.values(props).filter((p) => p.hostId === user?.id),
    [props, user],
  )
  const pending = bookings.filter((b) => b.status === 'pending')
  const monthRevenue = bookings
    .filter((b) => b.status === 'approved' || b.status === 'completed')
    .reduce((s, b) => s + b.totalVnd, 0)
  const ratings = myProps.map((p) => p.ratingAvg).filter((r): r is number => r != null)
  const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0

  const act = async (id: string, action: 'approve' | 'decline') => {
    const prev = bookings
    setBookings((bs) =>
      bs.map((b) => (b.id === id ? { ...b, status: action === 'approve' ? 'approved' : 'declined' } : b)),
    )
    const res = await bookingService.updateBooking(id, action)
    if (!res.ok) {
      setBookings(prev)
      toast({ message: t('toast.error'), variant: 'error' })
    } else {
      toast({ message: action === 'approve' ? t('toast.approved') : t('toast.declined') })
    }
  }

  const name = user?.name?.split(' ').slice(-1)[0] ?? ''

  return (
    <div className="mx-auto max-w-7xl">
      <h1 className="font-sans text-2xl font-bold tracking-[-0.02em] text-foreground">
        {t('host.greeting', { name })}
      </h1>
      <p className="mt-1 font-sans text-sm text-muted-foreground">
        {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}
      </p>

      <StateWrapper state={state} className="mt-6" onRetry={load}>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiCard icon={TrendingUp} label={t('host.kpiOccupancy')} value="78%" trend={6} />
          <KpiCard icon={Wallet} label={t('host.kpiRevenue')} value={formatCurrency(monthRevenue)} trend={12} />
          <KpiCard icon={Clock} label={t('host.kpiPending')} value={String(pending.length)} />
          <KpiCard icon={Star} label={t('host.kpiRating')} value={avgRating ? avgRating.toFixed(1) : '—'} trend={2} />
        </div>

        <section className="mt-8">
          <h2 className="mb-3 font-sans text-lg font-bold text-foreground">{t('host.pendingTitle')}</h2>
          {pending.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-6 text-center font-sans text-sm text-muted-foreground">
              {t('host.pendingEmpty')}
            </p>
          ) : (
            <div className="space-y-3">
              {pending.map((b) => (
                <BookingItem
                  key={b.id}
                  booking={b}
                  property={props[b.propertyId]}
                  showCustomer
                  actions={
                    <>
                      <button
                        type="button"
                        onClick={() => act(b.id, 'decline')}
                        className="rounded-full border border-border px-3.5 py-1.5 font-sans text-[0.8125rem] font-medium text-foreground transition-colors hover:bg-secondary"
                      >
                        {t('booking.decline')}
                      </button>
                      <button
                        type="button"
                        onClick={() => act(b.id, 'approve')}
                        className="rounded-full bg-primary px-4 py-1.5 font-sans text-[0.8125rem] font-semibold text-primary-foreground transition hover:brightness-110"
                      >
                        {t('booking.approve')}
                      </button>
                    </>
                  }
                />
              ))}
            </div>
          )}
        </section>
      </StateWrapper>
    </div>
  )
}
