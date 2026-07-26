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
  /**
   * Tỉ lệ hiển thị tối thiểu để kích hoạt. Mặc định 0.15.
   * Đặt 0 khi phần tử nằm trong vùng CUỘN NGANG (chỉ ló ra một phần ở mép),
   * nếu không nó sẽ không bao giờ đạt ngưỡng và mãi vô hình.
   */
  threshold?: number
  className?: string
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'className'>

/**
 * Reveal — fade-in + trượt lên nhẹ (translateY 16px→0) khi cuộn tới.
 */
export function Reveal<T extends ElementType = 'div'>({
  as,
  delay = 0,
  threshold = 0.15,
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

    // An toàn: nếu phần tử ĐÃ nằm trong khung nhìn ngay khi mount (nội dung trên
    // màn đầu), hiện luôn — không phụ thuộc callback IntersectionObserver có thể
    // trễ, tránh mọi khả năng nội dung above-the-fold kẹt vô hình.
    const rect = node.getBoundingClientRect()
    const vh = window.innerHeight || document.documentElement.clientHeight
    if (rect.top < vh && rect.bottom > 0) {
      setVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true)
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold, rootMargin: '0px 0px -60px 0px' },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [threshold])

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
