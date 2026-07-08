import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { toUser } from '@/lib/mappers'
import { signToken } from '@/lib/auth/jwt'
import { AUTH_COOKIE, cookieOptions } from '@/lib/auth/session'

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Dữ liệu đăng nhập không hợp lệ.' }, { status: 400 })
  }

  const { email, password } = parsed.data
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  })
  // So mật khẩu kể cả khi không có user để giảm rò rỉ thời gian phản hồi.
  const ok = user ? await bcrypt.compare(password, user.passwordHash) : false
  if (!user || !ok) {
    return NextResponse.json({ error: 'Email hoặc mật khẩu không đúng.' }, { status: 401 })
  }

  const token = await signToken({ sub: user.id, role: user.role })
  const res = NextResponse.json({ user: toUser(user) })
  res.cookies.set(AUTH_COOKIE, token, cookieOptions)
  return res
}
