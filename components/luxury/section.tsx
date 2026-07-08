import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '@/lib/utils'
import { Container } from './container'

type SectionProps = ComponentPropsWithoutRef<'section'> & {
  /** Bỏ container mặc định nếu cần layout tràn viền */
  bleed?: boolean
  /** Padding dọc: mặc định chuẩn 64-80px mobile / 120-160px desktop */
  spacing?: 'default' | 'compact' | 'none'
  containerClassName?: string
}

const spacingMap = {
  default: 'py-16 md:py-32 lg:py-40',
  compact: 'py-12 md:py-20',
  none: '',
}

/**
 * Section — wrapper với padding dọc chuẩn của hệ thống.
 */
export function Section({
  bleed = false,
  spacing = 'default',
  className,
  containerClassName,
  children,
  ...props
}: SectionProps) {
  return (
    <section className={cn(spacingMap[spacing], className)} {...props}>
      {bleed ? children : <Container className={containerClassName}>{children}</Container>}
    </section>
  )
}
