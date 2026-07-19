'use client'

import Image from 'next/image'
import Link from 'next/link'
import { CalendarDays, Eye } from 'lucide-react'
import type { Booking, BookingStatus, Property } from '@/types'
import { pickLocale } from '@/types'
import { useLocale } from '@/lib/i18n/provider'
import { cn } from '@/lib/utils'

const STATUS_STYLE: Record<BookingStatus, string> = {
  pending: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  approved: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  declined: 'bg-red-500/15 text-red-600 dark:text-red-400',
  cancelled: 'bg-secondary text-muted-foreground',
  completed: 'bg-brand/10 text-brand',
}

export function StatusBadge({ status }: { status: BookingStatus }) {
  const { t } = useLocale()
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 font-sans text-[0.6875rem] font-semibold',
        STATUS_STYLE[status],
      )}
    >
      {t(`booking.status.${status}`)}
    </span>
  )
}

export function BookingItem({
  booking,
  property,
  actions,
  showCustomer,
  customerName,
}: {
  booking: Booking
  property?: Property
  actions?: React.ReactNode
  showCustomer?: boolean
  customerName?: string
}) {
  const { locale, t, formatCurrency, formatDate } = useLocale()
  const isStay = booking.type === 'stay_short'
  const title = property ? pickLocale(property.title, locale) : booking.propertyId

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center">
      <Link
        href={`/property/${booking.propertyId}`}
        className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-xl bg-secondary sm:size-24 sm:aspect-square"
      >
        {property?.images[0] && (
          <Image src={property.images[0]} alt={title} fill sizes="120px" className="object-cover" />
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <StatusBadge status={booking.status} />
          <span className="inline-flex items-center gap-1 font-sans text-[0.75rem] text-muted-foreground">
            {isStay ? <CalendarDays className="size-3.5" /> : <Eye className="size-3.5" />}
            {isStay ? t('booking.stay') : t('booking.viewing')}
          </span>
        </div>
        <Link href={`/property/${booking.propertyId}`}>
          <h3 className="mt-1.5 line-clamp-2 font-sans text-[0.975rem] font-semibold leading-snug text-foreground hover:underline">
            {title}
          </h3>
        </Link>
        <p className="mt-0.5 font-sans text-[0.8125rem] text-muted-foreground">
          {showCustomer && customerName ? `${customerName} · ` : ''}
          {isStay
            ? `${booking.checkIn} → ${booking.checkOut}`
            : booking.viewingAt
              ? formatDate(booking.viewingAt, { dateStyle: 'medium', timeStyle: 'short' })
              : ''}
        </p>
        {booking.totalVnd > 0 && (
          <p className="mt-0.5 font-sans text-[0.8125rem] font-medium text-foreground">
            {t('booking.total')}: {formatCurrency(booking.totalVnd)}
          </p>
        )}
      </div>

      {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
    </div>
  )
}
