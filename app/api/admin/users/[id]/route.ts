import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { toUser } from '@/lib/mappers'
import { isResponse, requireRole } from '@/lib/auth/session'

const bodySchema = z.object({
  agentFunction: z.enum(['sales', 'care', 'both']).optional(),
  role: z.enum(['customer', 'host', 'agent', 'admin']).optional(),
})

// PATCH — admin gán agentFunction / đổi role cho user. Đây là NGUỒN quyết định
// tab mà agent thấy ở Operations portal.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole('admin')
  if (isResponse(auth)) return auth
  const { id } = await params
  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Dữ liệu không hợp lệ.' }, { status: 400 })

  const updated = await prisma.user.update({ where: { id }, data: parsed.data })
  return NextResponse.json({ user: toUser(updated) })
}
