'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { getIntlLocale } from '@/lib/i18n/config'
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  CheckCircle2,
  Loader2,
  CreditCard,
  Wallet,
  Landmark,
  Store,
  ShieldCheck,
  FileText,
} from 'lucide-react'
import type { AvailabilityRange, Perk, Property } from '@/types'
import { pickLocale } from '@/types'
import { useLocale } from '@/lib/i18n/provider'
import { bookingService } from '@/services/bookingService'
import { getPerks } from '@/services/perkService'
import { getDiscountTiers } from '@/services/comboService'
import { priceCombo, dedupePerks, type DiscountTier } from '@/lib/combo-pricing'
import { cn } from '@/lib/utils'

const MS_DAY = 86_400_000
const iso = (d: Date) => d.toISOString().slice(0, 10)
const parse = (s: string) => new Date(s + 'T00:00:00')

// Phương thức thanh toán (DEMO — không trừ tiền thật). Icon + key i18n pay.<id>.
type PayMethod = 'card' | 'ewallet' | 'transfer' | 'onsite'
const PAY_METHODS: { id: PayMethod; icon: typeof CreditCard }[] = [
  { id: 'card', icon: CreditCard },
  { id: 'ewallet', icon: Wallet },
  { id: 'transfer', icon: Landmark },
  { id: 'onsite', icon: Store },
]

/** Mã đơn ngắn gọn để hiện trên hoá đơn (không lộ id dài của DB). */
const shortCode = (id: string) => `DMX-${id.slice(-6).toUpperCase()}`

/** Chuỗi datetime-local (giờ ĐỊA PHƯƠNG) cho thuộc tính min — chặn chọn quá khứ. */
function minViewingAt() {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

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
  const { t, locale, formatCurrency } = useLocale()
  const sp = useSearchParams()
  const blocked = useBlocked(blockedRanges)
  const isStay = property.type === 'stay_short'

  const [checkIn, setCheckIn] = useState<string | null>(null)
  const [checkOut, setCheckOut] = useState<string | null>(null)
  const [viewingAt, setViewingAt] = useState('')
  const [state, setState] = useState<
    'idle' | 'confirm' | 'payment' | 'sending' | 'done' | 'error'
  >('idle')
  const [errMsg, setErrMsg] = useState('')
  const [payMethod, setPayMethod] = useState<PayMethod>('card')
  const [bookingCode, setBookingCode] = useState('')
  const [bookedTotal, setBookedTotal] = useState<number | null>(null) // tổng SERVER chốt
  const submitLock = useRef(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  // Danh mục trải nghiệm + bậc giảm giá — để hiện bảng kê combo và xem trước tổng.
  const [perkList, setPerkList] = useState<Perk[]>([])
  const [tiers, setTiers] = useState<DiscountTier[]>([])
  // Trạng thái nạp combo: chặn đặt khi URL có ?perks mà dữ liệu chưa sẵn sàng —
  // nếu không, khách bấm đặt sớm sẽ âm thầm đặt phòng-không-combo.
  const hasComboParam = isStay && Boolean(sp.get('perks'))
  const [comboState, setComboState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [comboReload, setComboReload] = useState(0)

  useEffect(() => {
    if (!hasComboParam) {
      setComboState('idle')
      return
    }
    let active = true
    setComboState('loading')
    // Nạp cùng lúc: nếu perk có mà bậc giảm giá chưa có, xem trước sẽ hiện thiếu giảm giá.
    Promise.all([getPerks(), getDiscountTiers()])
      .then(([rows, tierRows]) => {
        if (!active) return
        setPerkList(rows)
        setTiers(tierRows)
        setComboState('ready')
      })
      .catch(() => active && setComboState('error'))
    return () => {
      active = false
    }
  }, [hasComboParam, comboReload])

  const nights =
    checkIn && checkOut
      ? Math.round((parse(checkOut).getTime() - parse(checkIn).getTime()) / MS_DAY)
      : 0
  const subtotal = nights * property.priceVnd

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

  // --- Combo đi kèm: trình tự thiết kế combo truyền qua URL ?perks=pk_x:1,pk_y:2 ---
  // Gộp theo perkId (URL sửa tay có thể lặp id) — nếu không, một perk lặp 3 lần
  // sẽ bị đếm thành 3 loại và tự "leo" lên bậc giảm giá cao hơn.
  const comboPerks = useMemo(() => {
    const raw = sp.get('perks')
    if (!raw) return [] as { perkId: string; qty: number }[]
    return dedupePerks(
      raw.split(',').map((part) => {
        const [id, q] = part.split(':')
        return { perkId: id ?? '', qty: Number(q) }
      }),
    )
  }, [sp])

  const chosenPerks = useMemo(
    () =>
      comboPerks
        .map((c) => {
          const perk = perkList.find((p) => p.id === c.perkId)
          return perk ? { perk, qty: c.qty } : null
        })
        .filter((x): x is { perk: Perk; qty: number } => x !== null),
    [comboPerks, perkList],
  )

  // Xem trước tổng tiền — DÙNG CHUNG công thức với server (priceCombo)
  const preview = useMemo(
    () =>
      isStay && nights > 0
        ? priceCombo({
            pricePerNightVnd: property.priceVnd,
            nights,
            perks: chosenPerks.map((c) => ({ priceVnd: c.perk.priceVnd, qty: c.qty })),
            tiers,
          })
        : null,
    [isStay, nights, property.priceVnd, chosenPerks, tiers],
  )

  const comboPending = hasComboParam && comboState !== 'ready'
  const canSubmit =
    (isStay ? Boolean(checkIn && checkOut) : Boolean(viewingAt)) && !comboPending

  const submit = async () => {
    // Khoá đồng bộ: chặn double-click tạo 2 booking trước khi 'sending' render.
    if (submitLock.current) return
    submitLock.current = true
    setState('sending')
    try {
      const res = await bookingService.createBooking({
        propertyId: property.id,
        type: property.type,
        checkIn: isStay ? checkIn! : undefined,
        checkOut: isStay ? checkOut! : undefined,
        viewingAt: isStay ? undefined : new Date(viewingAt).toISOString(),
        // Nguồn sự thật là URL (comboPerks), không phải catalog đã fetch — server tự
        // tra giá từ DB. Tránh mất combo nếu catalog chưa tải xong.
        perks: isStay && comboPerks.length ? comboPerks : undefined,
      })
      if (res.ok) {
        setBookingCode(shortCode(res.booking.id))
        setBookedTotal(res.booking.totalVnd) // hoá đơn dùng tổng SERVER chốt
        setState('done')
      } else {
        setErrMsg(res.error)
        setState('error')
      }
    } finally {
      submitLock.current = false
    }
  }

  // Đóng checkout: reset SẠCH state phiên để lần sau không lộ dữ liệu cũ.
  const closeCheckout = () => {
    setState('idle')
    setErrMsg('')
    setBookingCode('')
    setBookedTotal(null)
    setPayMethod('card')
  }

  // A11y modal: khoá cuộn nền, focus vào dialog, Escape đóng (trừ khi đang gửi),
  // và trap Tab trong dialog — đồng bộ chuẩn với các modal khác của repo.
  const modalOpen = state !== 'idle'
  useEffect(() => {
    if (!modalOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && state !== 'sending') {
        e.preventDefault()
        closeCheckout()
        return
      }
      if (e.key !== 'Tab') return
      const nodes = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      if (!nodes || nodes.length === 0) return
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalOpen, state])

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
              {chosenPerks.map(({ perk, qty }) => (
                <Row
                  key={perk.id}
                  label={`${pickLocale(perk.name, locale)}${qty > 1 ? ` ×${qty}` : ''}`}
                >
                  {formatCurrency(perk.priceVnd * qty)}
                </Row>
              ))}
              {preview && preview.savingsVnd > 0 && (
                <Row label={t('builder.savePct', { pct: preview.savingsPct })}>
                  <span className="text-brand">−{formatCurrency(preview.savingsVnd)}</span>
                </Row>
              )}
              <div className="flex items-center justify-between border-t border-border pt-2 font-semibold text-foreground">
                <span>{t('property.total')}</span>
                <span>{formatCurrency(preview ? preview.packagePriceVnd : subtotal)}</span>
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
            min={minViewingAt()}
            onChange={(e) => setViewingAt(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-border bg-background px-3 py-2.5 font-sans text-sm text-foreground outline-none focus:ring-2 focus:ring-brand/30"
          />
          <p className="mt-1.5 font-sans text-[0.75rem] text-muted-foreground">{t('property.viewingHint')}</p>
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

      {/* Combo kèm theo chưa nạp xong → nói rõ vì sao chưa đặt được, không im lặng */}
      {comboPending && (
        <p
          className="mt-2 text-center font-sans text-[0.8125rem] text-muted-foreground"
          role="status"
        >
          {comboState === 'error' ? (
            <>
              {t('property.comboLoadError')}{' '}
              <button
                type="button"
                onClick={() => setComboReload((n) => n + 1)}
                className="font-semibold text-brand underline underline-offset-2"
              >
                {t('locator.retry')}
              </button>
            </>
          ) : (
            t('property.comboLoading')
          )}
        </p>
      )}

      {/* Checkout in-app nhiều bước: xác nhận → (thanh toán, chỉ lưu trú) → hoá đơn */}
      {state !== 'idle' && (
        <div
          className="fixed inset-0 z-[110] flex items-end justify-center bg-black/50 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label={isStay ? t('property.reserveNow') : t('property.viewingBook')}
          onClick={() => state !== 'sending' && closeCheckout()}
        >
          <div
            ref={dialogRef}
            tabIndex={-1}
            className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-background p-6 shadow-luxury-lg outline-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ---------- HOÁ ĐƠN (done) ---------- */}
            {state === 'done' ? (
              <div>
                <div className="flex flex-col items-center gap-2 text-center">
                  <CheckCircle2 className="size-12 text-emerald-500" />
                  <p className="font-sans text-lg font-bold text-foreground">
                    {t('property.bookSuccess')}
                  </p>
                  {/* Trung thực: bản demo KHÔNG gửi email/SMS thật */}
                  <p className="font-sans text-[0.8125rem] text-muted-foreground">
                    {t('checkout.sentConfirm')}
                  </p>
                  <p className="font-sans text-[0.6875rem] text-muted-foreground/80">
                    {t('checkout.demoNote')}
                  </p>
                </div>

                {/* Hoá đơn điện tử */}
                <div className="mt-4 rounded-2xl border border-border bg-secondary/30 p-4">
                  <div className="flex items-center justify-between border-b border-dashed border-border pb-3">
                    <span className="inline-flex items-center gap-1.5 font-sans text-[0.8125rem] font-bold text-foreground">
                      <FileText className="size-4 text-brand" /> {t('checkout.invoice')}
                    </span>
                    <span className="font-mono text-[0.8125rem] font-semibold text-brand">{bookingCode}</span>
                  </div>
                  <div className="mt-3 space-y-2 font-sans text-[0.8125rem]">
                    <Row label={t('checkout.property')}>
                      <span className="line-clamp-1 max-w-[12rem] text-right">
                        {pickLocale(property.title, locale)}
                      </span>
                    </Row>
                    {isStay ? (
                      <>
                        <Row label={t('property.checkIn')}>{checkIn}</Row>
                        <Row label={t('property.checkOut')}>{checkOut}</Row>
                        <Row label={t('checkout.payMethod')}>{t(`pay.${payMethod}`)}</Row>
                        <div className="flex items-center justify-between border-t border-border pt-2 font-semibold text-foreground">
                          <span>{t('property.total')}</span>
                          <span>{formatCurrency(bookedTotal ?? (preview ? preview.packagePriceVnd : subtotal))}</span>
                        </div>
                      </>
                    ) : (
                      <Row label={t('property.viewingAt')}>
                        {viewingAt ? new Date(viewingAt).toLocaleString(getIntlLocale(locale)) : ''}
                      </Row>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeCheckout}
                  className="mt-5 w-full rounded-full bg-primary py-2.5 font-sans text-sm font-semibold text-primary-foreground hover:brightness-110"
                >
                  {t('checkout.done')}
                </button>
              </div>
            ) : isStay && (state === 'payment' || state === 'sending' || state === 'error') ? (
              /* ---------- CHỌN PHƯƠNG THỨC THANH TOÁN (chỉ lưu trú) ---------- */
              <div>
                <button
                  type="button"
                  onClick={() => setState('confirm')}
                  className="inline-flex items-center gap-1.5 font-sans text-[0.8125rem] font-medium text-muted-foreground transition hover:text-foreground"
                >
                  <ChevronLeft className="size-4" /> {t('checkout.back')}
                </button>
                <p className="mt-2 font-sans text-lg font-bold text-foreground">{t('checkout.choosePay')}</p>
                <p className="font-sans text-[0.75rem] text-muted-foreground">{t('checkout.demoNote')}</p>

                <div className="mt-4 space-y-2">
                  {PAY_METHODS.map(({ id, icon: Icon }) => {
                    const on = payMethod === id
                    return (
                      <button
                        key={id}
                        type="button"
                        aria-pressed={on}
                        onClick={() => setPayMethod(id)}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-xl border p-3 text-left transition',
                          on ? 'border-brand bg-brand/5 ring-2 ring-brand/20' : 'border-border hover:border-brand/40',
                        )}
                      >
                        <Icon className={cn('size-5 shrink-0', on ? 'text-brand' : 'text-muted-foreground')} />
                        <span className="flex-1 font-sans text-[0.9rem] font-semibold text-foreground">
                          {t(`pay.${id}`)}
                        </span>
                        <span
                          className={cn(
                            'grid size-5 place-items-center rounded-full border-2',
                            on ? 'border-brand bg-brand text-brand-foreground' : 'border-border',
                          )}
                        >
                          {on && <CheckCircle2 className="size-4" />}
                        </span>
                      </button>
                    )
                  })}
                </div>

                <div className="mt-4 flex items-center justify-between rounded-xl bg-secondary/50 p-3 font-sans">
                  <span className="text-[0.8125rem] text-muted-foreground">{t('property.total')}</span>
                  <span className="text-[1.05rem] font-bold text-foreground">
                    {formatCurrency(preview ? preview.packagePriceVnd : subtotal)}
                  </span>
                </div>

                {state === 'error' && (
                  <p className="mt-3 font-sans text-sm text-red-600">{errMsg || t('property.bookError')}</p>
                )}
                <button
                  type="button"
                  disabled={state === 'sending'}
                  onClick={submit}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-2.5 font-sans text-sm font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-50"
                >
                  {state === 'sending' && <Loader2 className="size-4 animate-spin" />}
                  {t('checkout.payNow')}
                </button>
              </div>
            ) : (
              /* ---------- XÁC NHẬN + CHÍNH SÁCH HUỶ ---------- */
              <>
                <p className="font-sans text-lg font-bold text-foreground">
                  {isStay ? t('property.reserveNow') : t('property.viewingBook')}
                </p>
                <div className="mt-4 space-y-2 rounded-2xl bg-secondary/50 p-4 font-sans text-sm">
                  {isStay ? (
                    <>
                      <Row label={t('property.checkIn')}>{checkIn}</Row>
                      <Row label={t('property.checkOut')}>{checkOut}</Row>
                      <Row label={`${nights} ${t('property.nights')}`}>{formatCurrency(preview ? preview.packagePriceVnd : subtotal)}</Row>
                    </>
                  ) : (
                    <Row label={t('property.viewingAt')}>
                      {viewingAt ? new Date(viewingAt).toLocaleString(getIntlLocale(locale)) : ''}
                    </Row>
                  )}
                </div>

                {/* Chính sách huỷ theo loại hình */}
                <div className="mt-3 flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <p className="font-sans text-[0.8125rem] text-foreground">
                    {isStay ? t('checkout.policyStay') : t('checkout.policyViewing')}
                  </p>
                </div>

                {state === 'error' && (
                  <p className="mt-3 font-sans text-sm text-red-600">{errMsg || t('property.bookError')}</p>
                )}
                <div className="mt-5 flex gap-2">
                  <button
                    type="button"
                    disabled={(state as string) === 'sending'}
                    onClick={closeCheckout}
                    className="flex-1 rounded-full border border-border py-2.5 font-sans text-sm font-medium text-foreground hover:bg-secondary disabled:opacity-50"
                  >
                    {t('locator.close')}
                  </button>
                  <button
                    type="button"
                    disabled={(state as string) === 'sending'}
                    onClick={() => (isStay ? setState('payment') : submit())}
                    className="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary py-2.5 font-sans text-sm font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-50"
                  >
                    {(state as string) === 'sending' && <Loader2 className="size-4 animate-spin" />}
                    {isStay ? t('checkout.continue') : t('property.bookNow')}
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
