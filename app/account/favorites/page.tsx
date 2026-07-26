'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Heart } from 'lucide-react'
import type { Property } from '@/types'
import { favoriteService } from '@/services/favoriteService'
import { getMasterplanTowers } from '@/services/propertyService'
import { useT } from '@/lib/i18n/provider'
import { StateWrapper, type ViewState } from '@/components/ui/state-wrapper'
import { PropertyCard } from '@/components/property/property-card'

export default function FavoritesPage() {
  const t = useT()
  const [state, setState] = useState<ViewState>('loading')
  const [items, setItems] = useState<Property[]>([])
  const [towerNames, setTowerNames] = useState<Record<string, string>>({})

  const load = () => {
    setState('loading')
    Promise.all([favoriteService.getFavorites(), getMasterplanTowers()])
      .then(([f, tw]) => {
        setItems(f.favorites)
        setTowerNames(Object.fromEntries(tw.map((x) => [x.id, x.name])))
        setState(f.favorites.length ? 'success' : 'empty')
      })
      .catch(() => setState('error'))
  }
  useEffect(load, [])

  const remove = async (id: string) => {
    const prev = items
    setItems((xs) => xs.filter((p) => p.id !== id))
    const ok = await favoriteService.removeFavorite(id)
    if (!ok) setItems(prev)
    else if (prev.length === 1) setState('empty')
  }

  return (
    <div>
      <h1 className="font-sans text-2xl font-bold tracking-[-0.02em] text-foreground">{t('account.favorites')}</h1>

      <StateWrapper
        state={state}
        className="mt-6"
        onRetry={load}
        emptyTitle={t('account.favEmpty')}
        emptyHint={t('account.favEmptyHint')}
        emptyIcon={<Heart className="size-7" aria-hidden="true" />}
        emptyAction={
          <Link
            href="/search"
            className="inline-flex rounded-full bg-primary px-5 py-2.5 font-sans text-sm font-semibold text-primary-foreground transition hover:brightness-110 active:scale-95"
          >
            {t('account.explore')}
          </Link>
        }
      >
        <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => (
            <PropertyCard
              key={p.id}
              property={p}
              towerName={towerNames[p.towerId]}
              favorite
              onToggleFavorite={remove}
            />
          ))}
        </div>
      </StateWrapper>

      {/* CTA khám phá thêm — chỉ hiện khi ĐÃ có mục yêu thích (rỗng thì CTA nằm trong empty state) */}
      {state === 'success' && (
        <Link
          href="/search"
          className="mt-8 inline-flex rounded-full bg-primary px-5 py-2.5 font-sans text-sm font-semibold text-primary-foreground transition hover:brightness-110 active:scale-95"
        >
          {t('account.explore')}
        </Link>
      )}
    </div>
  )
}
