'use client'

import Link from 'next/link'
import { ShieldAlert } from 'lucide-react'
import { useAuth } from '@/components/auth/auth-context'
import { useT } from '@/lib/i18n/provider'
import { ROLE_HOME } from '@/lib/auth/types'

export default function ForbiddenPage() {
  const { user } = useAuth()
  const t = useT()
  const portal = user ? ROLE_HOME[user.role] : '/login'

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
        <ShieldAlert className="size-7" aria-hidden="true" />
      </span>
      <h1 className="font-sans text-2xl font-bold tracking-[-0.02em] text-foreground">
        {t('forbidden.title')}
      </h1>
      <p className="max-w-sm font-sans text-sm text-muted-foreground">{t('forbidden.desc')}</p>
      <div className="mt-2 flex gap-3">
        <Link
          href="/"
          className="rounded-full border border-border px-5 py-2.5 font-sans text-sm font-medium text-foreground transition hover:bg-secondary"
        >
          {t('forbidden.home')}
        </Link>
        <Link
          href={portal}
          className="rounded-full bg-primary px-5 py-2.5 font-sans text-sm font-semibold text-primary-foreground transition hover:brightness-110"
        >
          {t('forbidden.myPortal')}
        </Link>
      </div>
    </div>
  )
}
