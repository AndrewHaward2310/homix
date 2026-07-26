import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// POST /api/properties/[id]/view — ghi nhận 1 lượt xem trang chi tiết.
// Throttle theo (IP + căn): mỗi IP chỉ tính 1 lượt / căn / 30 phút để lượt xem
// phản ánh quan tâm thật, không bị F5 thổi phồng. Fire-and-forget từ client;
// luôn trả 204 (kể cả khi bị throttle) để không lộ trạng thái hay chặn UI.
// Lưu ý: throttle in-memory chỉ hiệu lực trong 1 process (nhiều instance/serverless
// sẽ có bộ đếm riêng). Đủ tốt cho "lượt xem" — tín hiệu mềm, không phải tiền/tồn kho;
// nếu cần chính xác tuyệt đối thì chuyển sang Redis. viewCount cố ý chấp nhận sai số nhỏ.
const WINDOW_MS = 30 * 60 * 1000
const MAX_ENTRIES = 10000
const seen = new Map<string, number>()

/** True nếu (ip,căn) chưa được tính trong cửa sổ → nên tăng. KHÔNG tự ghi key ở đây. */
function isFresh(key: string): boolean {
  const last = seen.get(key)
  return !last || Date.now() - last >= WINDOW_MS
}

/** Ghi mốc đã tính + chặn Map phình: xoá entry hết hạn, nếu vẫn quá thì evict cũ nhất. */
function remember(key: string): void {
  const now = Date.now()
  seen.set(key, now)
  if (seen.size > MAX_ENTRIES) {
    for (const [k, t] of seen) if (now - t >= WINDOW_MS) seen.delete(k)
    // Map giữ thứ tự chèn → xoá các key cũ nhất cho tới khi về dưới trần (chặn DoS bộ nhớ).
    while (seen.size > MAX_ENTRIES) {
      const oldest = seen.keys().next().value
      if (oldest === undefined) break
      seen.delete(oldest)
    }
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  const key = `${ip}:${id}`

  if (isFresh(key)) {
    // updateMany: không throw nếu id không tồn tại (bỏ qua an toàn).
    const res = await prisma.property.updateMany({
      where: { id },
      data: { viewCount: { increment: 1 } },
    })
    // Chỉ khoá cửa sổ khi thực sự tăng được (id tồn tại + DB ok) — lỗi tạm thời còn retry được.
    if (res.count > 0) remember(key)
  }
  return new NextResponse(null, { status: 204 })
}
