'use client'

import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import type { Property } from '@/types'
import { getProperties, getMasterplanTowers } from '@/services/propertyService'
import { useAuth } from '@/components/auth/auth-context'
import { useT } from '@/lib/i18n/provider'
import { StateWrapper, type ViewState } from '@/components/ui/state-wrapper'
import { PropertyCard } from '@/components/property/property-card'
import { ManageImagesButton } from '@/components/property/manage-images-button'

export default function HostPropertiesPage() {
  const { user } = useAuth()
  const t = useT()
  const [state, setState] = useState<ViewState>('loading')
  const [items, setItems] = useState<Property[]>([])
  const [towerNames, setTowerNames] = useState<Record<string, string>>({})

  useEffect(() => {
    Promise.all([getProperties({ hostId: user?.id }), getMasterplanTowers()])
      .then(([ps, tw]) => {
        setItems(ps)
        setTowerNames(Object.fromEntries(tw.map((x) => [x.id, x.name])))
        setState(ps.length ? 'success' : 'empty')
      })
      .catch(() => setState('error'))
  }, [user])

  return (
    <div className="mx-auto max-w-7xl">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-sans text-2xl font-bold tracking-[-0.02em] text-foreground">{t('host.properties')}</h1>
        <button
          type="button"
          onClick={() => alert('Đăng tin siêu tốc — sắp ra mắt (mock).')}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 font-sans text-sm font-semibold text-primary-foreground transition hover:brightness-110"
        >
          <Plus className="size-4" /> Đăng tin siêu tốc
        </button>
      </div>

      <StateWrapper state={state} className="mt-6" emptyTitle="Chưa có tài sản nào">
        <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => (
            <div key={p.id} className="flex flex-col gap-3">
              <PropertyCard property={p} towerName={towerNames[p.towerId]} />
              <ManageImagesButton
                property={p}
                className="self-start"
                onUpdated={(images) =>
                  setItems((xs) => xs.map((x) => (x.id === p.id ? { ...x, images } : x)))
                }
              />
            </div>
          ))}
        </div>
      </StateWrapper>
    </div>
  )
}
