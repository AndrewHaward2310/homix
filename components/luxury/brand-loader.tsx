import { LogoMark } from './logo'
import { cn } from '@/lib/utils'

/**
 * BrandLoaderInline — loader thương hiệu GỌN, phủ trong phần tử cha (relative).
 * Dùng cho loading cấp component: map, danh sách, ảnh… (không phải toàn màn hình).
 */
export function BrandLoaderInline({ label, className }: { label?: string; className?: string }) {
  return (
    <div
      className={cn(
        'absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-background/70 backdrop-blur-sm animate-loader-in',
        className,
      )}
      role="status"
      aria-live="polite"
      aria-label={label ?? 'Đang tải'}
    >
      <div className="relative flex items-center justify-center">
        <span className="absolute size-10 rounded-xl bg-brand/25 blur-md animate-brand-halo" aria-hidden="true" />
        <LogoMark className="relative size-10 animate-brand-breathe" />
      </div>
      {label && (
        <span className="font-sans text-[0.8125rem] font-medium text-muted-foreground">{label}</span>
      )}
      <span className="relative h-[3px] w-24 overflow-hidden rounded-full bg-border">
        <span className="absolute inset-y-0 left-0 w-1/3 rounded-full bg-brand animate-loading-sweep" aria-hidden="true" />
      </span>
    </div>
  )
}

/**
 * BrandLoader — màn hình chờ toàn khung, mang thương hiệu HOMIX.
 * Logo "thở" nhẹ + vòng halo lan toả + thanh tiến trình vô định.
 * Dùng cho app/loading.tsx (Suspense boundary của App Router).
 */
export function BrandLoader({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'fixed inset-0 z-[100] flex flex-col items-center justify-center gap-8 bg-background animate-loader-in',
        className,
      )}
      role="status"
      aria-live="polite"
      aria-label="Đang tải HOMIX"
    >
      {/* Logo + halo */}
      <div className="relative flex items-center justify-center">
        <span
          className="absolute size-16 rounded-2xl bg-brand/25 blur-md animate-brand-halo"
          aria-hidden="true"
        />
        <LogoMark className="relative size-16 animate-brand-breathe drop-shadow-[0_8px_24px_rgba(11,92,99,0.25)]" />
      </div>

      {/* Wordmark + thanh tiến trình */}
      <div className="flex flex-col items-center gap-3.5">
        <span className="font-sans text-[1.05rem] font-extrabold tracking-[0.28em] text-foreground">
          HOMIX
        </span>
        <span className="relative h-[3px] w-36 overflow-hidden rounded-full bg-border">
          <span
            className="absolute inset-y-0 left-0 w-1/3 rounded-full bg-brand animate-loading-sweep"
            aria-hidden="true"
          />
        </span>
      </div>
    </div>
  )
}
