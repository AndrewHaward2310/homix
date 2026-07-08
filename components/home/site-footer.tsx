'use client'

import { Container } from '@/components/luxury/container'
import { Logo } from '@/components/luxury/logo'
import { useT } from '@/lib/i18n/provider'

export function SiteFooter() {
  const t = useT()

  const columns = [
    {
      heading: t('footer.colExplore'),
      links: [t('footer.linkBuy'), t('footer.linkRent'), t('footer.linkStay')],
    },
    {
      heading: t('footer.colCompany'),
      links: [t('footer.linkAbout'), t('footer.linkCareers'), t('footer.linkPress')],
    },
    {
      heading: t('footer.colSupport'),
      links: [t('footer.linkHelp'), t('footer.linkContact'), t('footer.linkTerms')],
    },
  ]

  return (
    <footer className="border-t border-border bg-background">
      <Container className="py-16 md:py-20">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Thương hiệu + tagline */}
          <div className="lg:col-span-1">
            <Logo />
            <p className="mt-4 max-w-xs text-pretty font-sans text-[0.9375rem] leading-[1.6] text-muted-foreground">
              {t('footer.tagline')}
            </p>
          </div>

          {/* Cột link */}
          {columns.map((col) => (
            <nav key={col.heading} aria-label={col.heading}>
              <h3 className="font-sans text-[0.8125rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {col.heading}
              </h3>
              <ul className="mt-4 flex flex-col gap-3">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="font-sans text-[0.9375rem] text-foreground transition-colors duration-300 hover:text-brand"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-14 border-t border-border pt-8">
          <p className="font-sans text-[0.875rem] text-muted-foreground">{t('footer.rights')}</p>
        </div>
      </Container>
    </footer>
  )
}
