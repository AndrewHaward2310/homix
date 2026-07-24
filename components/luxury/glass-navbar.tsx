'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useT } from '@/lib/i18n/provider'
import { useAuth } from '@/components/auth/auth-context'
import { ROLE_HOME } from '@/lib/auth/types'
import { Container } from './container'
import { LanguageSwitcher } from './language-switcher'
import { luxuryButtonVariants } from './luxury-button'
import { Logo } from './logo'
import { ThemeToggle } from '@/components/theme/theme-toggle'

// Neo tới section trang chủ — dùng "/#..." để hoạt động cả trên trang nội dung.
const NAV_LINKS = [
  { key: 'nav.overview', href: '/#tong-quan' },
  { key: 'nav.apartments', href: '/#can-ho' },
  { key: 'nav.amenities', href: '/#tien-ich' },
  { key: 'nav.location', href: '/#vi-tri' },
]

export function GlassNavbar({ solid = false }: { solid?: boolean }) {
  const t = useT()
  const { user } = useAuth()
  const [scrolledRaw, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const scrolled = solid || scrolledRaw

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Nếu đã đăng nhập: "Đăng nhập" → về portal của mình.
  const loginHref = user ? ROLE_HOME[user.role] : '/login'
  const loginLabel = user ? t('account.title') : t('nav.login')

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      {!scrolled && (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/35 to-transparent"
          aria-hidden="true"
        />
      )}

      <div
        className={cn(
          'relative transition-all duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
          scrolled ? 'border-b border-glass-border bg-glass backdrop-blur-xl' : 'border-b border-transparent bg-transparent',
        )}
      >
        <Container className="flex h-[72px] items-center justify-between md:h-[88px]">
          <Link href="/" aria-label="DOMIX HOME">
            <Logo tone={scrolled ? 'auto' : 'light'} />
          </Link>

          <nav aria-label={t('nav.overview')} className="hidden items-center gap-10 md:flex">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={cn(
                  'group relative font-sans text-[0.95rem] font-medium transition-colors duration-300',
                  scrolled ? 'text-muted-foreground hover:text-foreground' : 'text-white/80 hover:text-white',
                )}
              >
                {t(link.key)}
                <span
                  className={cn(
                    'absolute -bottom-1 left-0 h-px w-0 transition-all duration-300 group-hover:w-full',
                    scrolled ? 'bg-foreground' : 'bg-white',
                  )}
                  aria-hidden="true"
                />
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle onHero={!scrolled} className="hidden sm:flex" />
            <LanguageSwitcher className="mr-1 hidden sm:flex" tone={scrolled ? 'default' : 'light'} />
            <Link
              href={loginHref}
              className={cn(
                luxuryButtonVariants({ variant: 'ghost', size: 'sm' }),
                'hidden sm:inline-flex',
                !scrolled && 'text-white hover:bg-white/10',
              )}
            >
              {loginLabel}
            </Link>
            <Link href="/search" className={cn(luxuryButtonVariants({ variant: 'primary', size: 'sm' }), 'hidden sm:inline-flex')}>
              {t('nav.bookTour')}
            </Link>

            {/* Hamburger mobile */}
            <button
              type="button"
              aria-label="Menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
              className={cn(
                'flex size-10 items-center justify-center rounded-full transition-colors md:hidden',
                scrolled ? 'text-foreground hover:bg-secondary' : 'text-white hover:bg-white/10',
              )}
            >
              {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </Container>
      </div>

      {/* Panel menu mobile */}
      {menuOpen && (
        <div className="border-b border-border bg-background md:hidden">
          <Container className="flex flex-col gap-1 py-3">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-xl px-3 py-2.5 font-sans text-[0.95rem] font-medium text-foreground transition-colors hover:bg-secondary"
              >
                {t(link.key)}
              </a>
            ))}
            <div className="my-2 h-px bg-border" />
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1">
                <LanguageSwitcher tone="default" />
                <ThemeToggle />
              </div>
              <div className="flex gap-2">
                <Link
                  href={loginHref}
                  onClick={() => setMenuOpen(false)}
                  className={cn(luxuryButtonVariants({ variant: 'ghost', size: 'sm' }))}
                >
                  {loginLabel}
                </Link>
                <Link
                  href="/search"
                  onClick={() => setMenuOpen(false)}
                  className={cn(luxuryButtonVariants({ variant: 'primary', size: 'sm' }))}
                >
                  {t('nav.bookTour')}
                </Link>
              </div>
            </div>
          </Container>
        </div>
      )}
    </header>
  )
}
