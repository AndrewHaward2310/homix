'use client'

import {
  useEffect,
  useRef,
  useState,
  type ElementType,
  type ComponentPropsWithoutRef,
} from 'react'
import { cn } from '@/lib/utils'

type RevealProps<T extends ElementType> = {
  as?: T
  /** Độ trễ (ms) để tạo hiệu ứng lần lượt (stagger) */
  delay?: number
  className?: string
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'className'>

/**
 * Reveal — fade-in + trượt lên nhẹ (translateY 16px→0) khi cuộn tới.
 */
export function Reveal<T extends ElementType = 'div'>({
  as,
  delay = 0,
  className,
  style,
  children,
  ...props
}: RevealProps<T>) {
  const Comp = (as ?? 'div') as ElementType
  const ref = useRef<HTMLElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true)
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <Comp
      ref={ref}
      className={cn('reveal', visible && 'is-visible', className)}
      style={{ transitionDelay: `${delay}ms`, ...style }}
      {...props}
    >
      {children}
    </Comp>
  )
}
