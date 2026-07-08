'use client'

import Image from 'next/image'
import { Container } from '@/components/luxury/container'
import { LanguageSwitcher } from '@/components/luxury/language-switcher'
import { LuxuryButton } from '@/components/luxury/luxury-button'
import { Logo } from '@/components/luxury/logo'
import { useT } from '@/lib/i18n/provider'
import { useAuth } from './auth-context'

type PortalHeaderProps = {
  /**
   * Key i18n cho nhãn portal cạnh logo, ví dụ "portal.host".
   * Truyền key thay vì chuỗi cứng để dịch được theo ngôn ngữ.
   */
  portalNameKey: string
}

export function PortalHeader({ portalNameKey }: PortalHeaderProps) {
  const t = useT()
  const { user, logout } = useAuth()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-glass-border bg-glass backdrop-blur-xl">
      <Container className="flex h-16 items-center justify-between md:h-20">
        <div className="flex items-center gap-3">
          <Logo />
          <span
            className="hidden rounded-full border border-border px-2.5 py-0.5 font-sans text-[0.6875rem] uppercase tracking-[0.12em] text-muted-foreground sm:inline-block"
          >
            {t(portalNameKey)}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          {user && (
            <div className="flex items-center gap-3">
              <Image
                src={user.avatarUrl || '/placeholder.svg'}
                alt={user.name}
                width={36}
                height={36}
                className="size-9 rounded-full object-cover"
              />
              <div className="hidden flex-col leading-tight sm:flex">
                <span className="font-sans text-sm font-medium text-foreground">{user.name}</span>
                <span className="font-sans text-[0.75rem] text-muted-foreground">
                  {t(`role.${user.role}`)}
                </span>
              </div>
            </div>
          )}
          <LuxuryButton variant="ghost" size="sm" onClick={logout}>
            {t('auth.logout')}
          </LuxuryButton>
        </div>
      </Container>
    </header>
  )
}
