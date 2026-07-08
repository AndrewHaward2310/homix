'use client'

import Image from 'next/image'
import { BadgeCheck, Mail, Phone, Globe } from 'lucide-react'
import { useAuth } from '@/components/auth/auth-context'
import { useLocale } from '@/lib/i18n/provider'

export default function ProfilePage() {
  const { user } = useAuth()
  const { t } = useLocale()
  if (!user) return null

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-sans text-2xl font-bold tracking-[-0.02em] text-foreground">{t('account.profile')}</h1>

      <div className="mt-6 flex items-center gap-4 rounded-2xl border border-border bg-card p-5">
        <Image
          src={user.avatarUrl || '/placeholder-user.jpg'}
          alt={user.name}
          width={64}
          height={64}
          className="size-16 rounded-full object-cover"
        />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate font-sans text-lg font-bold text-foreground">{user.name}</p>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 font-sans text-[0.625rem] font-semibold text-emerald-600 dark:text-emerald-400">
              <BadgeCheck className="size-3" /> eKYC
            </span>
          </div>
          <p className="font-sans text-sm text-muted-foreground">{t(`role.${user.role}`)}</p>
        </div>
      </div>

      <div className="mt-4 divide-y divide-border rounded-2xl border border-border bg-card">
        <Row icon={Mail} label="Email" value={user.email} />
        {user.phone && <Row icon={Phone} label="SĐT" value={user.phone} />}
        <Row icon={Globe} label={t('lang.switch')} value={user.preferredLocale.toUpperCase()} />
      </div>
    </div>
  )
}

function Row({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 px-5 py-4">
      <Icon className="size-4 text-muted-foreground" />
      <span className="w-24 shrink-0 font-sans text-sm text-muted-foreground">{label}</span>
      <span className="min-w-0 flex-1 truncate font-sans text-sm font-medium text-foreground">{value}</span>
    </div>
  )
}
