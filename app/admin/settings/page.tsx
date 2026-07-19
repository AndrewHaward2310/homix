'use client'

import { useCallback, useEffect, useState } from 'react'
import { Percent, Plus, Trash2, Save, Sparkles } from 'lucide-react'
import { adminService, type AdminDiscountTier } from '@/services/adminService'
import { useLocale } from '@/lib/i18n/provider'
import { StateWrapper, type ViewState } from '@/components/ui/state-wrapper'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'

const field =
  'w-full rounded-xl border border-border bg-background px-3 py-2 font-sans text-[0.9rem] text-foreground outline-none transition focus:ring-2 focus:ring-primary/30'

/** Cài đặt quản trị — hiện có: bậc giảm giá cho combo khách tự thiết kế. */
export default function AdminSettingsPage() {
  const { t, formatCurrency } = useLocale()
  const toast = useToast()
  type Row = AdminDiscountTier & { key: string }
  const [tiers, setTiers] = useState<Row[]>([])
  const [state, setState] = useState<ViewState>('loading')
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    setState('loading')
    adminService
      .getComboDiscounts()
      .then((rows) => {
        setTiers(rows.map((r) => ({ ...r, key: `t${r.minPerks}-${Math.random().toString(36).slice(2, 8)}` })))
        setState('success')
      })
      .catch(() => setState('error'))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const update = (i: number, patch: Partial<AdminDiscountTier>) =>
    setTiers((xs) => xs.map((x, idx) => (idx === i ? { ...x, ...patch } : x)))

  // Mốc trống nhỏ nhất trong 1..20 (null nếu đã kín) — không bao giờ tạo mốc trùng.
  const freeMark = (() => {
    const used = new Set(tiers.map((x) => x.minPerks))
    for (let i = 1; i <= 20; i++) if (!used.has(i)) return i
    return null
  })()

  const addTier = () => {
    if (freeMark == null) return
    setTiers((xs) => [
      ...xs,
      {
        minPerks: freeMark,
        percent: 0,
        maxDiscountVnd: null,
        active: true,
        key: `new-${Math.random().toString(36).slice(2, 8)}`,
      },
    ])
  }

  // Các mốc bị khai báo trùng — cảnh báo NGAY, không đợi server trả lỗi.
  const dupMarks = new Set(
    tiers.map((x) => x.minPerks).filter((m, i, arr) => arr.indexOf(m) !== i),
  )
  const canSave = tiers.length > 0 && dupMarks.size === 0

  const save = async () => {
    setSaving(true)
    try {
      const saved = await adminService.saveComboDiscounts(tiers)
      setTiers(saved.map((r) => ({ ...r, key: `t${r.minPerks}-${Math.random().toString(36).slice(2, 8)}` })))
      toast({ message: t('admin.savedTiers'), variant: 'success' })
    } catch (e) {
      toast({ message: (e as Error).message, variant: 'error' })
    } finally {
      setSaving(false)
    }
  }

  // Xem trước mức giảm đang hiệu lực theo số trải nghiệm
  const preview = [...tiers]
    .filter((x) => x.active)
    .sort((a, b) => a.minPerks - b.minPerks)

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-2xl bg-brand/10 text-brand">
          <Percent className="size-5" />
        </span>
        <div>
          <h1 className="font-sans text-2xl font-bold tracking-[-0.02em] text-foreground">
            {t('admin.discountTitle')}
          </h1>
          <p className="max-w-2xl font-sans text-[0.9rem] text-muted-foreground">
            {t('admin.discountHint')}
          </p>
        </div>
      </div>

      <StateWrapper state={state} className="mt-8" onRetry={load} retryLabel={t('locator.retry')}>
        <div className="rounded-2xl border border-border bg-card p-5">
          {/* Bảng bậc */}
          <div className="space-y-3">
            {tiers.map((tier, i) => (
              <div
                key={tier.key}
                className={cn(
                  'grid items-end gap-3 rounded-xl border p-3 sm:grid-cols-[1fr_1fr_1.2fr_auto_auto]',
                  dupMarks.has(tier.minPerks) ? 'border-red-500/60 bg-red-500/5' : 'border-border',
                  !tier.active && 'opacity-60',
                )}
              >
                <label className="block">
                  <span className="mb-1 block font-sans text-[0.75rem] font-medium text-muted-foreground">
                    {t('admin.tierMinPerks')}
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    className={field}
                    value={tier.minPerks}
                    onChange={(e) => {
                      if (e.target.value === '') return
                      const n = Number(e.target.value)
                      if (Number.isFinite(n)) update(i, { minPerks: Math.min(20, Math.max(1, Math.floor(n))) })
                    }}
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block font-sans text-[0.75rem] font-medium text-muted-foreground">
                    {t('admin.tierPercent')}
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    className={field}
                    value={tier.percent}
                    onChange={(e) => {
                      if (e.target.value === '') return
                      const n = Number(e.target.value)
                      if (Number.isFinite(n)) update(i, { percent: Math.min(100, Math.max(0, n)) })
                    }}
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block font-sans text-[0.75rem] font-medium text-muted-foreground">
                    {t('admin.tierCap')}
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={100000}
                    placeholder={t('admin.tierNoCap')}
                    className={field}
                    value={tier.maxDiscountVnd ?? ''}
                    onChange={(e) =>
                      update(i, {
                        maxDiscountVnd:
                          e.target.value === '' ? null : Math.max(0, Number(e.target.value) || 0),
                      })
                    }
                  />
                </label>
                <label className="flex items-center gap-2 pb-2 font-sans text-[0.8125rem] font-medium text-foreground">
                  <input
                    type="checkbox"
                    checked={tier.active}
                    onChange={(e) => update(i, { active: e.target.checked })}
                    className="size-4 accent-[var(--primary)]"
                  />
                  {t('admin.tierActive')}
                </label>
                <button
                  type="button"
                  aria-label={t('admin.removeTier')}
                  disabled={tiers.length <= 1}
                  onClick={() => setTiers((xs) => xs.filter((_, idx) => idx !== i))}
                  className="mb-1 grid size-9 place-items-center rounded-lg border border-border text-muted-foreground transition hover:bg-secondary hover:text-red-600 disabled:opacity-40"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={addTier}
              disabled={freeMark == null}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 font-sans text-[0.875rem] font-semibold text-foreground transition hover:bg-secondary disabled:opacity-40"
            >
              <Plus className="size-4" /> {t('admin.addTier')}
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving || !canSave}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 font-sans text-[0.875rem] font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-60"
            >
              <Save className="size-4" /> {t('admin.saveTiers')}
            </button>
          </div>

          {/* Xem trước */}
          {preview.length > 0 && (
            <div className="mt-5 rounded-xl border border-dashed border-brand/40 bg-brand/5 p-4">
              <div className="flex items-center gap-1.5 font-sans text-[0.8125rem] font-bold text-brand">
                <Sparkles className="size-4" />
                {t('admin.tierPreview', {
                  n: preview[preview.length - 1].minPerks,
                  pct: preview[preview.length - 1].percent,
                })}
              </div>
              <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 font-sans text-[0.8125rem] text-muted-foreground">
                {preview.map((x, i) => (
                  <li key={i}>
                    ≥{x.minPerks} → <b className="text-foreground">{x.percent}%</b>
                    {x.maxDiscountVnd != null && ` (≤ ${formatCurrency(x.maxDiscountVnd)})`}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </StateWrapper>
    </div>
  )
}
