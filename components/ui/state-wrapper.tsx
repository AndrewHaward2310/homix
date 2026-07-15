'use client'

import type { ReactNode } from 'react'
import { AlertCircle, Inbox } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BrandSpinner } from '@/components/luxury/brand-loader'

export type ViewState = 'loading' | 'error' | 'empty' | 'success'

type StateWrapperProps = {
  state: ViewState
  /** Skeleton hiển thị khi loading (nếu không truyền, dùng spinner mặc định). */
  skeleton?: ReactNode
  emptyTitle?: string
  emptyHint?: string
  errorTitle?: string
  onRetry?: () => void
  retryLabel?: string
  className?: string
  children: ReactNode
}

/**
 * Bọc mọi khối có dữ liệu — đảm bảo đủ 4 trạng thái loading/empty/error/success.
 */
export function StateWrapper({
  state,
  skeleton,
  emptyTitle = 'Chưa có dữ liệu',
  emptyHint,
  errorTitle = 'Đã có lỗi xảy ra',
  onRetry,
  retryLabel = 'Thử lại',
  className,
  children,
}: StateWrapperProps) {
  if (state === 'loading') {
    return (
      <div className={className}>
        {skeleton ?? <BrandSpinner />}
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className={cn('flex flex-col items-center gap-3 py-16 text-center', className)}>
        <AlertCircle className="size-8 text-muted-foreground" aria-hidden="true" />
        <p className="font-sans text-base font-semibold text-foreground">{errorTitle}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-1 rounded-full border border-border px-4 py-2 font-sans text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            {retryLabel}
          </button>
        )}
      </div>
    )
  }

  if (state === 'empty') {
    return (
      <div className={cn('flex flex-col items-center gap-2 py-16 text-center', className)}>
        <Inbox className="size-8 text-muted-foreground" aria-hidden="true" />
        <p className="font-sans text-base font-semibold text-foreground">{emptyTitle}</p>
        {emptyHint && (
          <p className="max-w-sm font-sans text-sm text-muted-foreground">{emptyHint}</p>
        )}
      </div>
    )
  }

  return <div className={className}>{children}</div>
}
