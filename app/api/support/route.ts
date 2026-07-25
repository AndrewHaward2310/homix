import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'

// POST /api/support — PUBLIC: khách để lại lời nhắn từ chatbox hỗ trợ.
// Tạo một Lead (stage 'new') gán cho chuyên viên chăm sóc → hiện ở /agent/leads.
const schema = z.object({
  name: z.string().trim().min(1).max(120),
  contact: z.string().trim().min(3).max(160), // SĐT hoặc email
  message: z.string().trim().min(1).max(1000),
  // Honeypot: trường ẩn, người thật để trống; bot điền → xử lý ở dưới (im lặng).
  company: z.string().max(200).optional(),
})

// Rate-limit tối thiểu (in-memory, theo IP). Trên serverless là per-instance nên
// không tuyệt đối, nhưng chặn được spam thô sơ mà không cần hạ tầng ngoài.
const WINDOW_MS = 10 * 60 * 1000
const MAX_PER_WINDOW = 5
const hits = new Map<string, number[]>()

function rateLimited(ip: string): boolean {
  const now = Date.now()
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS)
  if (arr.length >= MAX_PER_WINDOW) {
    hits.set(ip, arr)
    return true
  }
  arr.push(now)
  hits.set(ip, arr)
  // Dọn rác thỉnh thoảng để Map không phình.
  if (hits.size > 5000) for (const [k, v] of hits) if (v.every((t) => now - t >= WINDOW_MS)) hits.delete(k)
  return false
}

export async function POST(req: Request) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: 'Bạn gửi hơi nhanh. Vui lòng thử lại sau ít phút.' },
      { status: 429 },
    )
  }

  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Nội dung không hợp lệ.' },
      { status: 400 },
    )
  }
  const { name, contact, message, company } = parsed.data
  // Bot điền honeypot → giả vờ thành công, không lưu.
  if (company) return NextResponse.json({ ok: true })

  // Gán cho chuyên viên chăm sóc (care/both) nếu có, không thì bất kỳ agent nào.
  const agent =
    (await prisma.user.findFirst({
      where: { role: 'agent', agentFunction: { in: ['care', 'both'] } },
      select: { id: true },
    })) ?? (await prisma.user.findFirst({ where: { role: 'agent' }, select: { id: true } }))

  if (!agent) {
    // Không có ai nhận lead → báo lỗi thật thay vì hứa hão (Lead cần assignedAgentId).
    console.error('[support] không tìm thấy agent để gán lead')
    return NextResponse.json(
      { error: 'Hệ thống hỗ trợ đang bận. Vui lòng gọi hotline hoặc thử lại sau.' },
      { status: 503 },
    )
  }

  await prisma.lead.create({
    data: {
      customerName: name,
      contact,
      needSummary: `[Chat hỗ trợ] ${message}`,
      stage: 'new',
      assignedAgentId: agent.id,
    },
  })
  return NextResponse.json({ ok: true }, { status: 201 })
}
