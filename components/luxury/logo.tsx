import { cn } from '@/lib/utils'

type LogoProps = {
  /** Màu chữ wordmark: 'auto' theo foreground, 'light' cho nền tối. */
  tone?: 'auto' | 'light'
  /** Ẩn chữ, chỉ hiện mark. */
  markOnly?: boolean
  className?: string
}

/**
 * Logo DOMIX HOME — mark: chữ "D" ôm mái nhà + mũi tên tiến (chuyển động), nền xanh
 * dương brand + ánh kim nhẹ. Wordmark "DOMIX" đậm + "HOME" giãn chữ nhỏ bên dưới.
 * Dùng ở navbar, footer, login, portal.
 */
export function Logo({ tone = 'auto', markOnly = false, className }: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark className="size-9" />
      {!markOnly && (
        <span className="inline-flex flex-col leading-none">
          <span
            className={cn(
              'font-sans text-[1.3rem] font-extrabold tracking-[-0.03em]',
              tone === 'light' ? 'text-white' : 'text-foreground',
            )}
          >
            DOMIX
          </span>
          <span
            className={cn(
              'mt-0.5 font-sans text-[0.5rem] font-bold uppercase tracking-[0.42em]',
              tone === 'light' ? 'text-white/70' : 'text-brand',
            )}
          >
            Home
          </span>
        </span>
      )}
    </span>
  )
}

/** Chỉ riêng biểu tượng (dùng cho favicon/marker nếu cần). */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="domix-bg" x1="4" y1="2" x2="36" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="color-mix(in srgb, var(--brand) 78%, white)" />
          <stop offset="1" stopColor="var(--brand)" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill="url(#domix-bg)" />
      {/* Mũi tên tiến (chuyển động) — chevron bên trái */}
      <path
        d="M9.5 13 L15.5 20 L9.5 27"
        stroke="var(--brand-foreground)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.55"
      />
      {/* Chữ D: thân dọc + vòng cung phải */}
      <path
        d="M18.5 11 h3.4 a9 9 0 0 1 0 18 h-3.4 a0.6 0.6 0 0 1 -0.6 -0.6 V11.6 A0.6 0.6 0 0 1 18.5 11 Z"
        fill="var(--brand-foreground)"
      />
      {/* Mái nhà (khoét trong lòng chữ D) — gợi "home" */}
      <path d="M20.4 16.2 L25.4 20 H15.4 Z" fill="url(#domix-bg)" />
      {/* Cửa sổ nhỏ dưới mái */}
      <rect x="19.1" y="21" width="2.5" height="2.5" rx="0.4" fill="url(#domix-bg)" />
    </svg>
  )
}
