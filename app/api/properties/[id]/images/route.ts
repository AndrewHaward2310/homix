import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { toProperty } from '@/lib/mappers'
import { requireUser, isResponse } from '@/lib/auth/session'
import type { User } from '@/types'
import {
  uploadPropertyImage,
  deletePropertyImage,
  isStorageConfigured,
  StorageError,
} from '@/lib/storage'

// Quản lý ảnh của 1 căn. Quyền: admin (mọi căn) hoặc host sở hữu căn đó.
// POST   — upload thêm ảnh (multipart/form-data, field "files")
// PATCH  — sắp xếp lại thứ tự / đặt ảnh bìa (JSON { images: string[] })
// DELETE — xoá 1 ảnh (JSON { url })

type PropertyRow = NonNullable<Awaited<ReturnType<typeof prisma.property.findUnique>>>

/** Nạp căn + kiểm tra quyền quản lý. Trả về row hoặc NextResponse lỗi. */
async function loadManageable(
  id: string,
): Promise<{ user: User; row: PropertyRow } | NextResponse> {
  const user = await requireUser()
  if (isResponse(user)) return user

  const row = await prisma.property.findUnique({ where: { id } })
  if (!row) return NextResponse.json({ error: 'Không tìm thấy bất động sản.' }, { status: 404 })

  const canManage = user.role === 'admin' || row.hostId === user.id
  if (!canManage) {
    return NextResponse.json({ error: 'Bạn không có quyền sửa ảnh căn này.' }, { status: 403 })
  }
  return { user, row }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const gate = await loadManageable(id)
  if (isResponse(gate)) return gate

  if (!isStorageConfigured()) {
    return NextResponse.json(
      { error: 'Chưa cấu hình lưu trữ ảnh (SUPABASE_URL / SERVICE_ROLE_KEY).' },
      { status: 503 },
    )
  }

  const form = await req.formData().catch(() => null)
  if (!form) return NextResponse.json({ error: 'Dữ liệu tải lên không hợp lệ.' }, { status: 400 })

  const files = form.getAll('files').filter((f): f is File => f instanceof File && f.size > 0)
  if (files.length === 0) {
    return NextResponse.json({ error: 'Không có ảnh nào được chọn.' }, { status: 400 })
  }
  if (files.length > 20) {
    return NextResponse.json({ error: 'Tối đa 20 ảnh mỗi lần.' }, { status: 400 })
  }

  try {
    const urls: string[] = []
    for (const file of files) urls.push(await uploadPropertyImage(id, file))
    const updated = await prisma.property.update({
      where: { id },
      data: { images: [...gate.row.images, ...urls] },
    })
    return NextResponse.json({ property: toProperty(updated) }, { status: 201 })
  } catch (err) {
    const msg = err instanceof StorageError ? err.message : 'Upload thất bại.'
    const status = err instanceof StorageError ? 400 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}

// Ảnh có thể là URL Supabase HOẶC path tĩnh tương đối (/images/..) → chỉ cần string.
// An toàn nhờ ràng buộc "sameset" bên dưới (phải trùng đúng tập ảnh hiện có).
const reorderSchema = z.object({ images: z.array(z.string().min(1)).max(60) })

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const gate = await loadManageable(id)
  if (isResponse(gate)) return gate

  const parsed = reorderSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Danh sách ảnh không hợp lệ.' }, { status: 400 })
  }

  // Chỉ cho phép sắp xếp lại — tập ảnh mới phải trùng đúng tập ảnh hiện có.
  const current = [...gate.row.images].sort()
  const next = [...parsed.data.images].sort()
  const sameset =
    current.length === next.length && current.every((v, i) => v === next[i])
  if (!sameset) {
    return NextResponse.json(
      { error: 'Chỉ được sắp xếp lại các ảnh hiện có (dùng POST để thêm, DELETE để xoá).' },
      { status: 400 },
    )
  }

  const updated = await prisma.property.update({
    where: { id },
    data: { images: parsed.data.images },
  })
  return NextResponse.json({ property: toProperty(updated) })
}

const deleteSchema = z.object({ url: z.string().min(1) })

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const gate = await loadManageable(id)
  if (isResponse(gate)) return gate

  const parsed = deleteSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: 'Thiếu URL ảnh cần xoá.' }, { status: 400 })
  }
  const { url } = parsed.data
  if (!gate.row.images.includes(url)) {
    return NextResponse.json({ error: 'Ảnh không thuộc căn này.' }, { status: 400 })
  }

  await deletePropertyImage(url).catch(() => {}) // best-effort xoá file; vẫn gỡ khỏi DB
  const updated = await prisma.property.update({
    where: { id },
    data: { images: gate.row.images.filter((u) => u !== url) },
  })
  return NextResponse.json({ property: toProperty(updated) })
}
