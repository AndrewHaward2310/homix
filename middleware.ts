import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { AUTH_COOKIE } from '@/lib/auth/session'
import { verifyToken } from '@/lib/auth/jwt'
import { type Role } from '@/lib/auth/types'

// Quyền theo TIỀN TỐ route (enforce ở server, bổ sung cho <ProtectedRoute> phía
// client). Edge → KHÔNG dùng Prisma; chỉ verify JWT + đọc role. Trang public
// (/, /search, /property/*) KHÔNG nằm trong matcher nên bỏ qua middleware.
const PREFIX_ROLES: { prefix: string; roles: Role[] }[] = [
  { prefix: '/account', roles: ['customer'] },
  { prefix: '/host', roles: ['host'] },
  { prefix: '/agent', roles: ['agent'] },
  { prefix: '/admin', roles: ['admin'] },
]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const match = PREFIX_ROLES.find(
    (r) => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`),
  )
  if (!match) return NextResponse.next()

  const token = req.cookies.get(AUTH_COOKIE)?.value
  const payload = token ? await verifyToken(token) : null

  // Chưa đăng nhập → về /login (giữ đường dẫn muốn tới để quay lại sau).
  if (!payload) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  // Sai vai trò → màn 403 (rõ ràng hơn redirect âm thầm); trang 403 có link
  // về khu vực của chính user.
  if (!match.roles.includes(payload.role)) {
    const url = req.nextUrl.clone()
    url.pathname = '/403'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/account/:path*', '/host/:path*', '/agent/:path*', '/admin/:path*'],
}
