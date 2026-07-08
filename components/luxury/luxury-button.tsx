import type { ComponentPropsWithoutRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const luxuryButtonVariants = cva(
  cn(
    'group inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap font-sans font-medium',
    'outline-none transition-all duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
    'focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'disabled:pointer-events-none disabled:opacity-50',
    "[&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:transition-transform [&_svg]:duration-[400ms] [&_svg]:ease-[cubic-bezier(0.22,1,0.36,1)]",
  ),
  {
    variants: {
      variant: {
        // Primary — pill, accent ocean sâu
        primary:
          'rounded-full bg-primary text-primary-foreground hover:brightness-110 active:scale-[0.98]',
        // Ghost — tối giản, không viền cứng
        ghost:
          'rounded-full text-foreground hover:bg-secondary active:scale-[0.98]',
        // Glass — nền bán trong suốt + blur, dùng trên ảnh
        glass:
          'rounded-full border border-glass-border bg-glass text-foreground backdrop-blur-xl hover:bg-glass/90 active:scale-[0.98]',
        // Outline nhẹ (control radius 12px)
        outline:
          'rounded-lg border border-border bg-background text-foreground hover:bg-secondary active:scale-[0.98]',
      },
      size: {
        sm: 'h-9 px-4 text-sm',
        md: 'h-11 px-6 text-[0.95rem]',
        lg: 'h-14 px-8 text-[1.0625rem]',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
)

export type LuxuryButtonProps = ComponentPropsWithoutRef<'button'> &
  VariantProps<typeof luxuryButtonVariants>

export function LuxuryButton({
  className,
  variant,
  size,
  ...props
}: LuxuryButtonProps) {
  return (
    <button
      className={cn(luxuryButtonVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { luxuryButtonVariants }
