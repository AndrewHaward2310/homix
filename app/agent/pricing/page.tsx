'use client'

import { useEffect, useMemo, useState } from 'react'
import { LineChart, Sparkles, TrendingUp } from 'lucide-react'
import type { Property, PropertyType, Tower } from '@/types'
import { pickLocale } from '@/types'
import { getProperties, getTowers } from '@/services/propertyService'
import { useLocale } from '@/lib/i18n/provider'
import { StateWrapper, type ViewState } from '@/components/ui/state-wrapper'

const TYPES: { value: PropertyType; labelKey: string }[] = [
  { value: 'sale', labelKey: 'search.tabBuy' },
  { value: 'rent_long', labelKey: 'search.tabRentLong' },
  { value: 'stay_short', labelKey: 'search.tabStayShort' },
]

/** Bách phân vị của mảng đã sort tăng dần (nội suy tuyến tính). */
function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const idx = (sorted.length - 1) * p
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  if (lo === hi) return sorted[lo]
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo)
}

const field =
  'w-full rounded-xl border border-border bg-background px-3.5 py-2.5 font-sans text-[0.9rem] text-foreground outline-none transition focus:ring-2 focus:ring-primary/30'

export default function AgentPricingPage() {
  const { locale, t, formatCurrency } = useLocale()
  const [items, setItems] = useState<Property[]>([])
  const [towers, setTowers] = useState<Tower[]>([])
  const [state, setState] = useState<ViewState>('loading')

  const [towerId, setTowerId] = useState('')
  const [type, setType] = useState<PropertyType>('sale')
  const [area, setArea] = useState('75')
  const [beds, setBeds] = useState<number | ''>('')

  const areaNum = Number(area)
  const validArea = Number.isFinite(areaNum) && areaNum > 0

  useEffect(() => {
    let active = true
    // Chỉ lấy tin ĐANG NIÊM YẾT (available) để định giá theo thị trường thật.
    Promise.all([getProperties({ status: 'available' }), getTowers()])
      .then(([ps, tw]) => {
        if (!active) return
        setItems(ps)
        setTowers(tw)
        setState('success')
      })
      .catch(() => active && setState('error'))
    return () => {
      active = false
    }
  }, [])

  // Căn so sánh: cùng loại giao dịch, (tùy chọn) cùng phân khu / số phòng ngủ, diện tích hợp lệ.
  const comps = useMemo(
    () =>
      items.filter(
        (p) =>
          p.type === type &&
          p.areaM2 > 0 &&
          (!towerId || p.towerId === towerId) &&
          (beds === '' || p.bedrooms === beds),
      ),
    [items, type, towerId, beds],
  )

  const estimate = useMemo(() => {
    if (!validArea) return null
    const perM2 = comps.map((p) => p.priceVnd / p.areaM2).sort((a, b) => a - b)
    if (perM2.length === 0) return null
    const median = percentile(perM2, 0.5)
    return {
      count: perM2.length,
      median,
      suggested: median * areaNum,
      low: percentile(perM2, 0.25) * areaNum,
      high: percentile(perM2, 0.75) * areaNum,
    }
  }, [comps, areaNum, validArea])

  const towerName = (id: string) => towers.find((tw) => tw.id === id)?.name ?? id

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-brand/10 text-brand">
          <LineChart className="size-5" />
        </span>
        <div>
          <h1 className="font-sans text-2xl font-bold tracking-[-0.02em] text-foreground">
            {t('agent.pricing.title')}
          </h1>
          <p className="font-sans text-[0.9rem] text-muted-foreground">{t('agent.pricing.subtitle')}</p>
        </div>
      </div>

      <StateWrapper state={state} className="mt-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
          {/* Bộ nhập */}
          <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
            <label className="block">
              <span className="mb-1.5 block font-sans text-[0.8125rem] font-medium text-muted-foreground">
                {t('agent.pricing.type')}
              </span>
              <select className={field} value={type} onChange={(e) => setType(e.target.value as PropertyType)}>
                {TYPES.map((x) => (
                  <option key={x.value} value={x.value}>
                    {t(x.labelKey)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block font-sans text-[0.8125rem] font-medium text-muted-foreground">
                {t('agent.pricing.tower')}
              </span>
              <select className={field} value={towerId} onChange={(e) => setTowerId(e.target.value)}>
                <option value="">{t('agent.pricing.anyTower')}</option>
                {towers.map((tw) => (
                  <option key={tw.id} value={tw.id}>
                    {tw.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block font-sans text-[0.8125rem] font-medium text-muted-foreground">
                {t('agent.pricing.area')}
              </span>
              <input
                type="number"
                min={10}
                max={1000}
                className={field}
                value={area}
                onChange={(e) => setArea(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block font-sans text-[0.8125rem] font-medium text-muted-foreground">
                {t('agent.pricing.beds')}
              </span>
              <select
                className={field}
                value={beds}
                onChange={(e) => setBeds(e.target.value === '' ? '' : Number(e.target.value))}
              >
                <option value="">{t('agent.pricing.anyBeds')}</option>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* Kết quả */}
          <div>
            {estimate ? (
              <>
                <div className="rounded-2xl border border-border bg-gradient-to-br from-brand/8 to-transparent p-6">
                  <div className="flex items-center gap-2 font-sans text-[0.8125rem] font-semibold uppercase tracking-[0.1em] text-brand">
                    <Sparkles className="size-4" /> {t('agent.pricing.estimate')}
                  </div>
                  <div className="mt-2 font-display text-[2.4rem] font-bold leading-none text-foreground">
                    {formatCurrency(estimate.suggested)}
                  </div>
                  <div className="mt-2 font-sans text-[0.9rem] text-muted-foreground">
                    {t('agent.pricing.range')}: {formatCurrency(estimate.low)} – {formatCurrency(estimate.high)}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-4 font-sans text-[0.8125rem]">
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <TrendingUp className="size-4 text-brand" />
                      {t('agent.pricing.perM2')}: <b className="text-foreground">{formatCurrency(estimate.median)}</b>
                    </span>
                    <span className="text-muted-foreground">
                      {t('agent.pricing.basis', { n: estimate.count })}
                    </span>
                  </div>
                </div>

                {/* Danh sách căn so sánh */}
                <h2 className="mt-6 font-sans text-sm font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                  {t('agent.pricing.compsTitle')} · {t('agent.pricing.comparables', { n: comps.length })}
                </h2>
                <ul className="mt-3 divide-y divide-border rounded-2xl border border-border bg-card">
                  {comps.slice(0, 8).map((p) => (
                    <li key={p.id} className="flex items-center gap-3 p-3.5">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-sans text-[0.9rem] font-medium text-foreground">
                          {pickLocale(p.title, locale)}
                        </p>
                        <p className="font-sans text-[0.75rem] text-muted-foreground">
                          {towerName(p.towerId)} · {p.areaM2}m² · {p.bedrooms}{t('agent.pricing.bedsShort')}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="font-sans text-[0.875rem] font-semibold text-foreground">
                          {formatCurrency(p.priceVnd)}
                        </div>
                        <div className="font-sans text-[0.75rem] text-muted-foreground">
                          {formatCurrency(p.priceVnd / p.areaM2)}/m²
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <div className="flex h-full min-h-56 items-center justify-center rounded-2xl border border-dashed border-border p-8 text-center">
                <p className="font-sans text-[0.9rem] text-muted-foreground">{t('agent.pricing.empty')}</p>
              </div>
            )}
          </div>
        </div>
      </StateWrapper>
    </div>
  )
}
