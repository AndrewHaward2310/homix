'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ROLE_HOME, type Role } from '@/lib/auth/types'
import { useAuth } from './auth-context'

type ProtectedRouteProps = {
  /** Danh sách vai trò được phép truy cập vùng route này. */
  allow: Role[]
  children: React.ReactNode
}

/**
 * Bọc mỗi vùng route theo vai trò.
 * - Chưa đăng nhập → về /login.
 * - Sai vai trò → về portal của chính user (không cho nhảy chéo role).
 */
export function ProtectedRoute({ allow, children }: ProtectedRouteProps) {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace('/login')
      return
    }
    if (!allow.includes(user.role)) {
      router.replace(ROLE_HOME[user.role])
    }
  }, [loading, user, allow, router])

  // Trạng thái chờ khôi phục phiên / đang điều hướng — màn hình tối giản đúng style.
  if (loading || !user || !allow.includes(user.role)) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <span
            className="size-6 animate-spin rounded-full border-2 border-border border-t-brand"
            aria-hidden="true"
          />
          <span className="font-sans text-sm text-muted-foreground">Đang tải…</span>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
