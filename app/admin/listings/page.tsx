'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { BadgeCheck, Clock } from 'lucide-react'
import type { Property } from '@/types'
import { pickLocale } from '@/types'
import { searchProperties } from '@/services/propertyService'
import { adminService } from '@/services/adminService'
import { useLocale } from '@/lib/i18n/provider'
import { StateWrapper, type ViewState } from '@/components/ui/state-wrapper'
import { cn } from '@/lib/utils'

export default function AdminListingsPage() {
  const { t, locale, formatCurrency } = useLocale()
  const [state, setState] = useState<ViewState>('loading')
  const [items, setItems] = useState<Property[]>([])

  const load = () => {
    setState('loading')
    searchProperties({ pageSize: 48 })
      .then((r) => {
        setItems(r.items)
        setState('success')
      })
      .catch(() => setState('error'))
  }
  useEffect(load, [])

  const setVerified = async (id: string, verified: boolean) => {
    const prev = items
    setItems((xs) => xs.map((p) => (p.id === id ? { ...p, verified } : p)))
    const ok = await adminService.setListingVerified(id, verified)
    if (!ok) setItems(prev)
  }

  // Chưa duyệt lên đầu.
  const sorted = [...items].sort((a, b) => Number(a.verified) - Number(b.verified))

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="font-sans text-2xl font-bold tracking-[-0.02em] text-foreground">{t('admin.listings')}</h1>

      <StateWrapper state={state} className="mt-6" onRetry={load}>
        <div className="space-y-3">
          {sorted.map((p) => (
            <div key={p.id} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-3">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-secondary">
                {p.images[0] && <Image src={p.images[0]} alt="" fill sizes="64px" className="object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-sans text-[0.95rem] font-semibold text-foreground">{pickLocale(p.title, locale)}</p>
                <p className="font-sans text-[0.8125rem] text-muted-foreground">
                  {p.code} · {formatCurrency(p.priceVnd)}
                </p>
              </div>
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-sans text-[0.6875rem] font-semibold',
                  p.verified ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
                )}
              >
                {p.verified ? <BadgeCheck className="size-3.5" /> : <Clock className="size-3.5" />}
                {p.verified ? t('admin.verified') : t('admin.pending')}
              </span>
              <button
                type="button"
                onClick={() => setVerified(p.id, !p.verified)}
                className={cn(
                  'shrink-0 rounded-full px-4 py-1.5 font-sans text-[0.8125rem] font-semibold transition',
                  p.verified
                    ? 'border border-border text-foreground hover:bg-secondary'
                    : 'bg-primary text-primary-foreground hover:brightness-110',
                )}
              >
                {p.verified ? t('admin.unverify') : t('admin.verify')}
              </button>
            </div>
          ))}
        </div>
      </StateWrapper>
    </div>
  )
}
