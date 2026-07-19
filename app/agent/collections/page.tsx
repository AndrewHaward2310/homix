'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { FileText, Link2, ClipboardCopy } from 'lucide-react'
import type { Lead } from '@/types'
import { pickLocale } from '@/types'
import { getLeads } from '@/services/leadService'
import { useLocale } from '@/lib/i18n/provider'
import { useToast } from '@/components/ui/toast'
import { BrandSpinner } from '@/components/luxury/brand-loader'
import {
  ComboBuilderCore,
  copyText,
  type BuilderSnapshot,
} from '@/components/combo/combo-builder-core'

/** Công cụ BÁO GIÁ cho sale: tái dùng lõi builder + gắn khách + xuất link/nội dung gửi. */
function QuoteTool() {
  const { locale, t, formatCurrency } = useLocale()
  const router = useRouter()
  const sp = useSearchParams()
  const toast = useToast()

  const [leads, setLeads] = useState<Lead[]>([])
  const [leadsError, setLeadsError] = useState(false)
  const [leadReload, setLeadReload] = useState(0)
  const leadId = sp.get('lead') ?? ''
  const lead = leads.find((l) => l.id === leadId) ?? null

  useEffect(() => {
    let active = true
    setLeadsError(false)
    getLeads()
      .then((ls) => active && setLeads(ls))
      .catch(() => active && setLeadsError(true))
    return () => {
      active = false
    }
  }, [leadReload])

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

  // Link đặt tuyệt đối cho khách (kèm origin để copy-paste chạy được ngay).
  const absoluteLink = (snap: BuilderSnapshot) =>
    typeof window !== 'undefined' ? window.location.origin + snap.quoteLink : snap.quoteLink

  // Nội dung báo giá dạng text để sale gửi qua Zalo/email.
  const buildMessage = (snap: BuilderSnapshot) => {
    const lines: string[] = [t('quote.msgTitle')]
    if (lead) lines.push(`${t('quote.forCustomer')}: ${lead.customerName} · ${lead.contact}`)
    lines.push(`${t('quote.msgStay')}: ${pickLocale(snap.property.title, locale)}`)
    lines.push(t('quote.msgDuration', { nights: snap.nights, guests: snap.guests }))
    if (snap.chosen.length) {
      lines.push(`${t('quote.msgExperiences')}:`)
      for (const { perk, qty } of snap.chosen) {
        lines.push(
          `- ${pickLocale(perk.name, locale)}${qty > 1 ? ` ×${qty}` : ''}: ${formatCurrency(perk.priceVnd * qty)}`,
        )
      }
    }
    if (snap.priced) {
      lines.push(`${t('quote.msgPackage')}: ${formatCurrency(snap.priced.packagePriceVnd)}`)
      if (snap.priced.savingsVnd > 0) {
        lines.push(
          t('quote.msgSavings', {
            pct: snap.priced.savingsPct,
            amount: formatCurrency(snap.priced.savingsVnd),
          }),
        )
      }
    }
    lines.push(`${t('quote.msgBookAt')}: ${absoluteLink(snap)}`)
    return lines.join('\n')
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-brand/10 text-brand">
          <FileText className="size-5" />
        </span>
        <div>
          <h1 className="font-sans text-2xl font-bold tracking-[-0.02em] text-foreground">
            {t('quote.title')}
          </h1>
          <p className="font-sans text-[0.9rem] text-muted-foreground">{t('quote.subtitle')}</p>
        </div>
      </div>

      {/* Gắn khách hàng (tùy chọn) — đưa tên & liên hệ vào nội dung báo giá. */}
      <label className="mt-6 block max-w-sm">
        <span className="mb-1.5 block font-sans text-[0.8125rem] font-medium text-muted-foreground">
          {t('quote.selectLead')}
        </span>
        <select
          // Lead nạp async: chỉ coi là đã chọn khi id thực sự có trong danh sách,
          // tránh cảnh báo "value không khớp option" lúc mới tải / ?lead= sai.
          value={lead ? leadId : ''}
          onChange={(e) => onParams({ lead: e.target.value || null })}
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 font-sans text-[0.9rem] text-foreground outline-none transition focus:ring-2 focus:ring-primary/30"
        >
          <option value="">{t('quote.noLead')}</option>
          {leads.map((l) => (
            <option key={l.id} value={l.id}>
              {l.customerName} · {l.contact}
            </option>
          ))}
        </select>
        {/* Không nuốt lỗi: báo rõ + cho thử lại thay vì hiện danh sách rỗng giả. */}
        {leadsError && (
          <span className="mt-1.5 flex items-center gap-2 font-sans text-[0.8125rem] text-red-600">
            {t('quote.leadsError')}
            <button
              type="button"
              onClick={() => setLeadReload((n) => n + 1)}
              className="font-semibold text-brand underline underline-offset-2"
            >
              {t('locator.retry')}
            </button>
          </span>
        )}
      </label>

      <div className="mt-8">
        <ComboBuilderCore
          sp={sp}
          onParams={onParams}
          summaryHeading={t('quote.summaryHeading')}
          renderActions={(snap) => (
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={async () => {
                  const ok = await copyText(absoluteLink(snap))
                  toast({
                    message: ok ? t('quote.linkCopied') : absoluteLink(snap),
                    variant: ok ? 'success' : 'info',
                  })
                }}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 font-sans text-[0.9rem] font-semibold text-primary-foreground transition hover:brightness-110"
              >
                <Link2 className="size-4" />
                {t('quote.copyLink')}
              </button>
              <button
                type="button"
                onClick={async () => {
                  const msg = buildMessage(snap)
                  const ok = await copyText(msg)
                  toast({
                    message: ok ? t('quote.summaryCopied') : msg,
                    variant: ok ? 'success' : 'info',
                  })
                }}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-background px-5 py-3 font-sans text-[0.9rem] font-semibold text-foreground transition hover:bg-secondary"
              >
                <ClipboardCopy className="size-4" />
                {t('quote.copySummary')}
              </button>
            </div>
          )}
        />
      </div>
    </div>
  )
}

export default function Page() {
  // ComboBuilderCore/QuoteTool đọc useSearchParams → cần Suspense boundary.
  return (
    <Suspense fallback={<BrandSpinner />}>
      <QuoteTool />
    </Suspense>
  )
}
