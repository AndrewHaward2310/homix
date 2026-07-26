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
  /** Icon tuỳ biến cho trạng thái rỗng (mặc định Inbox). */
  emptyIcon?: ReactNode
  /** CTA dưới phần rỗng — dẫn người dùng đi tiếp (vd link "Khám phá căn hộ"). */
  emptyAction?: ReactNode
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
  emptyIcon,
  emptyAction,
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
      <div className={cn('flex flex-col items-center py-16 text-center', className)}>
        <div className="grid size-16 place-items-center rounded-full bg-secondary text-muted-foreground">
          {emptyIcon ?? <Inbox className="size-7" aria-hidden="true" />}
        </div>
        <p className="mt-4 font-sans text-base font-semibold text-foreground">{emptyTitle}</p>
        {emptyHint && (
          <p className="mt-1.5 max-w-sm font-sans text-sm text-muted-foreground">{emptyHint}</p>
        )}
        {emptyAction && <div className="mt-5">{emptyAction}</div>}
      </div>
    )
  }

  return <div className={className}>{children}</div>
}
