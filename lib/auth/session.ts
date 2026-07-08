// Phiên đăng nhập phía server: đọc cookie JWT, xác thực, nạp User từ DB.
// Dùng trong Route Handlers và Server Components.
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { toUser } from '@/lib/mappers'
import type { Role, User } from '@/types'
import { verifyToken } from './jwt'

export const AUTH_COOKIE = 'oceanpark_token'

/** Cấu hình cookie chung khi set/xoá token. */
export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24 * 7, // 7 ngày, khớp hạn JWT
}

/** Trả User hiện tại từ cookie, hoặc null nếu chưa đăng nhập / token hỏng. */
export async function getSessionUser(): Promise<User | null> {
  const token = (await cookies()).get(AUTH_COOKIE)?.value
  if (!token) return null
  const payload = await verifyToken(token)
  if (!payload) return null
  const user = await prisma.user.findUnique({ where: { id: payload.sub } })
  return user ? toUser(user) : null
}

/** 401 nếu chưa đăng nhập; ngược lại trả User. */
export async function requireUser(): Promise<User | NextResponse> {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 })
  return user
}

/** 401 nếu chưa đăng nhập, 403 nếu sai vai trò; ngược lại trả User. */
export async function requireRole(...roles: Role[]): Promise<User | NextResponse> {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Chưa đăng nhập.' }, { status: 401 })
  if (!roles.includes(user.role)) {
    return NextResponse.json({ error: 'Không có quyền truy cập.' }, { status: 403 })
  }
  return user
}

/** Nhận diện kết quả require* là lỗi (NextResponse) hay User. */
export function isResponse(v: unknown): v is NextResponse {
  return v instanceof NextResponse
}
