import type { ElementType, ComponentPropsWithoutRef } from 'react'
import { cn } from '@/lib/utils'

type ContainerProps<T extends ElementType> = {
  as?: T
  className?: string
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'className'>

/**
 * Container — rộng thoáng, tận dụng màn hình lớn (tới 1600px ở 2xl) nhưng vẫn
 * giữ gutter để không dính mép. Text vẫn dễ đọc nhờ layout nhiều cột bên trong.
 */
export function Container<T extends ElementType = 'div'>({
  as,
  className,
  ...props
}: ContainerProps<T>) {
  const Comp = (as ?? 'div') as ElementType
  return (
    <Comp
      className={cn(
        'mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-12 xl:px-16 2xl:max-w-[1600px]',
        className,
      )}
      {...props}
    />
  )
}
