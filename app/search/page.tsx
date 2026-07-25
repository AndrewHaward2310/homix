'use client'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, SlidersHorizontal, Map as MapIcon, List as ListIcon, X } from 'lucide-react'
import type { Property, PropertyType, Tower } from '@/types'
import { getMasterplanTowers, searchProperties, type SearchFilters } from '@/services/propertyService'
import { useLocale } from '@/lib/i18n/provider'
import { useFavorites } from '@/hooks/use-favorites'
import { GlassNavbar } from '@/components/luxury/glass-navbar'
import { Container } from '@/components/luxury/container'
import { StateWrapper, type ViewState } from '@/components/ui/state-wrapper'
import { PropertyGridSkeleton } from '@/components/ui/skeleton'
import { PropertyCard } from '@/components/property/property-card'
import { AdvancedFilters, type AdvancedValues } from '@/components/search/advanced-filters'
import { cn } from '@/lib/utils'

const SearchMap = dynamic(() => import('@/components/search/search-map').then((m) => m.SearchMap), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-secondary" />,
})

const TYPE_TABS: { value: PropertyType | 'all'; key: string }[] = [
  { value: 'all', key: 'search.tabAll' },
  { value: 'rent_long', key: 'search.tabRentLong' },
  { value: 'stay_short', key: 'search.tabStayShort' },
  { value: 'sale', key: 'search.tabBuy' },
]
const SORTS = ['relevant', 'top_rated', 'price_asc', 'price_desc', 'newest'] as const
const PAGE_SIZE = 9

/** Đọc số từ URL: bỏ rỗng/NaN/âm → undefined (không để NaN lọt xuống API gây 400). */
const numParam = (v: string | null): number | undefined => {
  if (v == null || v.trim() === '') return undefined
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 ? n : undefined
}

/** Trả (nhỏ, lớn) — hoán đổi nếu bị nhập ngược; giữ undefined nếu chỉ có một đầu. */
const orderPair = (a?: number, b?: number): [number | undefined, number | undefined] =>
  a != null && b != null && a > b ? [b, a] : [a, b]

function SearchInner() {
  const { t, locale } = useLocale()
  const router = useRouter()
  const sp = useSearchParams()
  const { isFavorite, toggle } = useFavorites()

  // Đọc filter từ URL
  const filters: SearchFilters = useMemo(() => {
    const type = sp.get('type')
    return {
      type: (type && type !== 'all' ? type : undefined) as PropertyType | undefined,
      // towerId: thanh tìm kiếm ở hero gửi lên — trước đây bị bỏ quên nên ô "khu vực"
      // không có tác dụng.
      towerId: sp.get('towerId') ?? undefined,
      q: sp.get('q') ?? undefined,
      minPrice: numParam(sp.get('minPrice')),
      maxPrice: numParam(sp.get('maxPrice')),
      minArea: numParam(sp.get('minArea')),
      maxArea: numParam(sp.get('maxArea')),
      beds: numParam(sp.get('beds')),
      baths: numParam(sp.get('baths')),
      amenities: sp.get('amenities') ? sp.get('amenities')!.split(',').filter(Boolean) : undefined,
      sort: (sp.get('sort') as SearchFilters['sort']) ?? 'relevant',
      page: sp.get('page') ? Number(sp.get('page')) : 1,
      pageSize: PAGE_SIZE,
    }
  }, [sp])

  const [state, setState] = useState<ViewState>('loading')
  const [items, setItems] = useState<Property[]>([])
  const [total, setTotal] = useState(0)
  const [towerNames, setTowerNames] = useState<Record<string, string>>({})
  const [towerCoords, setTowerCoords] = useState<Record<string, [number, number]>>({})
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [view, setView] = useState<'list' | 'map'>('list')
  const [qInput, setQInput] = useState(filters.q ?? '')
  const [advOpen, setAdvOpen] = useState(false)

  useEffect(() => {
    getMasterplanTowers().then((tw: Awaited<ReturnType<typeof getMasterplanTowers>>) => {
      setTowerNames(Object.fromEntries(tw.map((x) => [x.id, x.name])))
      setTowerCoords(Object.fromEntries(tw.map((x) => [x.id, x.lngLat])))
    })
  }, [])

  useEffect(() => {
    let active = true
    setState('loading')
    searchProperties(filters)
      .then((r) => {
        if (!active) return
        setItems(r.items)
        setTotal(r.total)
        setState(r.items.length ? 'success' : 'empty')
      })
      .catch(() => active && setState('error'))
    return () => {
      active = false
    }
  }, [filters])

  // Cập nhật 1 tham số URL (reset page khi đổi filter, giữ khi đổi page)
  const setParam = useCallback(
    (patch: Record<string, string | undefined>, resetPage = true) => {
      const next = new URLSearchParams(sp.toString())
      Object.entries(patch).forEach(([k, v]) => {
        if (v == null || v === '') next.delete(k)
        else next.set(k, v)
      })
      if (resetPage) next.delete('page')
      router.replace(`/search?${next.toString()}`, { scroll: false })
    },
    [router, sp],
  )

  const page = filters.page ?? 1
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const activeType = (sp.get('type') as PropertyType | 'all') ?? 'all'

  const activeChips: { label: string; clear: () => void }[] = []
  if (filters.q) activeChips.push({ label: `"${filters.q}"`, clear: () => setParam({ q: undefined }) })
  if (filters.beds)
    activeChips.push({ label: `≥ ${filters.beds} ${t('locator.bedroomsShort')}`, clear: () => setParam({ beds: undefined }) })
  if (filters.baths)
    activeChips.push({ label: `≥ ${filters.baths} ${t('search.bathsShort')}`, clear: () => setParam({ baths: undefined }) })
  if (filters.minPrice || filters.maxPrice)
    activeChips.push({ label: t('search.priceRange'), clear: () => setParam({ minPrice: undefined, maxPrice: undefined }) })
  if (filters.minArea || filters.maxArea)
    activeChips.push({ label: t('search.area'), clear: () => setParam({ minArea: undefined, maxArea: undefined }) })
  filters.amenities?.forEach((a) =>
    activeChips.push({
      label: t(`amenity.${a}`),
      clear: () =>
        setParam({ amenities: filters.amenities!.filter((x) => x !== a).join(',') || undefined }),
    }),
  )

  // Số bộ lọc nâng cao đang bật (để hiện badge trên nút).
  const advCount =
    (filters.minPrice || filters.maxPrice ? 1 : 0) +
    (filters.minArea || filters.maxArea ? 1 : 0) +
    (filters.baths ? 1 : 0) +
    (filters.amenities?.length ?? 0)

  const applyAdvanced = (v: AdvancedValues) => {
    // Hoán đổi nếu người dùng nhập min > max (thay vì trả kết quả rỗng khó hiểu).
    const [minPrice, maxPrice] = orderPair(v.minPrice, v.maxPrice)
    const [minArea, maxArea] = orderPair(v.minArea, v.maxArea)
    setParam({
      minPrice: minPrice != null ? String(minPrice) : undefined,
      maxPrice: maxPrice != null ? String(maxPrice) : undefined,
      minArea: minArea != null ? String(minArea) : undefined,
      maxArea: maxArea != null ? String(maxArea) : undefined,
      baths: v.baths != null ? String(v.baths) : undefined,
      amenities: v.amenities.length ? v.amenities.join(',') : undefined,
    })
    setAdvOpen(false)
  }

  return (
    <div className="min-h-screen bg-background">
      <GlassNavbar solid />

      <AdvancedFilters
        open={advOpen}
        onClose={() => setAdvOpen(false)}
        onApply={applyAdvanced}
        initial={{
          minPrice: filters.minPrice,
          maxPrice: filters.maxPrice,
          minArea: filters.minArea,
          maxArea: filters.maxArea,
          baths: filters.baths,
          amenities: filters.amenities ?? [],
        }}
      />

      {/* Filter bar sticky */}
      <div className="sticky top-[72px] z-30 border-b border-border bg-background/95 backdrop-blur-xl">
        <Container className="flex flex-wrap items-center gap-3 py-3">
          {/* Ô tìm */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              setParam({ q: qInput || undefined })
            }}
            className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-border bg-background px-4 py-2"
          >
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              value={qInput}
              onChange={(e) => setQInput(e.target.value)}
              placeholder={t('search.searchPlaceholder')}
              className="w-full bg-transparent font-sans text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </form>

          {/* Sort */}
          <select
            value={filters.sort}
            onChange={(e) => setParam({ sort: e.target.value })}
            className="rounded-full border border-border bg-background px-4 py-2 font-sans text-sm text-foreground outline-none"
          >
            {SORTS.map((s) => (
              <option key={s} value={s}>
                {t(`search.sort_${s}`)}
              </option>
            ))}
          </select>

          {/* Beds quick filter */}
          <select
            value={filters.beds ?? ''}
            onChange={(e) => setParam({ beds: e.target.value || undefined })}
            className="rounded-full border border-border bg-background px-4 py-2 font-sans text-sm text-foreground outline-none"
          >
            <option value="">{t('search.anyBeds')}</option>
            {[1, 2, 3, 4].map((n) => (
              <option key={n} value={n}>
                ≥ {n} {t('locator.bedroomsShort')}
              </option>
            ))}
          </select>

          {/* Bộ lọc nâng cao */}
          <button
            type="button"
            onClick={() => setAdvOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 font-sans text-sm font-medium text-foreground transition hover:bg-secondary"
          >
            <SlidersHorizontal className="size-4" />
            {t('search.filters')}
            {advCount > 0 && (
              <span className="ml-0.5 grid size-5 place-items-center rounded-full bg-primary font-sans text-[0.6875rem] font-bold text-primary-foreground tabular-nums">
                {advCount}
              </span>
            )}
          </button>

          {/* Toggle List/Map (mobile) */}
          <button
            type="button"
            onClick={() => setView((v) => (v === 'list' ? 'map' : 'list'))}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 font-sans text-sm font-medium text-foreground lg:hidden"
          >
            {view === 'list' ? <MapIcon className="size-4" /> : <ListIcon className="size-4" />}
            {view === 'list' ? t('search.showMap') : t('search.showList')}
          </button>
        </Container>

        {/* Type tabs + chips */}
        <Container className="flex flex-wrap items-center gap-2 pb-3">
          {TYPE_TABS.map((tab) => {
            const on = activeType === tab.value
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setParam({ type: tab.value === 'all' ? undefined : tab.value })}
                className={cn(
                  'rounded-full px-4 py-1.5 font-sans text-[0.8125rem] font-medium transition-colors',
                  on ? 'bg-primary text-primary-foreground' : 'border border-border text-foreground hover:bg-secondary',
                )}
              >
                {t(tab.key)}
              </button>
            )
          })}
          {activeChips.map((c, i) => (
            <button
              key={i}
              type="button"
              onClick={c.clear}
              className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 font-sans text-[0.8125rem] text-foreground"
            >
              {c.label}
              <X className="size-3.5" />
            </button>
          ))}
        </Container>
      </div>

      {/* 2 cột: list + map */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_44%]">
        {/* List */}
        <div className={cn('min-w-0', view === 'map' && 'hidden lg:block')}>
          <Container className="py-6">
            <p className="mb-5 font-sans text-sm text-muted-foreground">
              {state === 'loading' ? t('common.loading') : t('search.resultCount', { count: total })}
            </p>
            <StateWrapper
              state={state}
              emptyTitle={t('search.emptyTitle')}
              emptyHint={t('search.emptyHint')}
              errorTitle={t('search.errorTitle')}
              skeleton={
                <PropertyGridSkeleton
                  count={6}
                  className="sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3"
                />
              }
            >
              <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((p, i) => (
                  <PropertyCard
                    key={p.id}
                    property={p}
                    towerName={towerNames[p.towerId]}
                    favorite={isFavorite(p.id)}
                    onToggleFavorite={toggle}
                    onHover={setHoveredId}
                    active={hoveredId === p.id}
                    priority={i < 3}
                  />
                ))}
              </div>

              {/* Phân trang */}
              {totalPages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setParam({ page: String(page - 1) }, false)}
                    className="rounded-full border border-border px-4 py-2 font-sans text-sm disabled:opacity-40"
                  >
                    ‹
                  </button>
                  <span className="font-sans text-sm text-muted-foreground">
                    {page} / {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setParam({ page: String(page + 1) }, false)}
                    className="rounded-full border border-border px-4 py-2 font-sans text-sm disabled:opacity-40"
                  >
                    ›
                  </button>
                </div>
              )}
            </StateWrapper>
          </Container>
        </div>

        {/* Map */}
        <div
          className={cn(
            'sticky top-[132px] h-[calc(100vh-132px)] border-l border-border',
            view === 'list' && 'hidden lg:block',
          )}
        >
          <SearchMap
            properties={items}
            towerCoords={towerCoords}
            hoveredId={hoveredId}
            onHover={setHoveredId}
          />
        </div>
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <SearchInner />
    </Suspense>
  )
}
