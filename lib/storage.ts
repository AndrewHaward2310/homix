// Lớp lưu trữ ảnh — Supabase Storage. CHỈ dùng phía server (service role key).
// Env cần có (xem .env.example): SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/** Tên bucket public chứa ảnh bất động sản. Tạo sẵn trên Supabase (public). */
export const PROPERTY_BUCKET = 'property-images'

const MAX_BYTES = 8 * 1024 * 1024 // 8MB / ảnh
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
const EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
}

let cached: SupabaseClient | null = null

/** Client Supabase (service role) — khởi tạo lười, throw nếu thiếu env. */
function admin(): SupabaseClient {
  if (cached) return cached
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error(
      'Thiếu SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY — chưa cấu hình lưu trữ ảnh.',
    )
  }
  cached = createClient(url, key, { auth: { persistSession: false } })
  return cached
}

/** True nếu đã cấu hình đủ env để upload. Route dùng để trả lỗi thân thiện. */
export function isStorageConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
}

export class StorageError extends Error {}

/** Kiểm tra 1 file upload; throw StorageError nếu sai loại/kích thước. */
export function validateImage(file: File): void {
  if (!ALLOWED.has(file.type)) {
    throw new StorageError('Chỉ chấp nhận ảnh JPG, PNG, WebP hoặc AVIF.')
  }
  if (file.size > MAX_BYTES) {
    throw new StorageError('Ảnh vượt quá 8MB.')
  }
}

/** Kiểm magic bytes (không tin MIME do client khai) — chặn file giả ảnh. */
function sniffImage(buf: Buffer): boolean {
  if (buf.length < 12) return false
  // JPEG FF D8 FF · PNG 89 50 4E 47 · WEBP "RIFF"...."WEBP" · AVIF ftyp
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return true
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return true
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return true
  if (buf.toString('ascii', 4, 8) === 'ftyp') return true // avif/heic
  return false
}

/** Upload 1 ảnh vào bucket theo prefix cho trước → trả public URL. */
async function uploadTo(prefix: string, file: File): Promise<string> {
  validateImage(file)
  const ext = EXT[file.type] ?? 'jpg'
  const path = `${prefix}/${crypto.randomUUID()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())
  if (!sniffImage(buffer)) throw new StorageError('Tệp không phải ảnh hợp lệ.')
  const { error } = await admin()
    .storage.from(PROPERTY_BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: false })
  if (error) throw new StorageError(`Upload thất bại: ${error.message}`)
  const { data } = admin().storage.from(PROPERTY_BUCKET).getPublicUrl(path)
  return data.publicUrl
}

/** Upload 1 ảnh cho 1 căn → trả public URL. */
export function uploadPropertyImage(propertyId: string, file: File): Promise<string> {
  return uploadTo(propertyId, file)
}

/** Upload 1 ảnh ĐÁNH GIÁ (khách tự chụp) → trả public URL. Prefix riêng để dễ rà soát. */
export function uploadReviewImage(propertyId: string, file: File): Promise<string> {
  return uploadTo(`reviews/${propertyId}`, file)
}

/**
 * Xoá ảnh khỏi bucket theo public URL. Chỉ xoá file do ta quản lý (trong bucket);
 * URL tĩnh cũ (/images/*.png) sẽ bị bỏ qua an toàn.
 */
export async function deletePropertyImage(url: string): Promise<void> {
  const marker = `/storage/v1/object/public/${PROPERTY_BUCKET}/`
  const idx = url.indexOf(marker)
  if (idx === -1) return // không phải file trong bucket → bỏ qua
  const path = decodeURIComponent(url.slice(idx + marker.length))
  await admin().storage.from(PROPERTY_BUCKET).remove([path])
}
