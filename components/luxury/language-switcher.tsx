'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, Globe } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LOCALES } from '@/lib/i18n/config'
import { useLocale } from '@/lib/i18n/provider'

type LanguageSwitcherProps = {
  /** "light" cho nền tối (trang login/hero), "default" cho navbar thường. */
  tone?: 'default' | 'light'
  className?: string
}

export function LanguageSwitcher({ tone = 'default', className }: LanguageSwitcherProps) {
  const { locale, setLocale, t } = useLocale()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0]
  const light = tone === 'light'

  // Đóng khi click ra ngoài hoặc nhấn Escape.
  useEffect(() => {
    if (!open) return
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('lang.switch')}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-sans text-[0.8125rem] font-medium tracking-[0.02em] transition-all duration-300',
          light
            ? 'border-white/25 bg-white/10 text-white/90 backdrop-blur-md hover:bg-white/20'
            : 'border-border bg-glass text-foreground backdrop-blur-md hover:bg-secondary',
        )}
      >
        <Globe className="size-3.5 opacity-70" aria-hidden="true" />
        <span>{current.short}</span>
        <ChevronDown
          className={cn(
            'size-3.5 opacity-60 transition-transform duration-300',
            open && 'rotate-180',
          )}
          aria-hidden="true"
        />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={t('lang.switch')}
          className={cn(
            'absolute right-0 top-[calc(100%+8px)] z-50 min-w-[168px] overflow-hidden rounded-2xl border p-1.5 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.35)] backdrop-blur-2xl',
            light
              ? 'border-white/20 bg-white/10'
              : 'border-glass-border bg-glass',
          )}
        >
          {LOCALES.map((l) => {
            const active = l.code === locale
            return (
              <li key={l.code} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => {
                    setLocale(l.code)
                    setOpen(false)
                  }}
                  className={cn(
                    'flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left font-sans text-[0.875rem] transition-colors duration-200',
                    light
                      ? 'text-white/85 hover:bg-white/15'
                      : 'text-foreground hover:bg-secondary',
                  )}
                >
                  <span className="flex items-center gap-2.5">
                    <span
                      className={cn(
                        'font-mono text-[0.6875rem] font-semibold tracking-[0.08em]',
                        light ? 'text-white/50' : 'text-muted-foreground',
                      )}
                    >
                      {l.short}
                    </span>
                    <span>{l.label}</span>
                  </span>
                  {active && <Check className="size-4 text-brand" aria-hidden="true" />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
