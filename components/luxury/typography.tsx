import type { ElementType, ComponentPropsWithoutRef } from 'react'
import { cn } from '@/lib/utils'

type TypoProps<T extends ElementType> = {
  as?: T
  className?: string
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'className'>

/** Display — 72–88px, letter-spacing âm, leading chặt */
export function Display<T extends ElementType = 'h1'>({ as, className, ...props }: TypoProps<T>) {
  const Comp = (as ?? 'h1') as ElementType
  return (
    <Comp
      className={cn(
        'text-balance font-sans font-bold tracking-[-0.04em] text-foreground',
        'text-[3.25rem] leading-[1.05] sm:text-6xl md:text-7xl lg:text-[5.5rem]',
        className,
      )}
      {...props}
    />
  )
}

/** H1 — 48px */
export function H1<T extends ElementType = 'h1'>({ as, className, ...props }: TypoProps<T>) {
  const Comp = (as ?? 'h1') as ElementType
  return (
    <Comp
      className={cn(
        'text-balance font-sans font-bold tracking-[-0.03em] text-foreground',
        'text-[2rem] leading-[1.08] md:text-[3rem]',
        className,
      )}
      {...props}
    />
  )
}

/** H2 — 32px */
export function H2<T extends ElementType = 'h2'>({ as, className, ...props }: TypoProps<T>) {
  const Comp = (as ?? 'h2') as ElementType
  return (
    <Comp
      className={cn(
        'text-balance font-sans font-semibold tracking-[-0.02em] text-foreground',
        'text-[1.5rem] leading-[1.1] md:text-[2rem]',
        className,
      )}
      {...props}
    />
  )
}

/** H3 — 24px */
export function H3<T extends ElementType = 'h3'>({ as, className, ...props }: TypoProps<T>) {
  const Comp = (as ?? 'h3') as ElementType
  return (
    <Comp
      className={cn(
        'font-sans text-[1.25rem] font-semibold leading-[1.2] tracking-[-0.02em] text-foreground md:text-[1.5rem]',
        className,
      )}
      {...props}
    />
  )
}

/** Body — 17px, line-height 1.6 */
export function Body<T extends ElementType = 'p'>({ as, className, ...props }: TypoProps<T>) {
  const Comp = (as ?? 'p') as ElementType
  return (
    <Comp
      className={cn(
        'text-pretty font-sans text-[1.0625rem] font-normal leading-[1.6] text-muted-foreground',
        className,
      )}
      {...props}
    />
  )
}

/** Caption — 14px, thường dùng cho eyebrow / meta */
export function Caption<T extends ElementType = 'span'>({ as, className, ...props }: TypoProps<T>) {
  const Comp = (as ?? 'span') as ElementType
  return (
    <Comp
      className={cn(
        'font-sans text-[0.875rem] font-normal leading-[1.5] text-muted-foreground',
        className,
      )}
      {...props}
    />
  )
}

/** Eyebrow — nhãn nhỏ in hoa, dùng phía trên tiêu đề */
export function Eyebrow<T extends ElementType = 'span'>({ as, className, ...props }: TypoProps<T>) {
  const Comp = (as ?? 'span') as ElementType
  return (
    <Comp
      className={cn(
        'font-sans text-[0.8125rem] font-medium uppercase tracking-[0.18em] text-brand',
        className,
      )}
      {...props}
    />
  )
}
