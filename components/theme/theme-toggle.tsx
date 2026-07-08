'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from './theme-provider'
import { cn } from '@/lib/utils'

/**
 * Nút chuyển sáng/tối. `onHero` = đang nằm trên ảnh hero (chữ trắng).
 * Icon chỉ hiện sau khi mounted để không lệch hydration.
 */
export function ThemeToggle({ onHero, className }: { onHero?: boolean; className?: string }) {
  const { theme, mounted, toggle } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Chuyển giao diện sáng' : 'Chuyển giao diện tối'}
      className={cn(
        'flex size-9 items-center justify-center rounded-full transition-colors',
        onHero ? 'text-white hover:bg-white/10' : 'text-foreground hover:bg-secondary',
        className,
      )}
    >
      <Sun
        className={cn(
          'size-[1.15rem] transition-all duration-300',
          mounted && isDark ? 'scale-100 rotate-0 opacity-100' : 'absolute scale-0 -rotate-90 opacity-0',
        )}
        aria-hidden="true"
      />
      <Moon
        className={cn(
          'size-[1.15rem] transition-all duration-300',
          !mounted || !isDark ? 'scale-100 rotate-0 opacity-100' : 'absolute scale-0 rotate-90 opacity-0',
        )}
        aria-hidden="true"
      />
    </button>
  )
}
