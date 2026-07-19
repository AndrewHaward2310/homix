'use client'

import { useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Share2, ArrowRight } from 'lucide-react'
import { GlassNavbar } from '@/components/luxury/glass-navbar'
import { SiteFooter } from '@/components/home/site-footer'
import { Container } from '@/components/luxury/container'
import { H1, Body, Eyebrow } from '@/components/luxury/typography'
import { useToast } from '@/components/ui/toast'
import { useT } from '@/lib/i18n/provider'
import { ComboBuilderCore, copyText } from './combo-builder-core'

/** Trang KHÁCH tự thiết kế combo — bọc lõi builder trong khung marketing đầy đủ. */
export function ComboBuilderClient() {
  const t = useT()
  const router = useRouter()
  const sp = useSearchParams()
  const toast = useToast()

  const onParams = useCallback(
    (next: Record<string, string | null>) => {
      const params = new URLSearchParams(sp.toString())
      for (const [k, v] of Object.entries(next)) {
        if (v == null || v === '') params.delete(k)
        else params.set(k, v)
      }
      router.replace(`?${params.toString()}`, { scroll: false })
    },
    [router, sp],
  )

  return (
    <div className="min-h-screen bg-background">
      <GlassNavbar solid />
      <main className="pt-[72px] md:pt-[88px]">
        <Container className="py-10 md:py-14">
          <Eyebrow>{t('builder.eyebrow')}</Eyebrow>
          <H1 className="mt-3 font-display">{t('builder.title')}</H1>
          <Body className="mt-4 max-w-xl">{t('builder.subtitle')}</Body>

          <div className="mt-10">
            <ComboBuilderCore
              sp={sp}
              onParams={onParams}
              renderActions={({ quoteLink }) => (
                <div className="flex gap-2">
                  {/* Mang theo combo đã xếp sang trang đặt — không mất đêm/khách/trải nghiệm. */}
                  <Link
                    href={quoteLink}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 font-sans text-[0.9rem] font-semibold text-primary-foreground transition hover:brightness-110"
                  >
                    {t('builder.book')}
                    <ArrowRight className="size-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={async () => {
                      const ok = await copyText(window.location.href)
                      toast({
                        message: ok ? t('builder.shared') : window.location.href,
                        variant: ok ? 'success' : 'info',
                      })
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-background px-4 py-3 font-sans text-[0.9rem] font-semibold text-foreground transition hover:bg-secondary"
                  >
                    <Share2 className="size-4" />
                    {t('builder.share')}
                  </button>
                </div>
              )}
            />
          </div>
        </Container>
      </main>
      <SiteFooter />
    </div>
  )
}
