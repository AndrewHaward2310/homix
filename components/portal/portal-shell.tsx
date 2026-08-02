'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { LucideIcon } from 'lucide-react'
import { LogOut, ChevronDown, MoreHorizontal, X } from 'lucide-react'
import { useAuth } from '@/components/auth/auth-context'
import { useT } from '@/lib/i18n/provider'
import { LanguageSwitcher } from '@/components/luxury/language-switcher'
import { Logo } from '@/components/luxury/logo'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { cn } from '@/lib/utils'

export type PortalNavItem = { href: string; label: string; icon: LucideIcon }

export function PortalShell({
  nav,
  roleLabel,
  children,
}: {
  nav: PortalNavItem[]
  roleLabel?: string
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const t = useT()
  const [menuOpen, setMenuOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  // Bottom-nav mobile: 5 chỗ. Nếu nhiều mục hơn → 4 tab đầu + tab "Thêm" mở sheet
  // chứa TOÀN BỘ mục (nếu không sẽ có mục không tới được trên mobile).
  const MAX_TABS = 5
  const hasMore = nav.length > MAX_TABS
  const tabs = hasMore ? nav.slice(0, MAX_TABS - 1) : nav

  return (
    <div className="min-h-screen bg-secondary/30">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border bg-background md:flex">
        <div className="flex h-[72px] items-center px-6">
          <Logo />
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {nav.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 font-sans text-[0.9rem] font-medium transition-colors',
                  active
                    ? 'bg-brand/10 text-brand'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                )}
              >
                <Icon className="size-[1.15rem] shrink-0" aria-hidden="true" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main */}
      <div className="md:pl-64">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between gap-3 border-b border-border bg-background/90 px-4 backdrop-blur-xl md:px-8">
          <div className="md:hidden">
            <Logo markOnly />
          </div>
          {roleLabel && (
            <span className="hidden rounded-full border border-border px-3 py-1 font-sans text-[0.6875rem] font-medium uppercase tracking-[0.12em] text-muted-foreground md:inline-block">
              {roleLabel}
            </span>
          )}
          <div className="flex flex-1 items-center justify-end gap-2">
            <ThemeToggle />
            <LanguageSwitcher />
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 rounded-full border border-border py-1 pl-1 pr-2.5 transition-colors hover:bg-secondary"
              >
                <Image
                  src={user?.avatarUrl || '/placeholder-user.jpg'}
                  alt={user?.name ?? ''}
                  width={28}
                  height={28}
                  className="size-7 rounded-full object-cover"
                />
                <span className="hidden font-sans text-sm font-medium text-foreground sm:inline">
                  {user?.name?.split(' ').slice(-1)[0]}
                </span>
                <ChevronDown className="size-4 text-muted-foreground" />
              </button>
              {menuOpen && (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-40 cursor-default"
                    aria-hidden="true"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-2xl border border-border bg-background p-1.5 shadow-luxury-lg">
                    <div className="px-3 py-2">
                      <p className="truncate font-sans text-sm font-semibold text-foreground">{user?.name}</p>
                      <p className="truncate font-sans text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                    <div className="my-1 h-px bg-border" />
                    <button
                      type="button"
                      onClick={logout}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left font-sans text-sm text-foreground transition-colors hover:bg-secondary"
                    >
                      <LogOut className="size-4" /> {t('auth.logout')}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main id="main-content" className="p-4 pb-24 md:p-8 md:pb-8">{children}</main>
      </div>

      {/* Bottom-nav mobile */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-background/95 backdrop-blur-xl md:hidden">
        {tabs.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 py-2.5 font-sans text-[0.625rem] font-medium',
                active ? 'text-brand' : 'text-muted-foreground',
              )}
            >
              <Icon className="size-5" aria-hidden="true" />
              <span className="truncate px-1">{item.label}</span>
            </Link>
          )
        })}
        {hasMore && (
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            aria-expanded={moreOpen}
            className={cn(
              'flex flex-1 flex-col items-center gap-1 py-2.5 font-sans text-[0.625rem] font-medium',
              // sáng nếu trang đang xem nằm trong nhóm "Thêm"
              nav.slice(MAX_TABS - 1).some((i) => isActive(i.href)) ? 'text-brand' : 'text-muted-foreground',
            )}
          >
            <MoreHorizontal className="size-5" aria-hidden="true" />
            <span className="truncate px-1">{t('portal.more')}</span>
          </button>
        )}
      </nav>

      {/* Sheet "Thêm" — toàn bộ mục điều hướng cho mobile */}
      {moreOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-end bg-black/50 animate-[overlay-in_0.2s_ease-out] md:hidden"
          onClick={() => setMoreOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t('portal.allSections')}
            onClick={(e) => e.stopPropagation()}
            className="sheet-enter max-h-[80vh] w-full overflow-y-auto rounded-t-3xl border-t border-border bg-background p-4 pb-8"
          >
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-border" aria-hidden="true" />
            <div className="mb-3 flex items-center justify-between">
              <p className="font-sans text-base font-bold text-foreground">{t('portal.allSections')}</p>
              <button
                type="button"
                aria-label={t('locator.close')}
                onClick={() => setMoreOpen(false)}
                className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-secondary"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {nav.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-center font-sans text-[0.75rem] font-medium transition-colors',
                      active
                        ? 'border-brand/40 bg-brand/10 text-brand'
                        : 'border-border text-foreground hover:bg-secondary',
                    )}
                  >
                    <Icon className="size-5" aria-hidden="true" />
                    <span className="line-clamp-2 leading-tight">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
