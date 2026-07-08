// Ocean Park — Booking service (client → API).
// Lưu ý: totalVnd LUÔN do server tính; client chỉ gửi ngày/loại.
import type { Booking, PropertyType } from '@/types'

export type CreateBookingInput = {
  propertyId: string
  type: PropertyType
  /** stay_short: ngày nhận/trả phòng (YYYY-MM-DD). */
  checkIn?: string
  checkOut?: string
  /** sale/rent_long: thời điểm hẹn xem (ISO). */
  viewingAt?: string
}

/** Đơn đặt trong phạm vi vai trò người đăng nhập (server tự lọc). */
export async function getBookings(): Promise<Booking[]> {
  const res = await fetch('/api/bookings')
  if (!res.ok) throw new Error(`GET /api/bookings thất bại (${res.status})`)
  const data = (await res.json()) as { bookings: Booking[] }
  return data.bookings
}

export type CreateBookingResult =
  | { ok: true; booking: Booking }
  | { ok: false; error: string }

export async function createBooking(
  input: CreateBookingInput,
): Promise<CreateBookingResult> {
  const res = await fetch('/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) return { ok: false, error: data.error ?? 'Đặt chỗ thất bại.' }
  return { ok: true, booking: data.booking as Booking }
}

/** Cập nhật trạng thái đơn: khách huỷ / host duyệt-từ chối. */
export async function updateBooking(
  id: string,
  action: 'cancel' | 'approve' | 'decline',
): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(`/api/bookings/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }),
  })
  if (res.ok) return { ok: true }
  const data = await res.json().catch(() => ({}))
  return { ok: false, error: data.error }
}

export const bookingService = { getBookings, createBooking, updateBooking }
