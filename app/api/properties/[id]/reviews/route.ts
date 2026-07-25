import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { toProperty, toReview } from '@/lib/mappers'
import { isResponse, requireUser } from '@/lib/auth/session'
import { StorageError, deletePropertyImage, isStorageConfigured, uploadReviewImage } from '@/lib/storage'

// Đánh giá của một bất động sản (kèm tên/avatar khách).
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const rows = await prisma.review.findMany({
    where: { propertyId: id },
    include: { customer: true },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ reviews: rows.map(toReview) })
}

const MAX_IMAGES = 6
const MAX_TOTAL_BYTES = 24 * 1024 * 1024 // trần tổng dung lượng ảnh / lần gửi

// POST /api/properties/[id]/reviews — khách ĐÃ ĐĂNG NHẬP gửi đánh giá (sao + bình
// luận + ảnh tự chụp). Mỗi khách 1 đánh giá/căn (gửi lại = cập nhật). Nhận multipart:
// rating, comment, images[] (file). Sau khi lưu, tính lại ratingAvg/reviewCount của căn.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const auth = await requireUser()
  if (isResponse(auth)) return auth
  const user = auth
  if (user.role !== 'customer') {
    return NextResponse.json({ error: 'Chỉ khách hàng được đánh giá.' }, { status: 403 })
  }

  const property = await prisma.property.findUnique({ where: { id }, select: { id: true } })
  if (!property) return NextResponse.json({ error: 'Không tìm thấy bất động sản.' }, { status: 404 })

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Dữ liệu không hợp lệ.' }, { status: 400 })
  }

  // KHÔNG tự làm tròn: rating phải là số nguyên 1..5 đúng contract.
  const rating = Number(form.get('rating'))
  const comment = String(form.get('comment') ?? '').trim()
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Số sao phải từ 1 đến 5.' }, { status: 400 })
  }
  if (comment.length < 1 || comment.length > 2000) {
    return NextResponse.json({ error: 'Nội dung đánh giá từ 1–2000 ký tự.' }, { status: 400 })
  }

  // Chỉ khách ĐÃ TỪNG đặt căn này mới được đánh giá (đánh giá xác thực, chống spam).
  const booking = await prisma.booking.findFirst({
    where: { propertyId: id, customerId: user.id, status: { notIn: ['cancelled', 'declined'] } },
    select: { id: true },
  })
  if (!booking) {
    return NextResponse.json(
      { error: 'Chỉ khách đã đặt/lưu trú tại căn này mới được đánh giá.' },
      { status: 403 },
    )
  }

  const files = form.getAll('images').filter((f): f is File => f instanceof File && f.size > 0)
  if (files.length > MAX_IMAGES) {
    return NextResponse.json({ error: `Tối đa ${MAX_IMAGES} ảnh.` }, { status: 400 })
  }
  if (files.reduce((s, f) => s + f.size, 0) > MAX_TOTAL_BYTES) {
    return NextResponse.json({ error: 'Tổng dung lượng ảnh vượt giới hạn.' }, { status: 400 })
  }

  // Upload ảnh (nếu có). Thiếu cấu hình storage mà vẫn gửi ảnh → báo rõ.
  let imageUrls: string[] = []
  if (files.length) {
    if (!isStorageConfigured()) {
      return NextResponse.json(
        { error: 'Tính năng ảnh chưa được cấu hình. Vui lòng gửi đánh giá không kèm ảnh.' },
        { status: 503 },
      )
    }
    try {
      // Upload tuần tự để nếu lỗi giữa chừng còn dọn được các ảnh đã lên (không orphan).
      for (const f of files) imageUrls.push(await uploadReviewImage(id, f))
    } catch (e) {
      await Promise.allSettled(imageUrls.map((u) => deletePropertyImage(u)))
      const msg = e instanceof StorageError ? e.message : 'Tải ảnh thất bại.'
      return NextResponse.json({ error: msg }, { status: 400 })
    }
  }

  // Mỗi khách 1 đánh giá/căn → UPSERT theo unique (propertyId, customerId): atomic, hết race.
  const prev = await prisma.review.findUnique({
    where: { propertyId_customerId: { propertyId: id, customerId: user.id } },
    select: { images: true },
  })
  const updatedProperty = await prisma.$transaction(async (tx) => {
    await tx.review.upsert({
      where: { propertyId_customerId: { propertyId: id, customerId: user.id } },
      create: { propertyId: id, customerId: user.id, rating, comment, images: imageUrls },
      update: { rating, comment, images: imageUrls },
    })
    const agg = await tx.review.aggregate({
      where: { propertyId: id },
      _avg: { rating: true },
      _count: true,
    })
    return tx.property.update({
      where: { id },
      data: {
        ratingAvg: agg._count > 0 && agg._avg.rating ? Math.round(agg._avg.rating * 10) / 10 : null,
        reviewCount: agg._count,
      },
    })
  })

  // Ghi DB xong → dọn ảnh cũ không còn dùng khỏi bucket (tránh orphan khi sửa review).
  if (prev) {
    const stale = prev.images.filter((u) => !imageUrls.includes(u))
    if (stale.length) await Promise.allSettled(stale.map((u) => deletePropertyImage(u)))
  }

  const rows = await prisma.review.findMany({
    where: { propertyId: id },
    include: { customer: true },
    orderBy: { createdAt: 'desc' },
  })
  // Trả cả property đã cập nhật để UI đồng bộ ratingAvg/reviewCount ngay.
  return NextResponse.json(
    { reviews: rows.map(toReview), property: toProperty(updatedProperty) },
    { status: 201 },
  )
}
