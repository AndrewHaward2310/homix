'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

type ThemeContextValue = {
  theme: Theme
  /** true khi đã đọc xong theme thực ở client (tránh nhấp nháy icon). */
  mounted: boolean
  toggle: () => void
  setTheme: (t: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)
const STORAGE_KEY = 'homix_theme'

/**
 * Script chèn vào <head> (layout) — chạy ĐỒNG BỘ trước khi paint để không
 * chớp sáng→tối. Đọc lựa chọn đã lưu, nếu chưa có thì theo hệ điều hành.
 */
export const themeInitScript = `(function(){try{var t=localStorage.getItem('${STORAGE_KEY}');var d=t?t==='dark':matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d);}catch(e){}})()`

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // No-flash script đã set class rồi — chỉ đồng bộ state React theo nó.
    setThemeState(document.documentElement.classList.contains('dark') ? 'dark' : 'light')
    setMounted(true)
  }, [])

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t)
    document.documentElement.classList.toggle('dark', t === 'dark')
    try {
      localStorage.setItem(STORAGE_KEY, t)
    } catch {}
  }, [])

  const toggle = useCallback(() => {
    setTheme(document.documentElement.classList.contains('dark') ? 'light' : 'dark')
  }, [setTheme])

  return (
    <ThemeContext.Provider value={{ theme, mounted, toggle, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme phải nằm trong <ThemeProvider>')
  return ctx
}
