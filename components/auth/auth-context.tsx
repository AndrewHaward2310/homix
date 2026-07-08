'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useRouter } from 'next/navigation'
import { ROLE_HOME, type Role, type User } from '@/lib/auth/types'

type LoginResult = { ok: true; role: Role } | { ok: false; error: string }

type AuthContextValue = {
  user: User | null
  /** true khi đang khôi phục phiên từ server (tránh nháy UI). */
  loading: boolean
  login: (email: string, password: string) => Promise<LoginResult>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Khôi phục phiên từ cookie httpOnly qua GET /api/auth/me.
  useEffect(() => {
    let active = true
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : { user: null }))
      .then((data) => {
        if (active) setUser(data.user ?? null)
      })
      .catch(() => {
        if (active) setUser(null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const login = useCallback(
    async (email: string, password: string): Promise<LoginResult> => {
      let res: Response
      try {
        res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })
      } catch {
        return { ok: false, error: 'Không kết nối được máy chủ. Vui lòng thử lại.' }
      }

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        return { ok: false, error: data.error ?? 'Đăng nhập thất bại.' }
      }

      const nextUser = data.user as User
      setUser(nextUser)
      router.replace(ROLE_HOME[nextUser.role])
      return { ok: true, role: nextUser.role }
    },
    [router],
  )

  const logout = useCallback(() => {
    setUser(null)
    fetch('/api/auth/logout', { method: 'POST' })
      .catch(() => {})
      .finally(() => router.replace('/login'))
  }, [router])

  const value = useMemo(
    () => ({ user, loading, login, logout }),
    [user, loading, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth phải được dùng bên trong <AuthProvider>.')
  return ctx
}
