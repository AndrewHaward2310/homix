import type { Booking } from '@/types'

// TODO: thay mock bằng fetch API backend của tôi (GET /api/bookings).
// Đơn đặt: hẹn xem nhà (sale/rent_long) và lưu trú ngắn ngày (stay_short).

export const mockBookings: Booking[] = [
  {
    id: 'bk_1',
    propertyId: 'p_1',
    customerId: 'u_customer',
    type: 'sale',
    viewingAt: '2026-07-10T09:30:00+07:00',
    status: 'approved',
    totalVnd: 0,
    createdAt: '2026-07-01T08:12:00+07:00',
  },
  {
    id: 'bk_2',
    propertyId: 'p_3',
    customerId: 'u_customer',
    type: 'stay_short',
    checkIn: '2026-07-18',
    checkOut: '2026-07-21',
    status: 'pending',
    totalVnd: 4_350_000,
    createdAt: '2026-07-02T14:05:00+07:00',
  },
  {
    id: 'bk_3',
    propertyId: 'p_6',
    customerId: 'u_customer_2',
    type: 'stay_short',
    checkIn: '2026-08-01',
    checkOut: '2026-08-03',
    status: 'approved',
    totalVnd: 4_200_000,
    createdAt: '2026-06-28T19:40:00+07:00',
  },
  {
    id: 'bk_4',
    propertyId: 'p_5',
    customerId: 'u_customer_2',
    type: 'rent_long',
    viewingAt: '2026-07-12T16:00:00+07:00',
    status: 'declined',
    totalVnd: 0,
    createdAt: '2026-06-30T10:20:00+07:00',
  },
  {
    id: 'bk_5',
    propertyId: 'p_2',
    customerId: 'u_customer',
    type: 'rent_long',
    viewingAt: '2026-07-15T11:00:00+07:00',
    status: 'pending',
    totalVnd: 0,
    createdAt: '2026-07-03T09:00:00+07:00',
  },
]
