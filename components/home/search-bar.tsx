'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, MapPin, CalendarDays, Users, Wallet } from 'lucide-react'
import type { PropertyType, Tower } from '@/types'
import { getTowers } from '@/services/propertyService'
import { useT } from '@/lib/i18n/provider'
import { cn } from '@/lib/utils'

// Khoảng giá gợi ý (VND) cho 3 mức ở dropdown.
const PRICE_BANDS: Record<string, { minPrice?: number; maxPrice?: number }> = {
  a: { maxPrice: 3_000_000_000 },
  b: { minPrice: 3_000_000_000, maxPrice: 6_000_000_000 },
  c: { minPrice: 6_000_000_000 },
}

const TABS: { type: PropertyType; labelKey: string }[] = [
  { type: 'rent_long', labelKey: 'search.tabRentLong' },
  { type: 'stay_short', labelKey: 'search.tabStayShort' },
  { type: 'sale', labelKey: 'search.tabBuy' },
]

const fieldControl =
  'w-full bg-transparent font-sans text-[0.95rem] font-medium text-foreground outline-none placeholder:text-muted-foreground/70'

/** Ô nhập: icon + nhãn nhỏ + control, trong 1 segment của thanh search. */
function Field({
  icon: Icon,
  label,
  children,
  className,
}: {
  icon: typeof MapPin
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <label
      className={cn(
        'group flex min-w-0 items-center gap-3 rounded-full px-5 py-3.5 transition-colors hover:bg-secondary/60',
        className,
      )}
    >
      <Icon className="size-[1.15rem] shrink-0 text-muted-foreground transition-colors group-hover:text-brand" aria-hidden="true" />
      <span className="flex min-w-0 flex-col gap-0.5 text-left">
        <span className="font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </span>
        {children}
      </span>
    </label>
  )
}

const Divider = () => (
  <span className="hidden h-9 w-px shrink-0 bg-border md:block" aria-hidden="true" />
)

/**
 * SearchBar — thanh tìm kiếm trắng đặc, nổi trên ảnh hero, 3 tab.
 * Frontend-only: mô phỏng luồng tìm kiếm.
 * TODO: nối API tìm kiếm backend (GET /api/properties?type=&tower=&...).
 */
export function SearchBar() {
  const t = useT()
  const router = useRouter()
  const [active, setActive] = useState<PropertyType>('rent_long')
  const [towers, setTowers] = useState<Tower[]>([])
  const isStay = active === 'stay_short'

  useEffect(() => {
    let on = true
    getTowers()
      .then((data) => on && setTowers(data))
      .catch(() => on && setTowers([]))
    return () => {
      on = false
    }
  }, [])

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const params = new URLSearchParams({ type: active })
    const towerId = String(fd.get('towerId') ?? '')
    if (towerId) params.set('towerId', towerId)
    const band = PRICE_BANDS[String(fd.get('price') ?? '')]
    if (band?.minPrice) params.set('minPrice', String(band.minPrice))
    if (band?.maxPrice) params.set('maxPrice', String(band.maxPrice))
    router.push(`/search?${params.toString()}`)
  }

  return (
    <div className="mx-auto w-full max-w-4xl">
      {/* Tabs — pill trên nền ảnh tối, canh giữa */}
      <div className="mb-4 flex justify-center gap-2" role="tablist" aria-label={t('search.submit')}>
        {TABS.map((tab) => {
          const selected = active === tab.type
          return (
            <button
              key={tab.type}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActive(tab.type)}
              className={cn(
                'rounded-full px-6 py-2.5 font-sans text-[0.9rem] font-medium backdrop-blur-md transition-all duration-300 active:scale-[0.97]',
                selected
                  ? 'bg-background text-foreground shadow-luxury'
                  : 'border border-white/30 bg-white/15 text-white hover:bg-white/25',
              )}
            >
              {t(tab.labelKey)}
            </button>
          )
        })}
      </div>

      {/* Thanh search trắng đặc */}
      <form
        onSubmit={handleSearch}
        className="flex flex-col gap-1 rounded-3xl bg-background p-2 shadow-luxury-lg ring-1 ring-black/5 transition-all duration-300 focus-within:ring-2 focus-within:ring-primary/30 hover:-translate-y-0.5 hover:shadow-[0_54px_130px_-30px_rgba(29,29,31,0.32)] md:flex-row md:items-center md:gap-0 md:rounded-full md:p-2 md:pl-3"
      >
        <Field icon={MapPin} label={t('search.location')} className="md:flex-[1.5]">
          <select name="towerId" className={fieldControl} defaultValue="">
            <option value="" disabled>
              {t('search.locationPlaceholder')}
            </option>
            {towers.map((tw) => (
              <option key={tw.id} value={tw.id}>
                {tw.name}
              </option>
            ))}
          </select>
        </Field>

        {isStay ? (
          <>
            <Divider />
            <Field icon={CalendarDays} label={t('search.checkIn')} className="md:flex-1">
              <input type="date" className={fieldControl} />
            </Field>
            <Divider />
            <Field icon={CalendarDays} label={t('search.checkOut')} className="md:flex-1">
              <input type="date" className={fieldControl} />
            </Field>
            <Divider />
            <Field icon={Users} label={t('search.guests')} className="md:flex-[0.8]">
              <select className={fieldControl} defaultValue="2">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </Field>
          </>
        ) : (
          <>
            <Divider />
            <Field icon={Wallet} label={t('search.priceRange')} className="md:flex-1">
              <select name="price" className={fieldControl} defaultValue="">
                <option value="">{t('search.pricePlaceholder')}</option>
                <option value="a">{'< 3 tỷ'}</option>
                <option value="b">{'3 - 6 tỷ'}</option>
                <option value="c">{'> 6 tỷ'}</option>
              </select>
            </Field>
          </>
        )}

        {/* Nút tìm kiếm */}
        <button
          type="submit"
          className="group mt-1 inline-flex h-14 shrink-0 items-center justify-center gap-2 rounded-full bg-[linear-gradient(180deg,color-mix(in_srgb,var(--primary)_84%,white),var(--primary))] px-7 font-sans text-[1rem] font-medium text-primary-foreground shadow-[0_10px_28px_-10px_rgba(11,92,99,0.65)] ring-1 ring-inset ring-white/15 transition-all duration-300 hover:brightness-110 hover:shadow-[0_14px_36px_-8px_rgba(11,92,99,0.7)] active:scale-[0.98] md:mt-0 md:h-14 md:w-14 md:px-0 lg:w-auto lg:px-8"
        >
          <Search
            className="size-5 transition-transform duration-300 group-hover:scale-110"
            aria-hidden="true"
          />
          <span className="md:hidden lg:inline">{t('search.submit')}</span>
        </button>
      </form>
    </div>
  )
}
