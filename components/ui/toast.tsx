'use client'

import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { Check, AlertCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type Variant = 'success' | 'error' | 'info'
type ToastInput = { message: string; variant?: Variant; action?: { label: string; onClick: () => void } }
type ToastItem = ToastInput & { id: number }

const ToastCtx = createContext<(t: ToastInput) => void>(() => {})

export function useToast() {
  return useContext(ToastCtx)
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const seq = useRef(0)

  const remove = useCallback((id: number) => setItems((xs) => xs.filter((t) => t.id !== id)), [])
  const toast = useCallback(
    (t: ToastInput) => {
      const id = ++seq.current
      setItems((xs) => [...xs, { ...t, id }])
      setTimeout(() => remove(id), t.action ? 6000 : 3500)
    },
    [remove],
  )

  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[200] flex flex-col items-center gap-2 px-4 sm:bottom-6">
        {items.map((t) => {
          const Icon = t.variant === 'error' ? AlertCircle : Check
          return (
            <div
              key={t.id}
              role="status"
              className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3 shadow-luxury-lg"
            >
              <span
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-full',
                  t.variant === 'error' ? 'bg-red-500/15 text-red-600 dark:text-red-400' : 'bg-brand/10 text-brand',
                )}
              >
                <Icon className="size-3.5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1 font-sans text-[0.875rem] text-foreground">{t.message}</span>
              {t.action && (
                <button
                  type="button"
                  onClick={() => {
                    t.action!.onClick()
                    remove(t.id)
                  }}
                  className="shrink-0 font-sans text-[0.8125rem] font-semibold text-brand hover:underline"
                >
                  {t.action.label}
                </button>
              )}
              <button
                type="button"
                aria-label="Close"
                onClick={() => remove(t.id)}
                className="shrink-0 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastCtx.Provider>
  )
}
