'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Wallet, Users, Building2, CalendarCheck, ArrowRight } from 'lucide-react'
import { adminService, type AdminOverview } from '@/services/adminService'
import { useLocale } from '@/lib/i18n/provider'
import { StateWrapper, type ViewState } from '@/components/ui/state-wrapper'
import { KpiCard } from '@/components/portal/kpi-card'

export default function AdminOverviewPage() {
  const { t, formatCurrency } = useLocale()
  const [state, setState] = useState<ViewState>('loading')
  const [data, setData] = useState<AdminOverview | null>(null)

  const load = () => {
    setState('loading')
    adminService
      .getOverview()
      .then((d) => {
        setData(d)
        setState('success')
      })
      .catch(() => setState('error'))
  }
  useEffect(load, [])

  return (
    <div className="mx-auto max-w-7xl">
      <h1 className="font-sans text-2xl font-bold tracking-[-0.02em] text-foreground">{t('admin.overview')}</h1>

      <StateWrapper state={state} className="mt-6" onRetry={load}>
        {data && (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <KpiCard icon={Wallet} label={t('admin.kpiGmv')} value={formatCurrency(data.gmv)} trend={18} />
              <KpiCard icon={Users} label={t('admin.kpiUsers')} value={String(data.totalUsers)} trend={9} />
              <KpiCard icon={Building2} label={t('admin.kpiActive')} value={String(data.propsActive)} />
              <KpiCard icon={CalendarCheck} label={t('admin.kpiBookings')} value={String(data.bookings)} trend={5} />
            </div>

            {/* Breakdown user theo role */}
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-border bg-card p-5">
                <p className="font-sans text-sm font-semibold text-foreground">Người dùng theo vai trò</p>
                <div className="mt-3 space-y-2">
                  {Object.entries(data.usersByRole).map(([role, n]) => (
                    <div key={role} className="flex items-center justify-between font-sans text-sm">
                      <span className="text-muted-foreground">{t(`role.${role}`)}</span>
                      <span className="font-semibold text-foreground">{n}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hàng đợi cần duyệt */}
              <div className="rounded-2xl border border-border bg-card p-5">
                <p className="font-sans text-sm font-semibold text-foreground">{t('admin.queueTitle')}</p>
                <Link
                  href="/admin/listings"
                  className="mt-3 flex items-center justify-between rounded-xl bg-amber-500/10 px-4 py-3 transition-colors hover:bg-amber-500/20"
                >
                  <span className="font-sans text-sm text-amber-700 dark:text-amber-300">
                    <span className="font-bold">{data.propsUnverified}</span> {t('admin.queueListings')}
                  </span>
                  <ArrowRight className="size-4 text-amber-700" />
                </Link>
              </div>
            </div>
          </>
        )}
      </StateWrapper>
    </div>
  )
}
