'use client'

import { useEffect, useRef, useState } from 'react'
import { Bookmark, BookmarkPlus, Check, X } from 'lucide-react'
import { useSavedSearches } from '@/hooks/use-saved-searches'
import { useT } from '@/lib/i18n/provider'
import { cn } from '@/lib/utils'

/**
 * SavedSearches — nút "Đã lưu" + dropdown: lưu bộ tìm kiếm hiện tại (query string)
 * và áp lại các bộ đã lưu. Lưu ở localStorage (xem use-saved-searches).
 */
export function SavedSearches({
  currentQuery,
  currentLabel,
  onApply,
}: {
  currentQuery: string
  currentLabel: string
  onApply: (query: string) => void
}) {
  const t = useT()
  const { items, add, remove, has } = useSavedSearches()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const saved = currentQuery !== '' && has(currentQuery)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 font-sans text-sm font-medium text-foreground transition hover:bg-secondary active:scale-95"
      >
        <Bookmark className="size-4" />
        {t('search.saved')}
        {items.length > 0 && <span className="tabular-nums text-muted-foreground">({items.length})</span>}
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-40 w-72 rounded-2xl border border-border bg-background p-2 shadow-luxury-lg">
          <button
            type="button"
            disabled={currentQuery === '' || saved}
            onClick={() => add(currentLabel, currentQuery)}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left font-sans text-sm font-medium text-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saved ? <Check className="size-4 text-brand" /> : <BookmarkPlus className="size-4" />}
            {saved ? t('search.savedThis') : t('search.saveCurrent')}
          </button>

          <div className="my-1.5 h-px bg-border" />

          {items.length === 0 ? (
            <p className="px-3 py-2 font-sans text-[0.8125rem] text-muted-foreground">{t('search.noSaved')}</p>
          ) : (
            <ul className="max-h-64 overflow-y-auto">
              {items.map((s) => (
                <li key={s.id} className="group flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      onApply(s.query)
                      setOpen(false)
                    }}
                    className="min-w-0 flex-1 truncate rounded-xl px-3 py-2 text-left font-sans text-[0.8125rem] text-foreground transition hover:bg-secondary"
                  >
                    {s.label}
                  </button>
                  <button
                    type="button"
                    aria-label={t('common.delete')}
                    onClick={() => remove(s.id)}
                    className={cn(
                      'grid size-7 shrink-0 place-items-center rounded-lg text-muted-foreground transition hover:bg-secondary hover:text-foreground',
                    )}
                  >
                    <X className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
