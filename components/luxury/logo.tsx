import { cn } from '@/lib/utils'

type LogoProps = {
  /** Màu chữ wordmark: 'auto' theo foreground, 'light' cho nền tối. */
  tone?: 'auto' | 'light'
  /** Ẩn chữ, chỉ hiện mark. */
  markOnly?: boolean
  className?: string
}

/**
 * Logo HOMIX — mark hình học (mái nhà + chữ H) trong ô bo tròn brand + wordmark.
 * Dùng ở navbar, footer, login, portal.
 */
export function Logo({ tone = 'auto', markOnly = false, className }: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark className="size-9" />
      {!markOnly && (
        <span
          className={cn(
            'font-sans text-[1.35rem] font-extrabold leading-none tracking-[-0.03em]',
            tone === 'light' ? 'text-white' : 'text-foreground',
          )}
        >
          HOMIX
        </span>
      )}
    </span>
  )
}

/** Chỉ riêng biểu tượng (dùng cho favicon/marker nếu cần). */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="var(--brand)" />
      {/* Mái nhà */}
      <path
        d="M16 6.5 L25 13.4 V13.8 H7 V13.4 Z"
        fill="var(--brand-foreground)"
        opacity="0.95"
      />
      {/* Chữ H (2 chân + xà ngang) — gợi "home" */}
      <rect x="9.4" y="14.6" width="3.1" height="11" rx="1.1" fill="var(--brand-foreground)" />
      <rect x="19.5" y="14.6" width="3.1" height="11" rx="1.1" fill="var(--brand-foreground)" />
      <rect x="11.8" y="18.6" width="8.4" height="2.9" rx="0.6" fill="var(--brand-foreground)" />
    </svg>
  )
}
