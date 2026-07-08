import type { LucideIcon } from 'lucide-react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export function KpiCard({
  icon: Icon,
  label,
  value,
  trend,
}: {
  icon: LucideIcon
  label: string
  value: string
  /** % thay đổi so kỳ trước (dương/âm). */
  trend?: number
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <span className="flex size-9 items-center justify-center rounded-full bg-brand/10 text-brand">
          <Icon className="size-[1.1rem]" aria-hidden="true" />
        </span>
        {trend != null && (
          <span
            className={cn(
              'inline-flex items-center gap-1 font-sans text-[0.75rem] font-semibold',
              trend >= 0 ? 'text-emerald-600' : 'text-red-500',
            )}
          >
            {trend >= 0 ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="mt-4 font-sans text-2xl font-bold tracking-[-0.02em] text-foreground">{value}</p>
      <p className="mt-0.5 font-sans text-[0.8125rem] text-muted-foreground">{label}</p>
    </div>
  )
}
