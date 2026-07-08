'use client'

import { Sparkles } from 'lucide-react'
import { useT } from '@/lib/i18n/provider'

export function ComingSoon({ title }: { title?: string }) {
  const t = useT()
  return (
    <div className="mx-auto max-w-3xl">
      {title && <h1 className="font-sans text-2xl font-bold tracking-[-0.02em] text-foreground">{title}</h1>}
      <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card/50 p-14 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-brand/10 text-brand">
          <Sparkles className="size-6" />
        </span>
        <p className="font-sans text-lg font-semibold text-foreground">{t('common.comingSoon')}</p>
        <p className="max-w-sm font-sans text-sm text-muted-foreground">{t('common.comingSoonHint')}</p>
      </div>
    </div>
  )
}
