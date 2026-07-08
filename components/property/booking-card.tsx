'use client'

import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, CalendarDays, CheckCircle2, Loader2 } from 'lucide-react'
import type { AvailabilityRange, Property } from '@/types'
import { useLocale } from '@/lib/i18n/provider'
import { bookingService } from '@/services/bookingService'
import { cn } from '@/lib/utils'

const MS_DAY = 86_400_000
const iso = (d: Date) => d.toISOString().slice(0, 10)
const parse = (s: string) => new Date(s + 'T00:00:00')

function useBlocked(ranges: AvailabilityRange[]) {
  return useMemo(() => {
    const set = new Set<string>()
    for (const r of ranges) {
      for (let t = parse(r.from).getTime(); t < parse(r.to).getTime(); t += MS_DAY) {
        set.add(iso(new Date(t)))
      }
    }
    return set
  }, [ranges])
}

/** Lịch 1 tháng: chọn nhận→trả; ngày quá khứ/đã đặt bị chặn. */
function Calendar({
  blocked,
  checkIn,
  checkOut,
  onPick,
}: {
  blocked: Set<string>
  checkIn: string | null
  checkOut: string | null
  onPick: (day: string) => void
}) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const today = iso(new Date())
  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7 // T2=0
  const days = new Date(year, month + 1, 0).getDate()
  const cells: (string | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: days }, (_, i) => iso(new Date(year, month, i + 1))),
  ]
  const inRange = (d: string) => checkIn && checkOut && d > checkIn && d < checkOut

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          aria-label="Prev month"
          onClick={() => setCursor(new Date(year, month - 1, 1))}
          className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary"
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className="font-sans text-sm font-semibold text-foreground">
          {cursor.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
        </span>
        <button
          type="button"
          aria-label="Next month"
          onClick={() => setCursor(new Date(year, month + 1, 1))}
          className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d) => (
          <span key={d} className="py-1 font-sans text-[0.6875rem] font-medium text-muted-foreground">
            {d}
          </span>
        ))}
        {cells.map((d, i) => {
          if (!d) return <span key={i} />
          const disabled = d < today || blocked.has(d)
          const selected = d === checkIn || d === checkOut
          return (
            <button
              key={d}
              type="button"
              disabled={disabled}
              onClick={() => onPick(d)}
              className={cn(
                'flex aspect-square items-center justify-center rounded-lg font-sans text-[0.8125rem] transition-colors',
                disabled && 'text-muted-foreground/40 line-through',
                !disabled && !selected && !inRange(d) && 'text-foreground hover:bg-secondary',
                inRange(d) && 'bg-brand/10 text-foreground',
                selected && 'bg-brand text-brand-foreground font-semibold',
              )}
            >
              {Number(d.slice(-2))}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function BookingCard({
  property,
  blocked: blockedRanges,
  className,
}: {
  property: Property
  blocked: AvailabilityRange[]
  className?: string
}) {
  const { t, formatCurrency } = useLocale()
  const blocked = useBlocked(blockedRanges)
  const isStay = property.type === 'stay_short'

  const [checkIn, setCheckIn] = useState<string | null>(null)
  const [checkOut, setCheckOut] = useState<string | null>(null)
  const [viewingAt, setViewingAt] = useState('')
  const [state, setState] = useState<'idle' | 'confirm' | 'sending' | 'done' | 'error'>('idle')
  const [errMsg, setErrMsg] = useState('')

  const nights =
    checkIn && checkOut
      ? Math.round((parse(checkOut).getTime() - parse(checkIn).getTime()) / MS_DAY)
      : 0
  const subtotal = nights * property.priceVnd
  const serviceFee = Math.round(subtotal * 0.05)
  const total = subtotal + serviceFee

  // Chọn ngày: lần 1 đặt nhận phòng; lần 2 đặt trả phòng (nếu hợp lệ & không vượt vùng chặn).
  const pick = (day: string) => {
    if (!checkIn || checkOut || day <= checkIn) {
      setCheckIn(day)
      setCheckOut(null)
      return
    }
    // kiểm tra không có ngày bị chặn giữa khoảng
    for (let t2 = parse(checkIn).getTime(); t2 < parse(day).getTime(); t2 += MS_DAY) {
      if (blocked.has(iso(new Date(t2)))) {
        setCheckIn(day)
        setCheckOut(null)
        return
      }
    }
    setCheckOut(day)
  }

  const canSubmit = isStay ? Boolean(checkIn && checkOut) : Boolean(viewingAt)

  const submit = async () => {
    setState('sending')
    const res = await bookingService.createBooking({
      propertyId: property.id,
      type: property.type,
      checkIn: isStay ? checkIn! : undefined,
      checkOut: isStay ? checkOut! : undefined,
      viewingAt: isStay ? undefined : new Date(viewingAt).toISOString(),
    })
    if (res.ok) setState('done')
    else {
      setErrMsg(res.error)
      setState('error')
    }
  }

  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-card p-5 shadow-luxury-lg md:p-6',
        className,
      )}
    >
      <div className="flex items-baseline gap-1.5">
        <span className="font-sans text-2xl font-bold tracking-[-0.02em] text-foreground">
          {formatCurrency(property.priceVnd)}
        </span>
        <span className="font-sans text-sm text-muted-foreground">
          {property.type === 'rent_long'
            ? t('common.perMonth')
            : isStay
              ? t('common.perNight')
              : ''}
        </span>
      </div>

      {isStay ? (
        <>
          <p className="mt-4 font-sans text-[0.8125rem] font-medium text-muted-foreground">
            {t('property.selectDates')}
          </p>
          <div className="mt-2 rounded-2xl border border-border p-3">
            <Calendar blocked={blocked} checkIn={checkIn} checkOut={checkOut} onPick={pick} />
          </div>
          <p className="mt-1.5 font-sans text-[0.6875rem] text-muted-foreground">
            {t('property.datesBooked')}
          </p>

          {nights > 0 && (
            <div className="mt-4 space-y-2 border-t border-border pt-4 font-sans text-[0.9375rem]">
              <Row label={`${formatCurrency(property.priceVnd)} × ${nights} ${t('property.nights')}`}>
                {formatCurrency(subtotal)}
              </Row>
              <Row label={t('property.serviceFee')}>{formatCurrency(serviceFee)}</Row>
              <div className="flex items-center justify-between border-t border-border pt-2 font-semibold text-foreground">
                <span>{t('property.total')}</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="mt-4">
          <label className="font-sans text-[0.8125rem] font-medium text-muted-foreground">
            {t('property.viewingAt')}
          </label>
          <input
            type="datetime-local"
            value={viewingAt}
            onChange={(e) => setViewingAt(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 font-sans text-sm text-foreground outline-none focus:ring-2 focus:ring-brand/30"
          />
        </div>
      )}

      <button
        type="button"
        disabled={!canSubmit}
        onClick={() => setState('confirm')}
        className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary font-sans text-[0.95rem] font-semibold text-primary-foreground transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <CalendarDays className="size-4" />
        {isStay ? t('property.reserveNow') : t('property.viewingBook')}
      </button>

      {/* Modal xác nhận / thanh toán in-app (glass, không rời trang) */}
      {state !== 'idle' && (
        <div
          className="fixed inset-0 z-[110] flex items-end justify-center bg-black/50 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          onClick={() => state !== 'sending' && setState('idle')}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-border bg-background p-6 shadow-luxury-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {state === 'done' ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <CheckCircle2 className="size-12 text-brand" />
                <p className="font-sans text-lg font-bold text-foreground">
                  {t('property.bookSuccess')}
                </p>
                <p className="font-sans text-sm text-muted-foreground">
                  {t('property.bookSuccessDesc')}
                </p>
                <button
                  type="button"
                  onClick={() => setState('idle')}
                  className="mt-2 rounded-full bg-primary px-6 py-2.5 font-sans text-sm font-semibold text-primary-foreground"
                >
                  OK
                </button>
              </div>
            ) : (
              <>
                <p className="font-sans text-lg font-bold text-foreground">
                  {isStay ? t('property.reserveNow') : t('property.viewingBook')}
                </p>
                <div className="mt-4 space-y-2 rounded-2xl bg-secondary/50 p-4 font-sans text-sm">
                  {isStay ? (
                    <>
                      <Row label={t('property.checkIn')}>{checkIn}</Row>
                      <Row label={t('property.checkOut')}>{checkOut}</Row>
                      <Row label={`${nights} ${t('property.nights')}`}>{formatCurrency(total)}</Row>
                    </>
                  ) : (
                    <Row label={t('property.viewingAt')}>
                      {viewingAt ? new Date(viewingAt).toLocaleString('vi-VN') : ''}
                    </Row>
                  )}
                </div>
                {state === 'error' && (
                  <p className="mt-3 font-sans text-sm text-red-600">{errMsg || t('property.bookError')}</p>
                )}
                <div className="mt-5 flex gap-2">
                  <button
                    type="button"
                    disabled={state === 'sending'}
                    onClick={() => setState('idle')}
                    className="flex-1 rounded-full border border-border py-2.5 font-sans text-sm font-medium text-foreground hover:bg-secondary disabled:opacity-50"
                  >
                    {t('locator.close')}
                  </button>
                  <button
                    type="button"
                    disabled={state === 'sending'}
                    onClick={submit}
                    className="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary py-2.5 font-sans text-sm font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-50"
                  >
                    {state === 'sending' && <Loader2 className="size-4 animate-spin" />}
                    {t('property.bookNow')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-muted-foreground">
      <span>{label}</span>
      <span className="font-medium text-foreground">{children}</span>
    </div>
  )
}
