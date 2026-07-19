'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Sparkles, Phone, ArrowRight, BedDouble } from 'lucide-react'
import type { Lead, LeadStage, Property } from '@/types'
import { pickLocale } from '@/types'
import { getLeads } from '@/services/leadService'
import { searchProperties, getTowers } from '@/services/propertyService'
import { useLocale } from '@/lib/i18n/provider'
import { StateWrapper, type ViewState } from '@/components/ui/state-wrapper'
import { cn } from '@/lib/utils'

const STAGE_STYLE: Record<LeadStage, string> = {
  new: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  consulting: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  closed: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
}

export default function AgentMatchPage() {
  const { locale, t, formatCurrency } = useLocale()
  const [leads, setLeads] = useState<Lead[]>([])
  const [propById, setPropById] = useState<Map<string, Property>>(new Map())
  const [towerName, setTowerName] = useState<Record<string, string>>({})
  const [state, setState] = useState<ViewState>('loading')

  const load = useCallback(() => {
    setState('loading')
    // searchProperties(pageSize 48): tránh page mặc định (12) làm thiếu căn khi join.
    Promise.all([getLeads(), searchProperties({ pageSize: 48 }), getTowers()])
      .then(([ls, res, tw]) => {
        setLeads(ls)
        setPropById(new Map(res.items.map((p) => [p.id, p])))
        setTowerName(Object.fromEntries(tw.map((x) => [x.id, x.name])))
        setState(ls.length ? 'success' : 'empty')
      })
      .catch(() => setState('error'))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // Ưu tiên khách chưa chốt (mới → tư vấn → đã chốt).
  const ordered = useMemo(() => {
    const rank: Record<LeadStage, number> = { new: 0, consulting: 1, closed: 2 }
    return [...leads].sort((a, b) => rank[a.stage] - rank[b.stage])
  }, [leads])

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-brand/10 text-brand">
          <Sparkles className="size-5" />
        </span>
        <div>
          <h1 className="font-sans text-2xl font-bold tracking-[-0.02em] text-foreground">
            {t('agent.match.title')}
          </h1>
          <p className="font-sans text-[0.9rem] text-muted-foreground">{t('agent.match.subtitle')}</p>
        </div>
      </div>

      <StateWrapper
        state={state}
        className="mt-8"
        emptyTitle={t('agent.match.empty')}
        onRetry={load}
        retryLabel={t('locator.retry')}
      >
        <div className="space-y-5">
          {ordered.map((lead) => {
            // Chỉ gợi ý căn ĐANG NIÊM YẾT (bỏ căn đã giữ chỗ/không còn bán).
            const matches = lead.matchedPropertyIds
              .map((id) => propById.get(id))
              .filter((p): p is Property => p != null && p.status === 'available')
            return (
              <div key={lead.id} className="rounded-2xl border border-border bg-card p-5">
                {/* Khách */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="font-sans text-[1.05rem] font-semibold text-foreground">
                        {lead.customerName}
                      </h2>
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 font-sans text-[0.6875rem] font-semibold',
                          STAGE_STYLE[lead.stage],
                        )}
                      >
                        {t(`agent.stage.${lead.stage}`)}
                      </span>
                    </div>
                    <p className="mt-1 font-sans text-[0.875rem] text-muted-foreground">
                      <span className="font-medium text-foreground">{t('agent.match.need')}:</span>{' '}
                      {lead.needSummary}
                    </p>
                  </div>
                  <a
                    href={`${lead.contact.includes('@') ? 'mailto:' : 'tel:'}${lead.contact}`}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 font-sans text-[0.8125rem] font-semibold text-foreground transition hover:bg-secondary"
                  >
                    <Phone className="size-3.5" /> {t('agent.match.contact')}
                  </a>
                </div>

                {/* Căn gợi ý */}
                <div className="mt-4 border-t border-border pt-4">
                  <h3 className="font-sans text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                    {t('agent.match.matched')} · {matches.length}
                  </h3>
                  {matches.length === 0 ? (
                    <p className="mt-2 font-sans text-[0.8125rem] text-muted-foreground">
                      {t('agent.match.noMatch')}
                    </p>
                  ) : (
                    <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {matches.map((p) => (
                        <li key={p.id}>
                          <Link
                            href={`/property/${p.id}`}
                            className="group flex items-center gap-3 rounded-xl border border-border p-3 transition hover:shadow-luxury"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="line-clamp-2 font-sans text-[0.9rem] font-semibold leading-snug text-foreground">
                                {pickLocale(p.title, locale)}
                              </p>
                              <p className="mt-0.5 flex items-center gap-1 font-sans text-[0.75rem] text-muted-foreground">
                                <BedDouble className="size-3.5" />
                                {towerName[p.towerId] ?? p.towerId} · {p.areaM2}m² · {p.bedrooms}
                                {t('agent.pricing.bedsShort')}
                              </p>
                              <p className="mt-0.5 font-sans text-[0.8125rem] font-semibold text-brand">
                                {formatCurrency(p.priceVnd)}
                              </p>
                            </div>
                            <ArrowRight className="size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </StateWrapper>
    </div>
  )
}
